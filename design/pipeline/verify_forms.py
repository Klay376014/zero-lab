"""Network-verify every candidate sprite path, then pick each form's first working one."""
import json, urllib.request, collections, hashlib
from concurrent.futures import ThreadPoolExecutor

BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'
d = json.load(open('forms_resolved.json', encoding='utf-8'))
res = d['resolved']
assert not d['unresolved'], d['unresolved']

paths = sorted({p for r in res for p in r['paths']})

def head(p):
    req = urllib.request.Request(BASE + p, method='HEAD')
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return p, r.status == 200
    except Exception:
        return p, False

with ThreadPoolExecutor(max_workers=12) as ex:
    ok = dict(ex.map(head, paths))

print(f'candidate paths probed: {len(paths)}   exist: {sum(ok.values())}')

dead = []
for r in res:
    win = next((p for p in r['paths'] if ok.get(p)), None)
    r['path'] = win
    if not win:
        dead.append(r)

print(f'forms resolved to a real sprite: {sum(1 for r in res if r["path"])} / {len(res)}')
print('by kind:', collections.Counter(r['kind'] for r in res if r['path']))
if dead:
    print('\n--- NO WORKING SPRITE ---')
    for r in dead:
        print(f"  {r['dex']:4d} {r['name']:13s} [{r['kind']}] {r['label']!r}  tried={r['paths']}")

# how often the first guess was wrong -> proof the fallback chain was necessary
fell = [r for r in res if r['path'] and r['path'] != r['paths'][0]]
print(f'\nfell through to a later candidate: {len(fell)}')
for r in fell:
    print(f"  {r['dex']:4d} {r['name']:13s} {r['label']!r}: {r['paths'][0]} -> {r['path']}")

# Gen V hand-drawn art beats a Gen VIII render for a pixel dex. But the gen-v folder
# merely MIRRORS the default one for anything post-Gen-V, so a 200 there proves nothing.
# Only a differing checksum means genuinely different (i.e. real BW) art.
BW = 'versions/generation-v/black-white/'
winners = sorted({r['path'] for r in res if r['path']})

def body(p):
    try:
        with urllib.request.urlopen(BASE + p, timeout=30) as r:
            return hashlib.md5(r.read()).hexdigest()
    except Exception:
        return None

def distinct(p):
    a, b = body(BW + p), body(p)
    return p, bool(a and b and a != b)

with ThreadPoolExecutor(max_workers=12) as ex:
    bw_real = dict(ex.map(distinct, winners))
for r in res:
    r['bw'] = bool(r['path'] and bw_real.get(r['path']))
print(f'\nforms whose gen-v art genuinely differs (real BW pixel art): '
      f'{sum(r["bw"] for r in res)} / {len(res)}')
print('  real-BW by kind:', collections.Counter(r['kind'] for r in res if r['bw']))

# Two forms of one species landing on one file means PokeAPI has no distinct art for
# the non-default one. Flag it rather than implying the picture is that form.
shared = collections.Counter((r['dex'], r['path']) for r in res if r['path'])
for r in res:
    r['approx'] = bool(r['path'] and shared[(r['dex'], r['path'])] > 1 and not r.get('fdef'))
appr = [r for r in res if r['approx']]
print(f'forms with no distinct sprite (flagged approximate): {len(appr)}')
for r in appr:
    print(f"  {r['dex']:4d} {r['name']:13s} {r['label']!r} -> shares {r['path']}")

json.dump({'resolved': res}, open('forms_verified.json','w',encoding='utf-8'),
          ensure_ascii=False, indent=1)
