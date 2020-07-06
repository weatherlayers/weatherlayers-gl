#!/bin/bash

set -eu

VALUE_MIN="$1"
VALUE_MAX="$2"
VECTOR_MIN="$3"
VECTOR_MAX="$4"
INPUT_FILE="$5"
OUTPUT_FILE="$6"
U_TMP_FILE="$(mktemp).tif"
V_TMP_FILE="$(mktemp).tif"
LENGTH_TMP_FILE="$(mktemp).tif"
MERGED_TMP_FILE="$(mktemp).vrt"

# wrap longitude to -180..180
gdalwarp -s_srs "+proj=longlat +datum=WGS84 +lon_wrap=220" -t_srs EPSG:4326 -te -180 -90 180 90 -srcnodata nan -dstalpha -wo SOURCE_EXTRA=1000 NETCDF:"$INPUT_FILE":u "$U_TMP_FILE"
gdalwarp -s_srs "+proj=longlat +datum=WGS84 +lon_wrap=220" -t_srs EPSG:4326 -te -180 -90 180 90 -srcnodata nan -dstalpha -wo SOURCE_EXTRA=1000 NETCDF:"$INPUT_FILE":v "$V_TMP_FILE"

# calculate length
gdal_calc.py --calc='sqrt(A * A + B * B)' -A "$U_TMP_FILE" -B "$V_TMP_FILE" --NoDataValue=0 --outfile "$LENGTH_TMP_FILE"
gdalbuildvrt -separate "$MERGED_TMP_FILE" "$LENGTH_TMP_FILE" "$U_TMP_FILE" "$V_TMP_FILE"

# convert to PNG image
# scale values to 0..255 uint8
gdal_translate -ot Byte -b 1 -b 2 -b 3 -b mask,1 -scale_1 "$VALUE_MIN" "$VALUE_MAX" -scale_2 "$VECTOR_MIN" "$VECTOR_MAX" -scale_3 "$VECTOR_MIN" "$VECTOR_MAX" "$MERGED_TMP_FILE" "$OUTPUT_FILE"

rm "$U_TMP_FILE"
rm "$V_TMP_FILE"
rm "$LENGTH_TMP_FILE"
rm "$MERGED_TMP_FILE"