#!/bin/bash

set -eu

VALUE_MIN="$1"
VALUE_MAX="$2"
INPUT_FILE="$3"
OUTPUT_FILE="$4"
TMP_FILE="$(mktemp).tif"

# map longitude from 0..360 to -180..180
gdalwarp \
    -te -180 -90 180 90 \
    --config GRIB_NORMALIZE_UNITS NO \
    "$INPUT_FILE" \
    "$TMP_FILE"

# transform into PNG image texture
# map values to 0..255 uint8
gdal_translate \
    -ot Byte \
    -b 1 \
    -scale "$VALUE_MIN" "$VALUE_MAX" \
    "$TMP_FILE" \
    "$OUTPUT_FILE"

rm "$TMP_FILE"