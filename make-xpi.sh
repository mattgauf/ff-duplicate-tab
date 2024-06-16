#!/bin/bash -ex
V=$(cat firefox/manifest.json | jq -Mr .version)
rm -f "duplicate-and-pin-$V.xpi"

grep -r console.log firefox && exit

cd firefox
zip -r "../duplicate-and-pin-$V.xpi" . -x '*.DS_Store' -x '*Thumbs.db'

# diff ../chrome/manifest.json manifest.json
git status
