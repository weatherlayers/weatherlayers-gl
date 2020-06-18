#!/bin/bash

set -eu

INPUT_FILE="$1"
OUTPUT_FILE="$2"
TMP_FILE="$(mktemp).tif"
LENGTH_TMP_FILE="$(mktemp).tif"
U_TMP_FILE="$(mktemp).tif"
V_TMP_FILE="$(mktemp).tif"
MERGED_TMP_FILE="$(mktemp).vrt"

# map longitude from 0..360 to -180..180
gdalwarp \
    --config CENTER_LONG 0 \
    "$INPUT_FILE" \
    "$TMP_FILE"

# calculate length and bearing
gdal_calc.py --calc='sqrt(A * A + B * B)' -A "$TMP_FILE" --A_band=1 -B "$TMP_FILE" --B_band=2 --outfile "$LENGTH_TMP_FILE"
gdalbuildvrt -b 1 "$U_TMP_FILE" "$TMP_FILE"
gdalbuildvrt -b 2 "$V_TMP_FILE" "$TMP_FILE"
gdalbuildvrt -separate "$MERGED_TMP_FILE" "$LENGTH_TMP_FILE" "$U_TMP_FILE" "$V_TMP_FILE"

# transform into PNG image texture
# map values to 0..255 uint8
gdal_translate \
    -ot Byte \
    -b 1 -b 2 -b 3 \
    -scale_1 0 100 0 255 \
    -scale_2 -128 127 0 255 \
    -scale_3 -128 127 0 255 \
    "$MERGED_TMP_FILE" \
    "$OUTPUT_FILE"

rm "$TMP_FILE"
rm "$LENGTH_TMP_FILE"
rm "$U_TMP_FILE"
rm "$V_TMP_FILE"
rm "$MERGED_TMP_FILE"