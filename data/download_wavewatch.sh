#!/bin/bash

set -eu

DATE="$1" # YYYYMMDD
TIME="$(printf "%02d" "$((10#$2))")" # 00, 06, 12, 18
DIR="multi_1.$DATE"
FILE="multi_1.nww3.t${TIME}z.grib2"
URL="https://nomads.ncep.noaa.gov/pub/data/nccf/com/wave/prod/$DIR/$FILE"
OUTPUT_FILE="$3"

curl -f "$URL" -o "$OUTPUT_FILE"