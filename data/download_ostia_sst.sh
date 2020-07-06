#!/bin/bash

set -eu

DIR="$(dirname "$0")"

DATE="$1"
YEAR="$("$DIR/date_format.sh" "$DATE" "%Y")"
MONTH="$("$DIR/date_format.sh" "$DATE" "%m")"
URL="ftp://nrt.cmems-du.eu/Core/SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001/METOFFICE-GLO-SST-L4-NRT-OBS-SST-V2/$YEAR/$MONTH/${DATE}120000-UKMO-L4_GHRSST-SSTfnd-OSTIA-GLOB-v02.0-fv02.0.nc"
OUTPUT_FILE="$2"

curl -f -u "$CMEMS_USERNAME:$CMEMS_PASSWORD" "$URL" -o "$OUTPUT_FILE"