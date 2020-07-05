#!/bin/bash

set -eu

DATE="$1" # YYYYMMDD
TIME="$2" # 00, 06, 12, 18
DIR="dir=%2Fmulti_1.${DATE}"
FILE="file=multi_1.nww3.t${TIME}z.grib2"
VARIABLES="$(echo -n "$3" | awk 'BEGIN { RS=","; OFS="" } { print "var_", $1, "=on" }' | paste -d'&' -s -)"
LEVEL="lev_surface=on"
BBOX="leftlon=0&rightlon=360&toplat=90&bottomlat=-90"
URL="https://nomads.ncep.noaa.gov/cgi-bin/filter_wave.pl?${DIR}&${FILE}&${VARIABLES}&${LEVEL}&${BBOX}"
OUTPUT_FILE="$4"

if [ ! -f "$OUTPUT_FILE" ]; then
    curl "$URL" -o "$OUTPUT_FILE"
fi