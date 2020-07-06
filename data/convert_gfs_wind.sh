#!/bin/bash

set -eu

DIR="$(dirname "$0")"

U_VARIABLE="$1"
V_VARIABLE="$2"
LEVEL="$3"
VALUE_MIN="$4"
VALUE_MAX="$5"
VECTOR_MIN="$6"
VECTOR_MAX="$7"
INPUT_FILE="$8"
OUTPUT_FILE="$9"
U_TMP_FILE1="$(mktemp).tif"
U_TMP_FILE2="$(mktemp).tif"
V_TMP_FILE1="$(mktemp).tif"
V_TMP_FILE2="$(mktemp).tif"
LENGTH_TMP_FILE="$(mktemp).tif"
MERGED_TMP_FILE="$(mktemp).vrt"

# extract data
BAND1="$("$DIR/get_grib_band.sh" "$INPUT_FILE" "$U_VARIABLE" "$LEVEL")"
BAND2="$("$DIR/get_grib_band.sh" "$INPUT_FILE" "$V_VARIABLE" "$LEVEL")"
gdal_translate -b "$BAND1" --config GRIB_NORMALIZE_UNITS NO "$INPUT_FILE" "$U_TMP_FILE1"
gdal_translate -b "$BAND2" --config GRIB_NORMALIZE_UNITS NO "$INPUT_FILE" "$V_TMP_FILE1"

# wrap longitude to -180..180
gdalwarp -t_srs EPSG:4326 -te -180 -90 180 90 "$U_TMP_FILE1" "$U_TMP_FILE2"
gdalwarp -t_srs EPSG:4326 -te -180 -90 180 90 "$V_TMP_FILE1" "$V_TMP_FILE2"

# calculate length
gdal_calc.py --calc='sqrt(A * A + B * B)' -A "$U_TMP_FILE2" --A_band=1 -B "$V_TMP_FILE2" --B_band=1 --outfile "$LENGTH_TMP_FILE"
gdalbuildvrt -separate "$MERGED_TMP_FILE" "$LENGTH_TMP_FILE" "$U_TMP_FILE2" "$V_TMP_FILE2"

# convert to PNG image
# scale values to 0..255 uint8
gdal_translate -ot Byte -b 1 -b 2 -b 3 -scale_1 "$VALUE_MIN" "$VALUE_MAX" -scale_2 "$VECTOR_MIN" "$VECTOR_MAX" -scale_3 "$VECTOR_MIN" "$VECTOR_MAX" "$MERGED_TMP_FILE" "$OUTPUT_FILE"

rm "$U_TMP_FILE1"
rm "$U_TMP_FILE2"
rm "$V_TMP_FILE1"
rm "$V_TMP_FILE2"
rm "$LENGTH_TMP_FILE"
rm "$MERGED_TMP_FILE"