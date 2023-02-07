#!/bin/bash

type=$1

function getVersion {
    jq -r '.version' package.json | cut -d '.' -f$1
}

majorVersion=$(getVersion 1)
minorVersion=$(getVersion 2)
fixVersion=$(getVersion 3)

if [[ "$type" = "minor" ]]; then
    minorVersion=$(expr 1 + $minorVersion)
elif [[ "$type" = "major" ]]; then
    majorVersion=$(expr 1 + $majorVersion)
elif [[ "$type" = "fix" ]]; then
    fixVersion=$(expr 1 + $fixVersion)
fi

echo "Step 1"
content=$(jq ".version=\"$majorVersion.$minorVersion.$fixVersion\"" package.json)
echo "Step 2"
echo $content | jq . > package.json
echo "Step 3"