"""Fetch every Champions learnset page as raw wikitext, cached on disk.

The page count comes from cat.json rather than from a number written here: it is the roster
size, and the roster rotates. `fetch_sources.sh` is the one place that asserts what it should be.

Also caches each page's last upstream revision time. Two pages can state different mechanics for
the same move — this game retunes them, and a page not edited since a retune still carries the
figure that preceded it — so `aggregate.py` resolves that disagreement by taking the more
recently revised page. That rule needs upstream's timestamps, not ours.
"""
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

# ---- last revision time per page ----
# One file rather than one per page: it is a single small map, and the pages it describes are
# already on disk. Cached like everything else — delete the file to force a refresh.
REVS = pathlib.Path('learnset_revisions.json')
QUERY = 'https://bulbapedia.bulbagarden.net/w/api.php'

def fetch_revisions(batch):
    url = QUERY + '?' + urllib.parse.urlencode({
        'action': 'query', 'prop': 'revisions', 'rvprop': 'timestamp',
        'format': 'json', 'titles': '|'.join(batch),
    })
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        pages = json.load(r)['query']['pages']
    # Keyed by the title the API echoes back, because it normalises what it was given.
    return {p['title']: p['revisions'][0]['timestamp'] for p in pages.values() if 'revisions' in p}

if REVS.exists() and set(json.loads(REVS.read_text(encoding='utf-8'))) == {slug(t) for t in titles}:
    print('  skip  learnset_revisions.json')
else:
    stamps = {}
    for i in range(0, len(titles), 50):  # the API's per-request title limit
        stamps.update(fetch_revisions(titles[i:i + 50]))
    missing = [t for t in titles if t not in stamps]
    # A page with no timestamp would make the conflict rule silently arbitrary for every move
    # that page lists, which is the failure the rule exists to remove.
    assert not missing, f'no revision timestamp for {len(missing)} page(s): {missing[:5]}'
    REVS.write_text(json.dumps({slug(t): stamps[t] for t in titles}, ensure_ascii=False, indent=1),
                    encoding='utf-8')
    print(f'revision timestamps: {len(stamps)}  '
          f'({min(stamps.values())} .. {max(stamps.values())})')
