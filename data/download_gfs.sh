#!/bin/bash

set -eu

RESOLUTION="0p25" # 0p25, 0p50, 1p00
DATE="$1" # YYYYMMDD
TIME="$2" # 00, 06, 12, 18
OFFSET="$(printf "%03d" $3)" # 3-hourly up to 10 days, 12-hourly up to 16 days
VARIABLES="$(echo -n "$4" | awk 'BEGIN { RS=","; OFS="" } { print "var_", $1, "=on" }' | paste -d'&' -s -)"
LEVEL="lev_$5=on"
BBOX="leftlon=0&rightlon=360&toplat=90&bottomlat=-90"
URL="https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_${RESOLUTION}.pl?file=gfs.t${TIME}z.pgrb2.${RESOLUTION}.f${OFFSET}&${VARIABLES}&${LEVEL}&${BBOX}&dir=%2Fgfs.${DATE}%2F${TIME}"
OUTPUT_FILE="$6"

if [ ! -f "$OUTPUT_FILE" ]; then
    curl "$URL" -o "$OUTPUT_FILE"
fi