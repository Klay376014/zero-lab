"""Parse a Bulbapedia '<Pokémon>/Champions learnset' page into per-section move lists.

Two things this must get right:
  * `learnlist/champ/lost` rows are moves the Pokémon could learn in EARLIER games and
    explicitly CANNOT learn in Champions. They live in their own section and must never
    be mixed into the learnable set.
  * A page carries one section per distinct learnset. Sections are headed with the
    form's type pair, but same-typed forms (Meowstic M/F, Lycanroc's three) produce
    IDENTICAL headers, so document order is the only available discriminator.
"""
import re, sys

ROW  = re.compile(r'\{\{learnlist/champ\|([^}]*)\}\}')
LOST = re.compile(r'\{\{learnlist/champ/lost\|([^}]*)\}\}')
HEAD = re.compile(r'\{\{learnlist/champh(?P<lost>/lost)?\|(?P<args>[^}]*)\}\}')

def clean(s):
    s = re.sub(r'\[\[[^\]|]*\|([^\]]*)\]\]', r'\1', s)
    s = re.sub(r'\[\[([^\]]*)\]\]', r'\1', s)
    return s.replace("'''", '').replace("''", '').strip()

def num(s):
    s = s.strip()
    return None if s in ('', '—', '–', '-', '?') else int(s)

def parse(text):
    """-> {'sections': [ {types, gen, moves:[...]} ], 'lost': [names]}"""
    # Cut the page into blocks that each start at a champh marker, so rows can be
    # attributed to the section they follow.
    marks = [(m.start(), bool(m.group('lost')), m.group('args').split('|')) for m in HEAD.finditer(text)]
    marks.append((len(text), None, None))
    sections, lost = [], []
    for i in range(len(marks) - 1):
        start, is_lost, args = marks[i]
        end = marks[i + 1][0]
        block = text[start:end]
        if is_lost:
            lost += [clean(r.split('|')[0]) for r in LOST.findall(block)]
            continue
        moves = []
        for raw in ROW.findall(block):
            f = raw.split('|')
            if len(f) < 6:
                continue
            tail = '|'.join(f[6:])
            moves.append({
                'n': clean(f[0]),
                'ty': f[1].strip(),
                'dc': f[2].strip(),
                'pw': num(f[3]),
                'ac': num(f[4]),
                'pp': num(f[5]),
                # bold = STAB for this form, italic = STAB for one of its other forms
                'stab': 2 if "'''" in tail else (1 if "''" in tail else 0),
            })
        t1 = args[1].strip() if len(args) > 1 else ''
        t2 = args[2].strip() if len(args) > 2 else t1
        types = [t1] if (t2 == t1 or not t2) else [t1, t2]
        sections.append({'types': types, 'gen': args[3].strip() if len(args) > 3 else '',
                         'moves': moves})
    return {'sections': sections, 'lost': sorted(set(lost))}

if __name__ == '__main__':
    for path in sys.argv[1:]:
        d = parse(open(path, encoding='utf-8').read())
        print(f'--- {path}: {len(d["sections"])} learnable section(s), {len(d["lost"])} lost')
        for i, s in enumerate(d['sections']):
            names = {m['n'] for m in s['moves']}
            marks = [m for m in ('Accelerock', 'Counter', 'Sucker Punch', 'Extrasensory',
                                 'Mean Look', 'Magical Leaf', 'Reversal') if m in names]
            print(f'   [{i}] {"/".join(s["types"]):20s} gen={s["gen"]:2s} '
                  f'{len(s["moves"]):3d} moves   discriminators={marks}')
