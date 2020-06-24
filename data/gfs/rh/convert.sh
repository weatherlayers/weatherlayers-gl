#!/bin/bash

set -eu

INPUT_FILE="$1"
OUTPUT_FILE="$2"
TMP_FILE="$(mktemp).tif"

# map longitude from 0..360 to -180..180
gdalwarp \
    -te -180 -90 180 90 \
    "$INPUT_FILE" \
    "$TMP_FILE"

# transform into PNG image texture
# map values to 0..255 uint8
gdal_translate \
    -ot Byte \
    -b 1 \
    -scale 0 100 0 255 \
    "$TMP_FILE" \
    "$OUTPUT_FILE"

rm "$TMP_FILE"