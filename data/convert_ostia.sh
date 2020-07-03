#!/bin/bash

set -eu

VALUE_MIN="$1"
VALUE_MAX="$2"
INPUT_FILE="$3"
OUTPUT_FILE="$4"
TMP_FILE="$(mktemp).tif"

# transform into PNG image texture
# map values to 0..255 uint8
gdal_translate \
    -ot Float32 \
    -unscale \
    NETCDF:"$INPUT_FILE":analysed_sst \
    "$TMP_FILE"
gdal_translate \
    -ot Byte \
    -b 1 -b 1 -b 1 -b mask,1 \
    -scale "$VALUE_MIN" "$VALUE_MAX" \
    "$TMP_FILE" \
    "$OUTPUT_FILE"

rm "$TMP_FILE"