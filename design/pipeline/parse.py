import re, json, collections

raw = open('champions.wiki', encoding='utf-8').read()

# split into sections
def section(start_pat, end_pat):
    s = re.search(start_pat, raw)
    e = re.search(end_pat, raw[s.end():]) if s else None
    return raw[s.end(): s.end() + e.start()] if (s and e) else ''

body = section(r'==List of Pokémon in Champions==', r'\n===Forms===')
megas = section(r'====Mega Evolutions====', r'\n====Other forms====')
others = section(r'====Other forms====', r'\n==Untransferable')
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

json.dump({'body': b, 'megas': m, 'other_forms': o, 'untransferable': u},
          open('champions.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
print('\nlast 12 body rows:')
for r in b[-12:]:
    print(' ', r['dex'], r['name'], r['form'], '/'.join(r['types']))
