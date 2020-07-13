#!/bin/bash

set -eu

DIR="$(dirname "$0")"

START_VARIABLE="$1"
END_VARIABLE="$2"
LEVEL="$3"
VALUE_MIN="$4"
VALUE_MAX="$5"
START_INPUT_FILE="$6"
END_INPUT_FILE="$7"
OUTPUT_FILE="$8"
START_TMP_FILE1="$(mktemp).tif"
END_TMP_FILE1="$(mktemp).tif"
START_TMP_FILE2="$(mktemp).tif"
END_TMP_FILE2="$(mktemp).tif"
DIFF_TMP_FILE="$(mktemp).tif"

# extract data
START_BAND="$("$DIR/get_gfs_band.sh" "$START_INPUT_FILE" "$START_VARIABLE" "$LEVEL")"
END_BAND="$("$DIR/get_gfs_band.sh" "$END_INPUT_FILE" "$END_VARIABLE" "$LEVEL")"
gdal_translate -b "$START_BAND" --config GRIB_NORMALIZE_UNITS NO "$START_INPUT_FILE" "$START_TMP_FILE1"
gdal_translate -b "$END_BAND" --config GRIB_NORMALIZE_UNITS NO "$END_INPUT_FILE" "$END_TMP_FILE1"

# wrap longitude to -180..180
gdalwarp -t_srs EPSG:4326 -te -180 -90 180 90 "$START_TMP_FILE1" "$START_TMP_FILE2"
gdalwarp -t_srs EPSG:4326 -te -180 -90 180 90 "$END_TMP_FILE1" "$END_TMP_FILE2"

# calculate diff
gdal_calc.py --calc='B - A' -A "$START_TMP_FILE2" --A_band=1 -B "$END_TMP_FILE2" --B_band=1 --outfile "$DIFF_TMP_FILE"

# convert to PNG image
# scale values to 0..255 uint8
gdal_translate -ot Byte -b 1 -scale "$VALUE_MIN" "$VALUE_MAX" "$DIFF_TMP_FILE" "$OUTPUT_FILE"

rm "$START_TMP_FILE1"
rm "$END_TMP_FILE1"
rm "$START_TMP_FILE2"
rm "$END_TMP_FILE2"
rm "$DIFF_TMP_FILE"