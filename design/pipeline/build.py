import json, pathlib, re

here = pathlib.Path(__file__).parent
out  = here.parent / 'champions-dex.html'   # design/champions-dex.html
app  = here.parent.parent / 'src' / 'data' / 'dex.json'   # src/data/dex.json
out.parent.mkdir(parents=True, exist_ok=True)
app.parent.mkdir(parents=True, exist_ok=True)

tpl  = (here / 'template.html').read_text(encoding='utf-8')
data = json.loads((here / 'dex3.json').read_text(encoding='utf-8'))

# One serialisation feeds both the design document and the app: the two can never
# drift into different datasets because there is only one string.
compact = json.dumps(data, ensure_ascii=False, separators=(',', ':'))

subs = {
    '__FONT400__': (here / 'f400.txt').read_text().strip(),
    '__FONT700__': (here / 'f700.txt').read_text().strip(),
    '__FONTPROSE__': (here / 'fprose.txt').read_text().strip(),
    '__DATA__':    compact,
    '__ROSTER__':  data['meta']['roster'],
}
for k, v in subs.items():
    assert k in tpl, f'placeholder {k} missing from template'
    tpl = tpl.replace(k, v)

left = re.findall(r'__[A-Z0-9]+__', tpl)
assert not left, f'unsubstituted placeholders: {left}'

out.write_text(tpl, encoding='utf-8')
(out.parent / 'champions-dex.json').write_text(
    json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
# The Vue Lynx app reads this one. Compact rather than indented because it is bundled,
# and generated rather than copied so src/ never has to reach into design/.
app.write_text(compact, encoding='utf-8')
kb = len(tpl.encode()) / 1024
print(f'wrote {out}  ({kb:.1f} KB, self-contained)')
print(f'wrote {app}  ({len(compact.encode())/1024:.1f} KB, app dataset)')
print(f'species embedded: {len(data["species"])}  '
      f'form entries: {sum(len(s["f"]) for s in data["species"])}')
