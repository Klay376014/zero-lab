"""Parse the cached 52poke move list into moves_zh.json, keyed by PokeAPI move id.

Why this source exists in the pipeline at all: PokeAPI's move_flavor_text carries no
Traditional Chinese past version group 20, which leaves the 53 generation-IX moves in the
Champions table with no Chinese description, and move_effect_prose has no Chinese at all.
This page has a description for all 920 of its numbered moves, and its 編號 column *is* the
PokeAPI move id, so the join is a number rather than a name.

Two things about the fetch are load-bearing and easy to undo by accident:

  * The URL is the ``/zh-hant/`` variant. The bare article path serves Simplified, and the
    defect this source was brought in to fix is exactly Simplified characters reaching the
    dataset. Same table, same ids — only the characters differ, and nothing downstream can
    tell that it got the wrong variant.
  * The request needs a browser User-Agent or the site answers 403. ``fetch_sources.sh``
    already sends one for every source, so the download lives there and this script only
    reads the cache — which also keeps it free to re-run.

A mechanic cell is a number only when it is all digits. Both ``—`` (not applicable) and
``變化`` (varies with the situation) mean "no fixed value", and reading the latter as text
rather than as absent is not harmless: it makes 5 of the 496 moves compare unequal against
the Champions figures for the wrong reason, which is how the 401-vs-406 discrepancy in the
mechanics guard first appeared.
"""
import html, json, pathlib, re

SRC = pathlib.Path('moves_zh.html')
OUT = pathlib.Path('moves_zh.json')

# The nine per-generation tables. Every other table on the page is navigation or a filter
# widget, and `fulltable` is what separates them.
TABLE = re.compile(r'<table[^>]*\bfulltable\b.*?</table>', re.S)
ROW = re.compile(r'<tr.*?</tr>', re.S)
CELL = re.compile(r'<td.*?</td>', re.S)

COLUMNS = ('編號', '中文名', '日文名', '英文名', '屬性', '分類', '威力', '命中', 'ＰＰ', '說明')


def text(cell):
    return ' '.join(html.unescape(re.sub(r'<[^>]+>', '', cell)).split())


def figure(cell):
    """A mechanic cell as an int, or None for `—` and `變化`."""
    return int(cell) if cell.isdigit() else None


assert SRC.exists(), (
    f'{SRC} is not cached. Run ./fetch_sources.sh, which downloads it with the browser '
    'User-Agent the site requires.'
)

source = SRC.read_text(encoding='utf-8')
tables = TABLE.findall(source)
assert len(tables) == 9, (
    f'expected the nine per-generation tables, found {len(tables)}. The page structure '
    'changed; re-read it before adjusting this parser.'
)

# The header is asserted rather than assumed: the columns are read positionally, so a column
# inserted upstream would silently shift descriptions into the ＰＰ field.
head = [text(c) for c in re.findall(r'<th.*?</th>', ROW.findall(tables[0])[0], re.S)]
assert tuple(head) == COLUMNS, f'column layout changed: {head}'

moves = {}
for table in tables:
    for row in ROW.findall(table)[1:]:
        cells = [text(c) for c in CELL.findall(row)]
        # Rows without a number are the G-Max moves, which PokeAPI does not number here and
        # no Champions learnset lists; the one-cell rows are each table's footer.
        if len(cells) != len(COLUMNS) or not cells[0].isdigit():
            continue
        moves[cells[0]] = {
            'z': cells[1], 'n': cells[3], 'ty': cells[4], 'dc': cells[5],
            'pw': figure(cells[6]), 'ac': figure(cells[7]), 'pp': figure(cells[8]),
            'd': cells[9],
        }

print(f'numbered move rows: {len(moves)}')
assert len(moves) == 920, (
    f'expected 920 numbered rows, parsed {len(moves)}. Either the page gained a generation '
    'or the parser stopped matching; a short count silently starves the join downstream.'
)

blank_name = [k for k, v in moves.items() if not v['z']]
blank_desc = [k for k, v in moves.items() if not v['d']]
assert not blank_name, f'rows with no Chinese name: {blank_name}'
assert not blank_desc, f'rows with no description: {blank_desc}'

lengths = sorted(len(v['d']) for v in moves.values())
print(f'descriptions: {len(moves)} / {len(moves)} non-empty  '
      f'(median {lengths[len(lengths) // 2]}, longest {lengths[-1]} characters)')

OUT.write_text(json.dumps(moves, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'wrote {OUT} ({len(OUT.read_text(encoding="utf-8").encode()) / 1024:.1f} KB)')
