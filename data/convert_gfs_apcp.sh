#!/bin/bash

set -eu

VALUE_MIN="$1"
VALUE_MAX="$2"
INPUT_FILE1="$3"
INPUT_FILE2="$4"
OUTPUT_FILE="$5"
TMP_FILE1="$(mktemp).tif"
TMP_FILE2="$(mktemp).tif"
DIFF_TMP_FILE="$(mktemp).tif"

# map longitude from 0..360 to -180..180
gdalwarp \
    -te -180 -90 180 90 \
    --config GRIB_NORMALIZE_UNITS NO \
    "$INPUT_FILE1" \
    "$TMP_FILE1"
gdalwarp \
    -te -180 -90 180 90 \
    --config GRIB_NORMALIZE_UNITS NO \
    "$INPUT_FILE2" \
    "$TMP_FILE2"

# calculate difference
gdal_calc.py --calc='B - A' -A "$TMP_FILE1" --A_band=1 -B "$TMP_FILE2" --B_band=1 --outfile "$DIFF_TMP_FILE"

# transform into PNG image texture
# map values to 0..255 uint8
gdal_translate \
    -ot Byte \
    -b 1 \
    -scale "$VALUE_MIN" "$VALUE_MAX" \
    "$DIFF_TMP_FILE" \
    "$OUTPUT_FILE"

rm "$TMP_FILE1"
rm "$TMP_FILE2"
rm "$DIFF_TMP_FILE"