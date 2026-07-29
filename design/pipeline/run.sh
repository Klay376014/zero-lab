#!/usr/bin/env bash
# Rebuild design/champions-dex.html + champions-dex.json from scratch.
#
# Every stage asserts its own invariants and exits non-zero on violation, so a silent
# wrong build is not possible. If a stage fails, read HANDOFF.md § "資料層的驗證不變式"
# before changing any threshold — several of them exist to catch upstream data changes.
set -euo pipefail
cd "$(dirname "$0")"

step () { echo; echo "──── $1"; }

step "0  fetch upstream sources"
./fetch_sources.sh

step "1  parse the roster table            -> champions.json"
python3 parse.py

step "2  resolve a sprite path per form    -> forms_resolved.json"
python3 resolve_forms.py

step "3  HTTP-verify every sprite path     -> forms_verified.json"
python3 verify_forms.py

step "4  fetch 208 Champions learnsets     -> learnsets/*.wiki"
python3 fetch_learnsets.py

step "5  aggregate learnsets + move table  -> learn.json"
python3 aggregate.py

step "6  resolve Chinese names             -> zh_names.json"
python3 zh_forms.py

step "7  assemble the dataset              -> dex3.json"
python3 build_data3.py

step "8  inline everything into one file   -> ../champions-dex.html"
python3 build.py

echo
echo "done. open ../champions-dex.html in a browser."
