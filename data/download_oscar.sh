#!/bin/bash

set -eu

date_to_timestamp() {
    DATE="$1"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        date -j -f "%Y%m%d" "$DATE" "+%s"
    else
        date -d "$DATE" "+%s"
    fi
}

DATE="$1"
OFFSET="$(($(date_to_timestamp "$DATE") / 86400 - $(date_to_timestamp 19921005) / 86400))"
URL="https://podaac-tools.jpl.nasa.gov/drive/files/allData/oscar/preview/L4/oscar_third_deg/oscar_vel$OFFSET.nc.gz"
OUTPUT_FILE="$2"

if [ ! -f "$OUTPUT_FILE" ]; then
    curl -u "$EARTHDATA_PODAAC_USERNAME:$EARTHDATA_PODAAC_PASSWORD" "$URL" -o "$OUTPUT_FILE.gz"
    gunzip "$OUTPUT_FILE.gz"
fi

