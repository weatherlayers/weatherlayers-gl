#!/bin/bash

set -eu

DATE="$1" # YYYYMMDD
TIME="$(printf "%02d" "$((10#$2))")" # 00, 06, 12, 18
RESOLUTION="0p25" # 0p25, 0p50, 1p00
FORECAST="$(printf "%03d" "$((10#$3))")" # hourly 000-120, 3-hourly 123-384
DIR="gfs.$DATE/$TIME"
FILE="gfs.t${TIME}z.pgrb2.$RESOLUTION.f$FORECAST"
URL="https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/$DIR/$FILE"
OUTPUT_FILE="$4"

curl -f "$URL" -o "$OUTPUT_FILE"