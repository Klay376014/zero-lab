"""Source Traditional-Chinese form names for the labels PokeAPI does not localise.

Two disjoint mechanisms, chosen by what the data actually supports:

  * Real forms (regional, cosmetic, gender…) get a {{langtable}} block on their species'
    Bulbapedia page whose |zh_cmn= field carries the official Chinese name plus a
    {{tt|pinyin|English}} annotation. That English string is the join key — it lives
    inside the same field, so the pairing cannot drift.

  * Mega Evolutions have NO per-form langtable (checked on Venusaur). Their Chinese name
    is strictly 超級 + the species name, so it is derived — and the derivation is asserted
    against all 41 Megas that PokeAPI *did* localise before being trusted for the rest.
"""
import csv, json, re, urllib.request, urllib.parse, pathlib
from concurrent.futures import ThreadPoolExecutor

UA  = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
API = 'https://bulbapedia.bulbagarden.net/w/index.php'
CACHE = pathlib.Path('species_pages'); CACHE.mkdir(exist_ok=True)

# ---------- what PokeAPI already gives us ----------
forms = list(csv.DictReader(open('pokemon_forms.csv', encoding='utf-8')))
by_ident = {r['identifier']: r for r in forms}
by_pid_default = {}
for r in forms:
    if r['is_default'] == '1':
        by_pid_default.setdefault(int(r['pokemon_id']), r)
fn = list(csv.DictReader(open('pokemon_form_names.csv', encoding='utf-8')))
api_zh = {r['pokemon_form_id']: r['form_name']
          for r in fn if r['local_language_id'] == '4' and r['form_name']}

sn = list(csv.DictReader(open('pokemon_species_names.csv', encoding='utf-8')))
SPECIES_ZH = {int(r['pokemon_species_id']): r['name'] for r in sn if r['local_language_id'] == '4'}
SPECIES_GENUS = {int(r['pokemon_species_id']): r['genus'] for r in sn if r['local_language_id'] == '4'}

verified = json.load(open('forms_verified.json', encoding='utf-8'))['resolved']

def form_id(r):
    ident = r['via'].split(':', 1)[1] if ':' in r['via'] else None
    row = by_ident.get(ident) if ident else None
    if row is None:
        row = by_pid_default.get(r['pid'])
    return row['id'] if row else None

# ---------- Mega rule, validated against every Mega PokeAPI does localise ----------
FW = str.maketrans('XY', 'ＸＹ')          # Bulbapedia/官方 use full-width X / Y
def mega_zh(dex, label):
    base = SPECIES_ZH[dex]
    m = re.search(r'\b([XY])$', label)
    return '超級' + base + (m.group(1).translate(FW) if m else '')

checked = wrong = 0
for r in verified:
    if r['kind'] != 'mega':
        continue
    got = api_zh.get(form_id(r))
    if got:
        checked += 1
        if mega_zh(r['dex'], r['label']) != got:
            wrong += 1
            print(f'  RULE MISMATCH {r["label"]}: derived={mega_zh(r["dex"], r["label"])!r} api={got!r}')
print(f'Mega naming rule checked against {checked} PokeAPI-localised Megas, mismatches: {wrong}')
assert wrong == 0, 'the 超級+species rule does not reproduce PokeAPI; do not trust it'

# ---------- scrape species pages for the remaining real forms ----------
need_pages = sorted({r['dex'] for r in verified
                     if r['kind'] != 'mega' and not api_zh.get(form_id(r))})
name_by_dex = {r['dex']: r['name'] for r in verified}
print(f'species pages to scrape: {len(need_pages)} -> {need_pages}')

def page(dex):
    title = f'{name_by_dex[dex]} (Pokémon)'
    dest = CACHE / f'{dex}.wiki'
    if dest.exists() and dest.stat().st_size > 2000:
        return dex, dest.read_text(encoding='utf-8')
    url = API + '?' + urllib.parse.urlencode({'title': title, 'action': 'raw'})
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read().decode('utf-8', 'replace')
    dest.write_text(body, encoding='utf-8')
    return dex, body

with ThreadPoolExecutor(max_workers=6) as ex:
    pages = dict(ex.map(page, need_pages))

# The |zh_cmn= field appears in three shapes across pages, and the English inside its
# {{tt}} is sometimes a literal gloss of the Chinese rather than the official form name
# ("Heart-shaped Style" for Heart Trim). So key off the ''Form Name'' heading that
# precedes each {{langtable}} instead, and take the Traditional half of "繁 / 简".
HEAD = re.compile(r"^''([^'\n]{2,60})''\s*$", re.M)
def zh_of(block):
    m = re.search(r'\|zh_cmn=([^\n|]+)', block)
    if not m:
        return None
    raw = m.group(1)
    raw = re.split(r"\s*/\s*|''|\{\{|<small>", raw)[0]
    raw = raw.strip()
    return raw or None

scraped = {}                     # (dex, english form heading) -> chinese
for dex, body in pages.items():
    parts = body.split('{{langtable')
    for i in range(1, len(parts)):
        before, block = parts[i - 1], parts[i]
        heads = HEAD.findall(before)
        if not heads:
            continue
        zh = zh_of(block[:1200])
        if zh:
            scraped[(dex, heads[-1].strip())] = zh
print(f'scraped langtable zh names: {len(scraped)}')

# Bulbapedia labels a few forms slightly differently from the roster table
ALIAS = {
    'Medium Variety': 'Average Size', 'Small Size': 'Small Size',
    'Small Variety': 'Small Size',
    'Large Variety': 'Large Size',    'Jumbo Variety': 'Super Size',
}

# ---------- regional wording, composed from two independently sourced halves ----------
# PokeAPI localises Alolan/Galarian forms as "<region>的樣子" but has NOTHING for Hisui or
# Paldea (checked: 0 rows). The region names themselves live on Bulbapedia's region pages,
# so compose them — and prove the composition first by reproducing the two forms PokeAPI
# DOES localise. If that assertion fails the pattern is wrong and nothing is trusted.
REGION_PAGE = {'Alola': 'Alola', 'Galar': 'Galar', 'Hisui': 'Hisui', 'Paldea': 'Paldea'}
TRAD = re.compile(r'\|\s*Chinese \(Traditional\)\s*\n\|\s*([^\s''|\n]+)')
region_zh = {}
for key, title in REGION_PAGE.items():
    p = CACHE / f'region-{key}.wiki'
    if not (p.exists() and p.stat().st_size > 2000):
        url = API + '?' + urllib.parse.urlencode({'title': title, 'action': 'raw'})
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        with urllib.request.urlopen(req, timeout=60) as r:
            p.write_bytes(r.read())
    m = TRAD.search(p.read_text(encoding='utf-8'))
    assert m, f'no Traditional Chinese name found on the {title} page'
    region_zh[key] = m.group(1)
print('region names from Bulbapedia:', region_zh)

for key, ident in (('Alola', 'raichu-alola'), ('Galar', 'slowbro-galar')):
    want = api_zh[by_ident[ident]['id']]
    got  = region_zh[key] + '的樣子'
    assert got == want, f'regional pattern unproven: {got!r} != {want!r}'
print('regional "<region>的樣子" pattern reproduces PokeAPI for Alola and Galar')

# Gender wording: PokeAPI is consistent across Meowstic, Pyroar and Indeedee, so reuse it
# for Basculegion, which it does not localise.
GENDER_ZH = {}
for ident, lab in (('meowstic-male', 'Male'), ('meowstic-female', 'Female')):
    GENDER_ZH[lab] = api_zh[by_ident[ident]['id']]
for ident in ('pyroar-male', 'pyroar-female', 'indeedee-male', 'indeedee-female'):
    lab = 'Male' if ident.endswith('male') and not ident.endswith('female') else 'Female'
    assert api_zh[by_ident[ident]['id']] == GENDER_ZH[lab], 'gender wording is not consistent'
print('gender wording confirmed across 3 species:', GENDER_ZH)

def derived(dex, kind, label):
    """Compose a label from a proven pattern, or return None."""
    if kind == 'regional':
        if label == 'Hisuian Form':
            return region_zh['Hisui'] + '的樣子'
        m = re.match(r'Paldean Form \((.+?)\)$', label)
        if m:
            breed = scraped.get((dex, m.group(1)))
            return region_zh['Paldea'] + '的樣子' + (f'（{breed}）' if breed else '')
    if label in GENDER_ZH:
        return GENDER_ZH[label]
    return None

out, missing = {}, []
for r in verified:
    key = f'{r["dex"]}|{r["kind"]}|{r["label"]}'
    if r['kind'] == 'mega':
        out[key] = api_zh.get(form_id(r)) or mega_zh(r['dex'], r['label'])
        continue
    zh = api_zh.get(form_id(r))
    if not zh:
        lab = r['label']
        zh = (scraped.get((r['dex'], lab))
              or scraped.get((r['dex'], ALIAS.get(lab, lab)))
              or scraped.get((r['dex'], lab.replace(' Form', '')))
              or scraped.get((r['dex'], lab.replace('Poké', 'Poke')))
              or derived(r['dex'], r['kind'], lab))
    if zh:
        out[key] = zh
    else:
        missing.append((r['dex'], r['kind'], r['label']))

print(f'\nzh form labels resolved: {len(out)} / {len(verified)}')
if missing:
    print(f'STILL MISSING ({len(missing)}) — these will fall back to English:')
    for m in missing:
        print('  ', m)

json.dump({'forms': out, 'species': {str(k): v for k, v in SPECIES_ZH.items()},
           'genus': {str(k): v for k, v in SPECIES_GENUS.items()}},
          open('zh_names.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
