#!/bin/bash

set -eu

DIR="$(dirname "$0")"

VARIABLE="$1"
LEVEL="$2"
VALUE_MIN="$3"
VALUE_MAX="$4"
INPUT_FILE="$5"
OUTPUT_FILE="$6"
TMP_FILE1="$(mktemp).tif"
TMP_FILE2="$(mktemp).tif"

# extract data
BAND="$("$DIR/get_grib_band.sh" "$INPUT_FILE" "$VARIABLE" "$LEVEL")"
gdal_translate -b "$BAND" --config GRIB_NORMALIZE_UNITS NO "$INPUT_FILE" "$TMP_FILE1"

# wrap longitude to -180..180
gdalwarp -t_srs EPSG:4326 -te -180 -90 180 90 "$TMP_FILE1" "$TMP_FILE2"

# convert to PNG image
# scale values to 0..255 uint8
gdal_translate -ot Byte -b 1 -scale "$VALUE_MIN" "$VALUE_MAX" "$TMP_FILE2" "$OUTPUT_FILE"

rm "$TMP_FILE1"
rm "$TMP_FILE2"