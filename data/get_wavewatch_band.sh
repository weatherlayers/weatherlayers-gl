#!/bin/bash

set -eu

INPUT_FILE="$1"
VARIABLE="$2"

set +e
BAND="$(gdalinfo -json "$INPUT_FILE" | jq -e ".bands | map(select(.metadata[\"\"].GRIB_ELEMENT == \"$VARIABLE\"))[0].band")"
RESULT="$?"
set -e

if [ "$RESULT" -eq 0 ]; then
    echo "$BAND"
else
    echo "ERROR: $VARIABLE variable not found in the input file" >&2
    file "$INPUT_FILE" >&2
    exit "$RESULT"
fi