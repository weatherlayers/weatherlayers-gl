#!/bin/bash

set -eu

DIR="$(dirname "$0")"

DATE="$1"
OFFSET="$(($("$DIR/date_format.sh" "$DATE" "%s") / 86400 - $("$DIR/date_format.sh" 19921005 "%s") / 86400))"
URL="https://podaac-tools.jpl.nasa.gov/drive/files/allData/oscar/preview/L4/oscar_third_deg/oscar_vel$OFFSET.nc.gz"
OUTPUT_FILE="$2"

curl -f -u "$PODAAC_USERNAME:$PODAAC_PASSWORD" "$URL" -o "$OUTPUT_FILE.gz"
gunzip "$OUTPUT_FILE.gz"