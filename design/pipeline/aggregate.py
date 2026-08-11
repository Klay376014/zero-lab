"""Aggregate 208 Champions learnsets into one shared move table + per-species sections.

Move mechanics come from Bulbapedia's Champions tables, not PokeAPI: Champions retunes
some values, so the game's own numbers are authoritative here. Any move listed with
conflicting mechanics across pages is reported rather than silently resolved.

Everything that is *text* comes from outside Champions, whose tables carry none of it:
  * Traditional Chinese name + description -> the 52poke move list (moves_zh.json)
  * English description                    -> PokeAPI move_flavor_text, newest version group
Both join on the PokeAPI move id, which the 52poke table's 編號 column is, reached from the
Champions English move name through PokeAPI's own English names.

The split is enforced rather than merely documented: 52poke publishes mainline power,
accuracy and PP alongside the text, 401 of the 496 moves disagree with Champions, and the
dataset's load-time invariants only count rows. See the mechanics guard below.
"""
import csv, json, pathlib, collections
from parse_learn import parse

LS = pathlib.Path('learnsets')
titles = json.load(open('learnset_titles.json', encoding='utf-8'))
champs = json.load(open('champions.json', encoding='utf-8'))
species_names = sorted({r['name'] for r in champs['body'] if r['dex'] != 923})
name_by_dex = {r['dex']: r['name'] for r in champs['body'] if r['dex'] != 923}

# ---- the move id behind each Champions move name ----
# PokeAPI writes King’s Shield with U+2019; Bulbapedia uses a plain ASCII apostrophe.
# Without folding them the join silently drops every possessive move name.
def fold(s):
    return s.replace('’', "'").replace('‘', "'").replace('–', '-')
names = list(csv.DictReader(open('move_names.csv', encoding='utf-8')))
en_by_id = {r['move_id']: r['name'] for r in names if r['local_language_id'] == '9'}
ID_BY_EN = {fold(v): k for k, v in en_by_id.items()}

# ---- 52poke: Traditional Chinese name + description, keyed by that same id ----
# Replaces PokeAPI's zh-Hant name column, which is Simplified for 33 generation-IX moves and
# empty for two others. Descriptions have no PokeAPI equivalent at all past version group 20.
POKE52 = json.load(open('moves_zh.json', encoding='utf-8'))

# ---- PokeAPI: the flag ids that apply to each move ----
# Identifiers only. The flags' labels are user-facing strings and belong to the string table;
# writing them here would make them hand-authored content in a file whose provenance rule
# forbids exactly that. Nothing reads these yet — this batch stores them and displays none,
# because 71 of the 496 moves carry no flag at all and "upstream did not record it" is not the
# same statement as "the move lacks that property".
FLAGS = collections.defaultdict(set)
for r in csv.DictReader(open('move_flag_map.csv', encoding='utf-8')):
    FLAGS[r['move_id']].add(int(r['move_flag_id']))

# ---- PokeAPI: English description, newest version group per move ----
# Per move rather than one global version group, for the reason build_data3.py records about
# ability text: coverage differs by group, so a single group drops most entries.
_best_en = {}
for r in csv.DictReader(open('move_flavor_text.csv', encoding='utf-8')):
    if r['language_id'] != '9':
        continue
    vg = int(r['version_group_id'])
    cur = _best_en.get(r['move_id'])
    if cur is None or vg > cur[0]:
        # The in-game text is hard-wrapped; a single space is what reads as prose.
        _best_en[r['move_id']] = (vg, ' '.join(r['flavor_text'].split()))
EN_DESC = {k: v[1] for k, v in _best_en.items()}

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
    # `z`, `d` and `de` are filled by the join below, once the table is complete; declared
    # here so the emitted record keeps its field order.
    table.append({'n': m['n'], 'z': '', 'ty': m['ty'], 'dc': m['dc'],
                  'pw': m['pw'], 'ac': m['ac'], 'pp': m['pp'], 'd': '', 'de': ''})
    return index[m['n']]

sections, lost = {}, {}
for name, d in parsed.items():
    sections[name] = [{'types': s['types'],
                       'mv': sorted({move_idx(m) for m in s['moves']})}
                      for s in d['sections']]
    lost[name] = sorted({index[n] for n in d['lost'] if n in index})

# ---- join the text fields on the move id ----
# Snapshotted before the join, compared after: this is the whole mechanism protecting the
# provenance split. An edit that reached for 52poke's power/accuracy/PP while it had the row
# open would replace four fifths of the table with another game's figures, and nothing
# downstream checks a value — only counts.
CHAMPIONS_MECHANICS = {m['n']: (m['pw'], m['ac'], m['pp']) for m in table}

unjoined = []
for m in table:
    mid = ID_BY_EN.get(fold(m['n']))
    row = POKE52.get(mid) if mid is not None else None
    if row is None:
        unjoined.append(m['n'])
        continue
    m['z'] = row['z']
    m['d'] = row['d']
    m['de'] = EN_DESC.get(mid, '')
    # Ascending, and omitted rather than empty: the dataset is serialised compactly and 71 of
    # the 496 moves would otherwise each carry a `"fl":[]` for nothing.
    flags = sorted(FLAGS.get(mid, ()))
    if flags:
        m['fl'] = flags

# A missing description is a hard failure, not a blank field. An empty description reaches the
# screen as an empty area that no check reports — the failure shape this project has repeatedly
# paid for — so the previous learn.json is left in place instead.
no_zh = [m['n'] for m in table if not m['d']]
no_en = [m['n'] for m in table if not m['de']]
if unjoined or no_zh or no_en:
    if unjoined:
        print(f'\nNO 52poke ROW ({len(unjoined)}): {unjoined}')
    if no_zh:
        print(f'\nNO ZH DESCRIPTION ({len(no_zh)}): {no_zh}')
    if no_en:
        print(f'\nNO EN DESCRIPTION ({len(no_en)}): {no_en}')
    raise SystemExit(
        f'aborting: {len(set(unjoined) | set(no_zh) | set(no_en))} move(s) resolved to no '
        'description, named above. Every move in the table must carry one in both languages '
        '(dex-data: "A move missing a description fails the pipeline"). Check that '
        'moves_zh.json covers the id and that move_flavor_text.csv is the current export; '
        'learn.json has been left as it was.'
    )

overwritten = [m['n'] for m in table
               if (m['pw'], m['ac'], m['pp']) != CHAMPIONS_MECHANICS[m['n']]]
assert not overwritten, (
    f'{len(overwritten)} move(s) had their mechanics replaced by a non-authoritative source: '
    f'{overwritten[:10]}. Power, accuracy and PP come from the Champions tables only — that '
    'game retunes them, and 401 of these 496 moves disagree with the mainline figures the '
    'text sources publish. Read the "外部來源只供文字，不供機制數值" decision before relaxing this.'
)

retuned = sum(1 for m in table
              if (r := POKE52.get(ID_BY_EN.get(fold(m['n'])))) is not None
              and (r['pw'], r['ac'], r['pp']) != CHAMPIONS_MECHANICS[m['n']])

print(f'distinct moves in Champions learnsets: {len(table)}')
if unjoined:
    print(f'moves with no 52poke row ({len(unjoined)}): {unjoined[:20]}')
print(f'zh descriptions: {sum(1 for m in table if m["d"])} / {len(table)}')
print(f'en descriptions: {sum(1 for m in table if m["de"])} / {len(table)}')
print(f'mechanics kept from Champions: {len(table)} / {len(table)} '
      f'({retuned} differ from the mainline figures 52poke publishes)')
print(f'zh names resolved: {sum(1 for m in table if m["z"])} / {len(table)}')
_flagged = [m for m in table if 'fl' in m]
print(f'flags: {len(_flagged)} move(s) carry at least one, {len(table) - len(_flagged)} omit '
      f'the field; {len({f for m in _flagged for f in m["fl"]})} distinct ids, at most '
      f'{max((len(m["fl"]) for m in _flagged), default=0)} on one move')
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
