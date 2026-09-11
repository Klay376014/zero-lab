import re, json, collections

raw = open('champions.wiki', encoding='utf-8').read()

# Upstream stages a future release as commented-out roster rows whose version column is a
# placeholder, and the row templates below match by pattern — a comment is not a delimiter to
# them. Stripping comment regions first is what makes "released" the parser's own definition:
# excluding by the placeholder version instead would misjudge both directions, because a
# commented row can carry a real version and a released row can carry a placeholder.
raw = re.sub(r'<!--.*?-->', '', raw, flags=re.S)

# split into sections
def section(start_pat, end_pat):
    s = re.search(start_pat, raw)
    e = re.search(end_pat, raw[s.end():]) if s else None
    return raw[s.end(): s.end() + e.start()] if (s and e) else ''

body = section(r'==List of Pokémon in Champions==', r'\n===Forms===')
megas = section(r'====Mega Evolutions====', r'\n====Other forms====')
# Ends at the next second-level heading rather than at a named one. The named one used to be
# `==Untransferable Pokémon==`, which upstream deleted when Pawmot became playable — and a
# `section()` whose end pattern does not match returns '' without raising, so the 87 form rows
# below simply vanished. Naming the section that happens to follow today only moves the same
# fragility onto the next heading upstream inserts.
others = section(r'====Other forms====', r'\n==[^=]')
untrans = section(r'==Untransferable Pokémon==', r'\n==Trivia==')

TYPES = {'Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison','Ground',
         'Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'}

def clean(s):
    s = re.sub(r'<br\s*/?>', ' ', s)
    s = re.sub(r'\[\[[^\]|]*\|([^\]]*)\]\]', r'\1', s)
    s = re.sub(r'\[\[([^\]]*)\]\]', r'\1', s)
    return s.strip()

def parse_rows(text):
    out = []
    for m in re.finditer(r'\{\{gdex/Champs\|([^}]*)\}\}', text):
        parts = [p.strip() for p in m.group(1).split('|')]
        named = {}
        pos = []
        for p in parts:
            if '=' in p and re.match(r'^[a-z]+=', p):
                k, v = p.split('=', 1)
                named[k] = clean(v)
            else:
                pos.append(p)
        if len(pos) < 3:
            continue
        dex, name, ntypes = pos[0], clean(pos[1]), pos[2]
        try:
            n = int(ntypes)
        except ValueError:
            continue
        types = [t for t in pos[3:3 + n] if t in TYPES]
        rest = pos[3 + n:]
        roster = next((clean(r) for r in rest if clean(r).startswith(('Yes', 'No'))), '')
        version = next((r for r in rest if re.match(r'^\d+\.\d+\.\d+$', r)), '')
        out.append({
            'dex': int(dex),
            'name': name,
            'form': named.get('form', ''),
            'types': types,
            'in_current_roster': roster.startswith('Yes'),
            'roster_note': roster if roster not in ('Yes', 'No') else '',
            'added': version,
        })
    return out

b = parse_rows(body)
m = parse_rows(megas)
o = parse_rows(others)
u = parse_rows(untrans)

species = sorted({r['dex'] for r in b})
print(f'body rows (species+regional forms): {len(b)}')
print(f'unique species in body: {len(species)}')
print(f'mega rows: {len(m)}')
print(f'other-form rows: {len(o)}')
print(f'untransferable rows: {len(u)}')
print(f'dex range: {min(species)}..{max(species)}')
print(f'in current roster (body rows): {sum(r["in_current_roster"] for r in b)}')

# generation buckets
GEN = [(1,151,'I'),(152,251,'II'),(252,386,'III'),(387,493,'IV'),(494,649,'V'),
       (650,721,'VI'),(722,809,'VII'),(810,905,'VIII'),(906,1025,'IX')]
def gen(d):
    for lo,hi,g in GEN:
        if lo <= d <= hi: return g
    return '?'
c = collections.Counter(gen(d) for d in species)
print('species per gen:', {g: c[g] for _,_,g in GEN})

# Overlay rows join here rather than in each consumer, so that champions.json stays the one
# answer to "which forms does the pipeline know about" and resolve_forms/build_data3 need no
# knowledge of the overlay at all. Keys starting with '_' are the entry's own provenance notes.
overlay = json.load(open('overlay.json', encoding='utf-8'))
extra = [{k: v for k, v in r.items() if not k.startswith('_')} for r in overlay['megas']]
for r in extra:
    assert not any(x['dex'] == r['dex'] and x['form'] == r['form'] for x in m), \
        f"overlay row {r['form']!r} is now carried by the roster page — delete it from overlay.json"
m += extra
print(f'overlay mega rows merged: {len(extra)}  -> mega rows total: {len(m)}')

json.dump({'body': b, 'megas': m, 'other_forms': o, 'untransferable': u},
          open('champions.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
print('\nlast 12 body rows:')
for r in b[-12:]:
    print(' ', r['dex'], r['name'], r['form'], '/'.join(r['types']))
