#!/bin/bash

set -eu

INPUT_FILE="$1"
VARIABLE="$2"
LEVEL="${3:-}"

if [ ! -z "$LEVEL" ]; then
    gdalinfo -json "$INPUT_FILE" | jq -r ".bands | map(select(.metadata[\"\"].GRIB_ELEMENT == \"$VARIABLE\" and .metadata[\"\"].GRIB_SHORT_NAME == \"$LEVEL\"))[0].band // \"\""
else
    gdalinfo -json "$INPUT_FILE" | jq -r ".bands | map(select(.metadata[\"\"].GRIB_ELEMENT == \"$VARIABLE\"))[0].band // \"\""
fi