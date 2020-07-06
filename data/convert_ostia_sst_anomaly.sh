#!/bin/bash

set -eu

VARIABLE="$1"
VALUE_MIN="$2"
VALUE_MAX="$3"
INPUT_FILE="$4"
OUTPUT_FILE="$5"
TMP_FILE1="$(mktemp).tif"
TMP_FILE2="$(mktemp).tif"

# extract data
gdal_translate -ot Float32 -unscale NETCDF:"$INPUT_FILE":"$VARIABLE" "$TMP_FILE1"

# wrap longitude to -180..180
gdalwarp -s_srs "+proj=longlat +datum=WGS84 +lon_wrap=180" -t_srs EPSG:4326 -te -180 -90 180 90 "$TMP_FILE1" "$TMP_FILE2"

# convert to PNG image
# scale values to 0..255 uint8
gdal_translate -ot Byte -b 1 -b 1 -b 1 -b mask,1 -scale "$VALUE_MIN" "$VALUE_MAX" "$TMP_FILE2" "$OUTPUT_FILE"

rm "$TMP_FILE1"
rm "$TMP_FILE2"