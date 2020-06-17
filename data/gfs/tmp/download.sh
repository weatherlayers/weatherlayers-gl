#!/bin/bash

set -eu

DIR="$(dirname $0)"

DATE="$1" # YYYYMMDD
TIME="$2" # 00, 06, 12, 18
OFFSET="f000" # 3-hourly up to 10 days, 12-hourly up to 16 days
RESOLUTION="0p25" # 0p25, 0p50 or 1p00
LEVEL="lev_2_m_above_ground=on"
VARIABLES="var_TMP=on"
BBOX="leftlon=0&rightlon=360&toplat=90&bottomlat=-90"
URL="https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_${RESOLUTION}.pl?file=gfs.t${TIME}z.pgrb2.${RESOLUTION}.${OFFSET}&${LEVEL}&${VARIABLES}&${BBOX}&dir=%2Fgfs.${DATE}%2F${TIME}"

LAYER_FILENAME_PREFIX="${DIR}/${DATE}${TIME}"
INPUT_FILE="${LAYER_FILENAME_PREFIX}.grib"
OUTPUT_FILE="${LAYER_FILENAME_PREFIX}.png"

# download GFS file
if [ ! -f "$INPUT_FILE" ]; then
    curl "$URL" -o "$INPUT_FILE"
fi

"$DIR/convert.sh" "$INPUT_FILE" "$OUTPUT_FILE"
