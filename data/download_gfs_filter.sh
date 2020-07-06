#!/bin/bash

set -eu

DATE="$1" # YYYYMMDD
TIME="$(printf "%02d" "$((10#$2))")" # 00, 06, 12, 18
RESOLUTION="0p25" # 0p25, 0p50, 1p00
FORECAST="$(printf "%03d" "$((10#$3))")" # hourly 000-120, 3-hourly 123-384
DIR="dir=%2Fgfs.$DATE%2F$TIME"
FILE="file=gfs.t${TIME}z.pgrb2.$RESOLUTION.f$FORECAST"
VARIABLES="$(echo -n "$4" | awk 'BEGIN { RS=","; OFS="" } { print "var_", $1, "=on" }' | paste -d'&' -s -)"
LEVEL="lev_$5=on"
BBOX="leftlon=0&rightlon=360&toplat=90&bottomlat=-90"
URL="https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_$RESOLUTION.pl?$DIR&$FILE&$VARIABLES&$LEVEL&$BBOX"
OUTPUT_FILE="$6"

curl -f "$URL" -o "$OUTPUT_FILE"