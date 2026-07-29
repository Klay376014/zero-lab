"""Resolve a PokeAPI sprite path for every Champions form label.

Three different naming mechanisms are in play, so candidates are generated from both
PokeAPI source tables and then verified over the network — nothing is assumed:
  * separate varieties (Megas, Hisuian, Aegislash stances)  -> sprites/pokemon/<pokemon_id>.png
  * cosmetic forms (Vivillon patterns, Furfrou trims)       -> sprites/pokemon/<dex>-<form_identifier>.png
  * gender differences (Pyroar, Meowstic, Basculegion)      -> sprites/pokemon/[female/]<dex>.png
"""
import csv, json, re, collections

# These are Bulbapedia's LABEL vocabulary only. They must never be stripped from a
# PokeAPI identifier: 'flower' is noise in "Red Flower" but meaningful in Alcremie's
# 'vanilla-cream-flower-sweet', and stripping it there makes a non-default form look
# like the tightest match and silently beat the real default.
GENERIC = {'form','forme','pattern','trim','variety','mode','breed','of','flower'}
# Bulbapedia names regions as adjectives and sizes in its own words; PokeAPI uses the
# bare place name and a different size vocabulary. Same referent, different string.
SYN = {'alolan':'alola','hisuian':'hisui','galarian':'galar','paldean':'paldea',
       'medium':'average','jumbo':'super'}

def _split(s):
    return [p for p in re.split(r'[^a-z0-9]+', s.lower().replace('é','e')) if p]

def toks(s):
    """Tokenise a Bulbapedia label: drop label-only noise, map to PokeAPI vocabulary."""
    return {SYN.get(p, p) for p in _split(s) if p not in GENERIC}

def itoks(s):
    """Tokenise a PokeAPI identifier verbatim — its words all carry meaning."""
    return set(_split(s))

# ---- load PokeAPI tables ----
pokemon = list(csv.DictReader(open('pokemon.csv', encoding='utf-8')))
forms   = list(csv.DictReader(open('pokemon_forms.csv', encoding='utf-8')))

by_species = collections.defaultdict(list)          # species_id -> variety rows
for p in pokemon:
    by_species[int(p['species_id'])].append(p)

forms_by_pokemon = collections.defaultdict(list)    # pokemon_id -> form rows
for f in forms:
    forms_by_pokemon[int(f['pokemon_id'])].append(f)

# ---- what we need to resolve ----
champs = json.load(open('champions.json', encoding='utf-8'))
body = [r for r in champs['body'] if r['dex'] != 923]

need = []   # (dex, speciesName, kind, label, types)
for r in body:
    if r['form']:
        need.append((r['dex'], r['name'], 'regional', r['form'], r['types']))
for r in champs['megas']:
    need.append((r['dex'], r['name'], 'mega', r['form'] or ('Mega ' + r['name']), r['types']))
for r in champs['other_forms']:
    if r['form']:
        need.append((r['dex'], r['name'], 'other', r['form'], r['types']))

def candidates(dex, species_name):
    """Every plausible (token-set, [ordered sprite paths], source) triple.

    A label can legitimately map to more than one filename convention, and which one
    exists is not derivable from the tables — a species' *default* form carries no
    suffix (Furfrou Natural is 676.png, not 676-natural.png). So emit an ordered list
    per candidate and let the network decide.
    """
    out = []
    sp_tok = itoks(species_name)
    for v in by_species.get(dex, []):
        vid, is_def = int(v['id']), v['is_default'] == '1'
        vt = itoks(v['identifier']) - sp_tok
        if vt:
            paths = [f'{vid}.png'] if not is_def else [f'{dex}.png']
            out.append((vt, paths, 'variety:' + v['identifier'], is_def, vid))
        for f in forms_by_pokemon.get(vid, []):
            fi = f['form_identifier'].strip()
            ft = itoks(fi) - sp_tok if fi else set()
            if not ft:
                continue
            fdef = f['is_default'] == '1'
            paths = []
            if is_def:
                paths += [f'{dex}-{fi}.png', f'{dex}.png']
            else:
                paths += [f'{vid}.png', f'{dex}-{fi}.png']
            # stats/abilities hang off the VARIETY, so a cosmetic form inherits its
            # parent's pokemon_id — which is exactly right (Vivillon patterns share stats)
            out.append((ft, paths, 'form:' + f['identifier'], fdef, vid))
    return out

def dedupe(seq):
    seen, out = set(), []
    for x in seq:
        if x not in seen:
            seen.add(x); out.append(x)
    return out

resolved, unresolved = [], []
for dex, name, kind, label, types in need:
    lt = toks(label) - toks(name)
    cands = candidates(dex, name)
    if lt in ({'male'}, {'female'}):
        # gender split: either a female sprite variant or a distinct -female variety
        fem = [c for c in cands if 'female' in c[0]]
        paths = ([f'{dex}.png'] if lt == {'male'}
                 else [f'female/{dex}.png'] + [p for c in fem for p in c[1]])
        pid = dex if lt == {'male'} else (fem[0][4] if fem else dex)
        resolved.append(dict(dex=dex, name=name, kind=kind, label=label, types=types,
                            paths=dedupe(paths), via='gender', fdef=(lt == {'male'}), pid=pid))
        continue
    exact  = sorted([c for c in cands if c[0] == lt], key=lambda c: len(c[1]))
    subset = sorted([c for c in cands if lt and lt < c[0]], key=lambda c: (len(c[0]), len(c[1])))
    ranked = exact + subset
    if ranked:
        paths = dedupe([p for c in ranked for p in c[1]])
        resolved.append(dict(dex=dex, name=name, kind=kind, label=label, types=types,
                            paths=paths, via=ranked[0][2], fdef=ranked[0][3], pid=ranked[0][4]))
    else:
        unresolved.append(dict(dex=dex, name=name, kind=kind, label=label, types=types,
                              tokens=sorted(lt), cands=[(sorted(c[0]), c[2]) for c in cands][:14]))

json.dump({'resolved': resolved, 'unresolved': unresolved},
          open('forms_resolved.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

print(f'need={len(need)}  resolved={len(resolved)}  unresolved={len(unresolved)}')
print('by kind:', collections.Counter(r['kind'] for r in resolved))
print()
if unresolved:
    print('--- UNRESOLVED ---')
    for u in unresolved:
        print(f"  {u['dex']:4d} {u['name']:13s} [{u['kind']:8s}] {u['label']!r} tokens={u['tokens']}")
        for t, src in u['cands'][:6]:
            print(f'            cand {t} <- {src}')
