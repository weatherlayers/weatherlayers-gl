#!/bin/bash

set -eu

VALUE_MIN="$1"
VALUE_MAX="$2"
VECTOR_MIN="$3"
VECTOR_MAX="$4"
INPUT_FILE="$5"
OUTPUT_FILE="$6"
TMP_FILE="$(mktemp).tif"
U_TMP_FILE="$(mktemp).tif"
V_TMP_FILE="$(mktemp).tif"
LENGTH_TMP_FILE="$(mktemp).vrt"
MERGED_TMP_FILE="$(mktemp).vrt"

# map longitude from 0..360 to -180..180
gdalwarp \
    -te -180 -90 180 90 \
    "$INPUT_FILE" \
    "$TMP_FILE"

# calculate length
gdal_calc.py --calc='A * cos(((360 - B) - 90) / 180 * pi)' -A "$TMP_FILE" --A_band=1 -B "$TMP_FILE" --B_band=2 --outfile "$U_TMP_FILE"
gdal_calc.py --calc='A * sin(((360 - B) - 90) / 180 * pi)' -A "$TMP_FILE" --A_band=1 -B "$TMP_FILE" --B_band=2 --outfile "$V_TMP_FILE"
gdalbuildvrt -b 1 "$LENGTH_TMP_FILE" "$TMP_FILE"
gdalbuildvrt -separate "$MERGED_TMP_FILE" "$LENGTH_TMP_FILE" "$U_TMP_FILE" "$V_TMP_FILE"

# transform into PNG image texture
# map values to 0..255 uint8
gdal_translate \
    -ot Byte \
    -b 1 -b 2 -b 3 \
    -scale_1 "$VALUE_MIN" "$VALUE_MAX" \
    -scale_2 "$VECTOR_MIN" "$VECTOR_MAX" \
    -scale_3 "$VECTOR_MIN" "$VECTOR_MAX" \
    "$MERGED_TMP_FILE" \
    "$OUTPUT_FILE"

rm "$TMP_FILE"
rm "$LENGTH_TMP_FILE"
rm "$U_TMP_FILE"
rm "$V_TMP_FILE"
rm "$MERGED_TMP_FILE"