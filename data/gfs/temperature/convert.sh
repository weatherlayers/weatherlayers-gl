#!/bin/bash

set -eu

INPUT_FILE="$1"
OUTPUT_FILE="$2"
TMP_FILE="$(mktemp).tif"

# map longitude from 0..360 to -180..180
gdalwarp \
    --config CENTER_LONG 0 \
    "$INPUT_FILE" \
    "$TMP_FILE"

# transform into PNG image texture
# map values from -128..127 float to 0..255 uint8
gdal_translate \
    -ot Byte \
    -b 1 \
    -scale -128 127 0 255 \
    "$TMP_FILE" \
    "$OUTPUT_FILE"

rm "$TMP_FILE"

# rm -f 1.tif 2.tif 3.tif 4.tif 5.vrt
# gdal_calc.py --calc='((A + 128) % 1) * 255' -A "$TMP_FILE" --A_band=1 --outfile 1.tif
# gdal_calc.py --calc='((A + 128) % 1) * 255' -A "$TMP_FILE" --A_band=2 --outfile 2.tif
# gdal_calc.py --calc='(floor(A + 128) / 255) * 255' -A "$TMP_FILE" --A_band=1 --outfile 3.tif
# gdal_calc.py --calc='(floor(A + 128) / 255) * 255' -A "$TMP_FILE" --A_band=2 --outfile 4.tif
# gdalbuildvrt -separate 5.vrt 1.tif 2.tif 3.tif 4.tif
# gdal_translate -ot Byte 5.vrt "${LAYER_FILENAME_PREFIX}.2.png"

# Maidstone, no wind
# LAT="51.270798"
# LNG="0.520587"
# gdallocationinfo -wgs84 -valonly "$TMP_FILE" "$LNG" "$LAT"
# gdallocationinfo -wgs84 -valonly "$OUTPUT_FILE" "$LNG" "$LAT" | head -2 | xargs -I{} echo "scale=14; ({}/255)*255-128" | bc
# gdallocationinfo -wgs84 -valonly "${LAYER_FILENAME_PREFIX}.2.png" "$LNG" "$LAT"