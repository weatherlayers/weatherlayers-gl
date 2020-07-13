#!/bin/bash

set -eu

DIR="$(dirname "$0")"

LENGTH_VARIABLE="$1"
DIRECTION_VARIABLE="$2"
VALUE_MIN="$3"
VALUE_MAX="$4"
VECTOR_MIN="$5"
VECTOR_MAX="$6"
INPUT_FILE="$7"
OUTPUT_FILE="$8"
LENGTH_TMP_FILE1="$(mktemp).tif"
DIRECTION_TMP_FILE1="$(mktemp).tif"
LENGTH_TMP_FILE2="$(mktemp).tif"
DIRECTION_TMP_FILE2="$(mktemp).tif"
U_TMP_FILE="$(mktemp).tif"
V_TMP_FILE="$(mktemp).tif"
MERGED_TMP_FILE="$(mktemp).vrt"

# extract data
LENGTH_BAND="$("$DIR/get_wavewatch_band.sh" "$INPUT_FILE" "$LENGTH_VARIABLE")"
DIRECTION_BAND="$("$DIR/get_wavewatch_band.sh" "$INPUT_FILE" "$DIRECTION_VARIABLE")"
gdal_translate -b "$LENGTH_BAND" --config GRIB_NORMALIZE_UNITS NO "$INPUT_FILE" "$LENGTH_TMP_FILE1"
gdal_translate -b "$DIRECTION_BAND" --config GRIB_NORMALIZE_UNITS NO "$INPUT_FILE" "$DIRECTION_TMP_FILE1"

# wrap longitude to -180..180
gdalwarp -t_srs EPSG:4326 -te -180 -90 180 90 "$LENGTH_TMP_FILE1" "$LENGTH_TMP_FILE2"
gdalwarp -t_srs EPSG:4326 -te -180 -90 180 90 "$DIRECTION_TMP_FILE1" "$DIRECTION_TMP_FILE2"

# calculate length
gdal_calc.py --calc='A * cos(((360 - B) - 90) / 180 * pi)' -A "$LENGTH_TMP_FILE2" --A_band=1 -B "$DIRECTION_TMP_FILE2" --B_band=1 --outfile "$U_TMP_FILE"
gdal_calc.py --calc='A * sin(((360 - B) - 90) / 180 * pi)' -A "$LENGTH_TMP_FILE2" --A_band=1 -B "$DIRECTION_TMP_FILE2" --B_band=1 --outfile "$V_TMP_FILE"
gdalbuildvrt -separate "$MERGED_TMP_FILE" "$LENGTH_TMP_FILE2" "$U_TMP_FILE" "$V_TMP_FILE"

# convert to PNG image
# scale values to 0..255 uint8
gdal_translate -ot Byte -b 1 -b 2 -b 3 -scale_1 "$VALUE_MIN" "$VALUE_MAX" -scale_2 "$VECTOR_MIN" "$VECTOR_MAX" -scale_3 "$VECTOR_MIN" "$VECTOR_MAX" "$MERGED_TMP_FILE" "$OUTPUT_FILE"

rm "$LENGTH_TMP_FILE1"
rm "$LENGTH_TMP_FILE2"
rm "$DIRECTION_TMP_FILE1"
rm "$DIRECTION_TMP_FILE2"
rm "$U_TMP_FILE"
rm "$V_TMP_FILE"
rm "$MERGED_TMP_FILE"