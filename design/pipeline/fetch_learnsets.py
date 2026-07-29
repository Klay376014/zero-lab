"""Fetch all 208 Champions learnset pages as raw wikitext, cached on disk."""
import json, os, pathlib, urllib.request, urllib.parse, time
from concurrent.futures import ThreadPoolExecutor

OUT = pathlib.Path('learnsets'); OUT.mkdir(exist_ok=True)
UA  = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
API = 'https://bulbapedia.bulbagarden.net/w/index.php'

titles = [m['title'] for m in json.load(open('cat.json', encoding='utf-8'))['query']['categorymembers']]
print('titles:', len(titles))

def slug(t):
    return t.split(' (Pok')[0].replace(' ', '_').replace('/', '_')

def valid(body):
    """A learnset page is valid if it carries the section header template — NOT if it is
    over some byte count. Ditto's page is a legitimate 247 bytes (it learns only
    Transform), and a size threshold silently drops it."""
    return b'learnlist/champh' in body

def grab(t):
    dest = OUT / (slug(t) + '.wiki')
    if dest.exists() and valid(dest.read_bytes()):
        return t, 'cached', dest.stat().st_size
    url = API + '?' + urllib.parse.urlencode({'title': t, 'action': 'raw'})
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read()
            if not valid(body):
                raise ValueError(f'no learnlist/champh marker ({len(body)} B)')
            dest.write_bytes(body)
            return t, 'ok', len(body)
        except Exception as e:
            if attempt == 2:
                return t, f'FAIL {e}', 0
            time.sleep(1.5 * (attempt + 1))

with ThreadPoolExecutor(max_workers=8) as ex:
    res = list(ex.map(grab, titles))

ok     = [r for r in res if r[1] in ('ok', 'cached')]
failed = [r for r in res if r[1] not in ('ok', 'cached')]
print(f'fetched/cached: {len(ok)}   failed: {len(failed)}')
for f in failed:
    print('  ', f)
print('total bytes:', sum(r[2] for r in ok))
# a partial fetch must fail here, not surface as a KeyError three stages downstream
assert not failed, f'{len(failed)} learnset page(s) could not be fetched'
assert len(ok) == len(titles), f'{len(ok)} of {len(titles)} pages present'
json.dump({slug(t): t for t in titles}, open('learnset_titles.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
