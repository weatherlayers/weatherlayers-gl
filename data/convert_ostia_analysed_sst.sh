#!/bin/bash

set -eu

VARIABLE="$1"
VALUE_MIN="$2"
VALUE_MAX="$3"
INPUT_FILE="$4"
OUTPUT_FILE="$5"
TMP_FILE="$(mktemp).tif"

# extract data
gdal_translate -ot Float32 -unscale NETCDF:"$INPUT_FILE":"$VARIABLE" "$TMP_FILE"

# convert to PNG image
# scale values to 0..255 uint8
gdal_translate -ot Byte -b 1 -b 1 -b 1 -b mask,1 -scale "$VALUE_MIN" "$VALUE_MAX" "$TMP_FILE" "$OUTPUT_FILE"

rm "$TMP_FILE"