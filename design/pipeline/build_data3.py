"""Final dataset: 208 species, each form carrying base stats, abilities and its
Champions learnset.

Provenance, deliberately split by what each source is actually authoritative for:
  * roster / forms / move mechanics -> Bulbapedia Champions pages (the game's own numbers)
  * base stats / abilities / zh-Hant naming -> PokeAPI source CSVs
A form's stats and abilities hang off its PokeAPI variety id, so cosmetic forms
correctly inherit their parent's (Vivillon patterns) while real variants don't
(Mega Charizard X, Lycanroc's three, Basculegion M/F).
"""
import csv, json, collections

champs   = json.load(open('champions.json', encoding='utf-8'))
verified = json.load(open('forms_verified.json', encoding='utf-8'))['resolved']
learn    = json.load(open('learn.json', encoding='utf-8'))
zhn      = json.load(open('zh_names.json', encoding='utf-8'))
ZH_SPECIES, ZH_GENUS, ZH_FORM = zhn['species'], zhn['genus'], zhn['forms']

body = [r for r in champs['body'] if r['dex'] != 923]

GEN = [(1,151,1),(152,251,2),(252,386,3),(387,493,4),(494,649,5),
       (650,721,6),(722,809,7),(810,905,8),(906,1025,9)]
def gen(dx):
    for lo, hi, g in GEN:
        if lo <= dx <= hi: return g
    raise ValueError(dx)

# ---------- PokeAPI: stats ----------
STAT_ORDER = [1, 2, 3, 4, 5, 6]          # hp, atk, def, spa, spd, spe
stats = collections.defaultdict(dict)
for r in csv.DictReader(open('pokemon_stats.csv', encoding='utf-8')):
    stats[int(r['pokemon_id'])][int(r['stat_id'])] = int(r['base_stat'])
def stat_line(pid):
    s = stats[pid]
    assert len(s) >= 6, f'incomplete stats for pokemon_id {pid}'
    return [s[i] for i in STAT_ORDER]

# ---------- PokeAPI: abilities ----------
def fold(s):
    return s.replace('’', "'").replace('‘', "'")
an = list(csv.DictReader(open('ability_names.csv', encoding='utf-8')))
ab_en = {r['ability_id']: r['name'] for r in an if r['local_language_id'] == '9'}
ab_zh = {r['ability_id']: r['name'] for r in an if r['local_language_id'] == '4'}
# Flavour text per language, taken from the newest version group each language has.
# An English ability name over a Chinese description would be a jarring mix, so both
# languages are carried and the UI picks.
_flav = list(csv.DictReader(open('ability_flavor_text.csv', encoding='utf-8')))
def desc_for(lang_id):
    # Newest text PER ABILITY, not one global version group: languages differ in which
    # groups they cover, and picking a single group silently drops most abilities.
    best = {}
    for r in _flav:
        if r['language_id'] != lang_id:
            continue
        vg = int(r['version_group_id'])
        cur = best.get(r['ability_id'])
        if cur is None or vg > cur[0]:
            best[r['ability_id']] = (vg, ' '.join(r['flavor_text'].split()))
    return {k: v[1] for k, v in best.items()}
ab_desc    = desc_for('4')
ab_desc_en = desc_for('9')

poke_ab = collections.defaultdict(list)
for r in csv.DictReader(open('pokemon_abilities.csv', encoding='utf-8')):
    poke_ab[int(r['pokemon_id'])].append(
        (int(r['slot']), r['ability_id'], r['is_hidden'] == '1'))

ability_table, ability_idx = [], {}
def ability_ref(aid):
    if aid not in ability_idx:
        ability_idx[aid] = len(ability_table)
        ability_table.append({'n': fold(ab_en.get(aid, '?')),
                              'z': ab_zh.get(aid, ''),
                              'd': ab_desc.get(aid, ''),
                              'de': ab_desc_en.get(aid, '')})
    return ability_idx[aid]
def ability_line(pid):
    out = []
    for _slot, aid, hidden in sorted(poke_ab[pid]):
        out.append([ability_ref(aid), 1] if hidden else [ability_ref(aid)])
    return out

# ---------- form assembly ----------
vlook = {(r['dex'], r['kind'], r['label']): r for r in verified}
base_rows = {r['dex']: r for r in body if not r['form']}
regional  = collections.defaultdict(list)
for r in body:
    if r['form']: regional[r['dex']].append(r)
others = collections.defaultdict(list)
for r in champs['other_forms']:
    if r['form']: others[r['dex']].append(r)
megas = collections.defaultdict(list)
for r in champs['megas']:
    megas[r['dex']].append(r)

def entry(dex, kind, label, types, cur, note, added, anchor_added):
    v = vlook.get((dex, kind, label))
    assert v and v['path'], f'no verified sprite for {dex} {kind} {label!r}'
    zh = ZH_FORM.get(f'{dex}|{kind}|{label}')
    assert zh, f'no zh label for {dex} {kind} {label!r}'
    e = {'l': label, 'lz': zh, 'k': kind, 't': types, 's': v['path'],
         'st': stat_line(v['pid']), 'ab': ability_line(v['pid'])}
    if v.get('approx'):       e['a'] = 1
    if not cur:               e['x'] = 1
    if note:                  e['n'] = note
    if added != anchor_added: e['v'] = added
    return e

species = []
for dx in sorted({r['dex'] for r in body}):
    base  = base_rows.get(dx)
    named = others.get(dx, [])
    named_default = [r for r in named
                     if (vlook.get((dx, 'other', r['form'])) or {}).get('fdef')]
    anchor = base or regional[dx][0]
    av = anchor['added']
    forms = []

    if named:
        ordered = named_default + [r for r in named if r not in named_default]
        for r in ordered:
            forms.append(entry(dx, 'other', r['form'], r['types'],
                               r['in_current_roster'], r['roster_note'], r['added'], av))
        if base and not named_default:
            forms.insert(0, {'l': '', 'lz': '', 'k': 'base', 't': base['types'],
                             's': f'{dx}.png', 'st': stat_line(dx), 'ab': ability_line(dx)})
    elif base:
        forms.append({'l': '', 'lz': '', 'k': 'base', 't': base['types'],
                      's': f'{dx}.png', 'st': stat_line(dx), 'ab': ability_line(dx)})

    for r in regional.get(dx, []):
        forms.append(entry(dx, 'regional', r['form'], r['types'],
                           r['in_current_roster'], r['roster_note'], r['added'], av))
    for r in megas.get(dx, []):
        forms.append(entry(dx, 'mega', r['form'], r['types'],
                           r['in_current_roster'], r['roster_note'], r['added'], av))
    assert forms, dx

    # ---- attach learnset sections ----
    secs = learn['sections'][anchor['name']]
    by_sig = collections.defaultdict(list)
    for i, s in enumerate(secs):
        by_sig['/'.join(s['types'])].append(i)
    used = collections.Counter()
    for f in forms:
        sig = '/'.join(f['t'])
        if sig in by_sig:
            lst = by_sig[sig]
            k = used[sig]; used[sig] += 1
            f['si'] = lst[min(k, len(lst) - 1)]
        else:
            f['si'] = 0        # a Mega's new typing inherits the species learnset
    zh_name = ZH_SPECIES.get(str(dx))
    assert zh_name, f'no zh species name for {dx}'
    species.append({
        'd': dx, 'm': anchor['name'], 'mz': zh_name,
        'gz': ZH_GENUS.get(str(dx), ''), 'g': gen(dx), 'v': av,
        'x': 0 if anchor['in_current_roster'] else 1, 'n': anchor['roster_note'],
        'f': forms,
        'sec': [s['mv'] for s in secs],
    })

# ---------- checks ----------
assert len(species) == 208
assert sum(1 for s in species for f in s['f'] if f['k'] == 'mega') == 75
assert sum(1 for s in species for f in s['f'] if f['k'] == 'regional') == 16
for s in species:
    for f in s['f']:
        assert len(f['st']) == 6 and all(isinstance(v, int) for v in f['st'])
        assert f['ab'], f'no abilities: {s["m"]} {f["l"]}'
        assert 0 <= f['si'] < len(s['sec'])

# every form whose own typing exists as a section must get THAT section
bad = []
for s in species:
    sigs = ['/'.join(x['types']) for x in learn['sections'][s['m']]]
    for f in s['f']:
        sig = '/'.join(f['t'])
        if sig in sigs and sigs[f['si']] != sig:
            bad.append((s['m'], f['l'], sig, sigs[f['si']]))
assert not bad, bad

meta = {
    'species': len(species),
    'formEntries': sum(len(s['f']) for s in species),
    'megas': 75, 'regional': 16,
    'moves': len(learn['moves']),
    'moveRefs': sum(len(m) for s in species for m in s['sec']),
    'abilities': len(ability_table),
    'zhMoves': sum(1 for m in learn['moves'] if m['z']),
    'zhAbilities': sum(1 for a in ability_table if a['z']),
    'abilDescZh': sum(1 for a in ability_table if a['d']),
    'abilDescEn': sum(1 for a in ability_table if a['de']),
    'roster': 'Regular Roster M-B (current until 2026-09-02)',
    'source': 'Bulbapedia Champions wikitext (roster, forms, move mechanics) + '
              'PokeAPI CSVs (base stats, abilities, zh-Hant naming); sprites HTTP-verified',
}
# `moveFlags` names every flag id a move record can reference — all 21, including the four no
# screen draws. It sits at the top level rather than in `meta` because `meta` holds figures about
# the dataset and this is a lookup table the app reads per move.
out = {'meta': meta, 'species': species,
       'moves': learn['moves'], 'abilities': ability_table,
       'moveFlags': learn['moveFlags']}
json.dump(out, open('dex3.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

print('species', meta['species'], '| forms', meta['formEntries'],
      '| moves', meta['moves'], '| move refs', meta['moveRefs'],
      '| abilities', meta['abilities'], '| flag names', len(out['moveFlags']))
print('multi-section species:',
      dict(sorted(collections.Counter(len(s['sec']) for s in species).items())))
print('bytes:', len(open('dex3.json', encoding='utf-8').read()))
print('\nspot checks:')
for dx, want in ((6,'Mega Charizard X'), (26,'Alolan Form'), (745,'Midnight Form'),
                 (678,'Female'), (128,'Paldean Form (Blaze Breed)')):
    s = next(x for x in species if x['d'] == dx)
    f = next(x for x in s['f'] if x['l'] == want)
    ab = ' / '.join((ability_table[a[0]]['z'] or ability_table[a[0]]['n'])
                    + ('（隱藏）' if len(a) > 1 else '') for a in f['ab'])
    print(f"  {s['m']:12s} {want:28s} st={f['st']} sum={sum(f['st']):3d} "
          f"si={f['si']} moves={len(s['sec'][f['si']]):3d}  {ab}")
