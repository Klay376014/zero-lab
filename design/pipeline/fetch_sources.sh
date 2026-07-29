#!/usr/bin/env bash
# Fetch every upstream source the pipeline needs. Idempotent: skips files already
# present, so re-running is cheap. Delete a file to force a refresh.
#
# These steps were originally run as ad-hoc curl commands; they live here so the
# pipeline has no undocumented manual steps.
set -euo pipefail
cd "$(dirname "$0")"

UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
BULBA='https://bulbapedia.bulbagarden.net/w'
POKEAPI='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv'

get () {  # get <url> <dest>
  if [ -s "$2" ]; then echo "  skip  $2"; return; fi
  curl -sfL --max-time 120 -A "$UA" "$1" -o "$2"
  echo "  ok    $2  ($(wc -c < "$2" | tr -d ' ') B)"
}

echo "1/3  Bulbapedia roster table (raw wikitext)"
get "$BULBA/index.php?title=List_of_Pok%C3%A9mon_in_Pok%C3%A9mon_Champions&action=raw" champions.wiki

echo "2/3  Bulbapedia learnset page titles (expects exactly 208 members)"
get "$BULBA/api.php?action=query&list=categorymembers&cmtitle=Category:Pok%C3%A9mon%20learnsets%20(Champions)&cmlimit=500&format=json" cat.json
python3 - <<'PY'
import json
n = len(json.load(open('cat.json', encoding='utf-8'))['query']['categorymembers'])
print(f'      category members: {n}')
assert n == 208, f'roster size changed ({n} != 208) — the game was updated; see HANDOFF.md'
PY

echo "3/3  PokeAPI source CSVs"
for f in pokemon.csv pokemon_forms.csv pokemon_stats.csv stats.csv \
         pokemon_abilities.csv abilities.csv ability_names.csv ability_flavor_text.csv \
         moves.csv move_names.csv languages.csv \
         pokemon_species_names.csv pokemon_form_names.csv ; do
  get "$POKEAPI/$f" "$f"
done

echo
echo "sources ready — now run ./run.sh"
