"""Aggregate 208 Champions learnsets into one shared move table + per-species sections.

Move mechanics come from Bulbapedia's Champions tables, not PokeAPI: Champions retunes
some values, so the game's own numbers are authoritative here. PokeAPI is used only for
Traditional Chinese naming. Any move listed with conflicting mechanics across pages is
reported rather than silently resolved.
"""
import csv, json, pathlib, collections
from parse_learn import parse

LS = pathlib.Path('learnsets')
titles = json.load(open('learnset_titles.json', encoding='utf-8'))
champs = json.load(open('champions.json', encoding='utf-8'))
species_names = sorted({r['name'] for r in champs['body'] if r['dex'] != 923})
name_by_dex = {r['dex']: r['name'] for r in champs['body'] if r['dex'] != 923}

# ---- zh-Hant move names, keyed by English display name ----
mv_ids = {r['id']: r['identifier'] for r in csv.DictReader(open('moves.csv', encoding='utf-8'))}
names = list(csv.DictReader(open('move_names.csv', encoding='utf-8')))
en_by_id = {r['move_id']: r['name'] for r in names if r['local_language_id'] == '9'}
zh_by_id = {r['move_id']: r['name'] for r in names if r['local_language_id'] == '4'}
# PokeAPI writes King’s Shield with U+2019; Bulbapedia uses a plain ASCII apostrophe.
# Without folding them the join silently drops every possessive move name.
def fold(s):
    return s.replace('’', "'").replace('‘', "'").replace('–', '-')
ZH_MOVE = {fold(en_by_id[i]): zh_by_id[i] for i in en_by_id if i in zh_by_id}

# ---- parse every page ----
parsed, missing = {}, []
for name in species_names:
    slug = name.replace(' ', '_')
    f = LS / (slug + '.wiki')
    if not f.exists():
        missing.append(name); continue
    parsed[name] = parse(f.read_text(encoding='utf-8'))
print(f'parsed {len(parsed)} / {len(species_names)} species; missing={missing}')

# ---- global move table, with conflict detection ----
table, index, conflicts = [], {}, collections.defaultdict(set)
def move_idx(m):
    sig = (m['ty'], m['dc'], m['pw'], m['ac'], m['pp'])
    if m['n'] in index:
        prev = table[index[m['n']]]
        if (prev['ty'], prev['dc'], prev['pw'], prev['ac'], prev['pp']) != sig:
            conflicts[m['n']].add(sig)
            conflicts[m['n']].add((prev['ty'], prev['dc'], prev['pw'], prev['ac'], prev['pp']))
        return index[m['n']]
    index[m['n']] = len(table)
    table.append({'n': m['n'], 'z': ZH_MOVE.get(fold(m['n']), ''), 'ty': m['ty'], 'dc': m['dc'],
                  'pw': m['pw'], 'ac': m['ac'], 'pp': m['pp']})
    return index[m['n']]

sections, lost = {}, {}
for name, d in parsed.items():
    sections[name] = [{'types': s['types'],
                       'mv': sorted({move_idx(m) for m in s['moves']})}
                      for s in d['sections']]
    lost[name] = sorted({index[n] for n in d['lost'] if n in index})

print(f'distinct moves in Champions learnsets: {len(table)}')
print(f'zh names resolved: {sum(1 for m in table if m["z"])} / {len(table)}')
print(f'total move references: {sum(len(s["mv"]) for v in sections.values() for s in v)}')
print(f'section counts: {dict(sorted(collections.Counter(len(v) for v in sections.values()).items()))}')
if conflicts:
    print(f'\nMOVES WITH CONFLICTING MECHANICS ACROSS PAGES: {len(conflicts)}')
    for n, sigs in list(conflicts.items())[:15]:
        print(f'  {n}: {sorted(sigs)}')
else:
    print('\nno mechanic conflicts — every move has one consistent stat line')

nozh = [m['n'] for m in table if not m['z']]
print(f'\nmoves without a zh-Hant name ({len(nozh)}): {nozh[:20]}')

json.dump({'moves': table, 'sections': sections, 'lost': lost},
          open('learn.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('\nbytes:', len(open('learn.json', encoding='utf-8').read()))
