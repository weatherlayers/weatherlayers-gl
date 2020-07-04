#!/bin/bash

set -eu

VARIABLE="$1"
VALUE_MIN="$2"
VALUE_MAX="$3"
INPUT_FILE="$4"
OUTPUT_FILE="$5"
TMP_FILE="$(mktemp).tif"
TMP_FILE2="$(mktemp).tif"

# map longitude from 0..360 to -180..180
gdal_translate \
    -ot Float32 \
    -unscale \
    NETCDF:"$INPUT_FILE":"$VARIABLE" \
    "$TMP_FILE"
gdalwarp \
    -s_srs "+proj=longlat +datum=WGS84 +lon_wrap=180" \
    -t_srs EPSG:4326 \
    -te -180 -90 180 90 \
    "$TMP_FILE" \
    "$TMP_FILE2"

# transform into PNG image texture
# map values to 0..255 uint8
gdal_translate \
    -ot Byte \
    -b 1 -b 1 -b 1 -b mask,1 \
    -scale "$VALUE_MIN" "$VALUE_MAX" \
    "$TMP_FILE2" \
    "$OUTPUT_FILE"

rm "$TMP_FILE"
rm "$TMP_FILE2"