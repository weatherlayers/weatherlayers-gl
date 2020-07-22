#!/bin/bash

set -eu

DATETIME="$1" # YYYYMMDDHH
OFFSET="$((10#$2))"

OFFSET_SIGN="+"
if [ "$OFFSET" -lt 0 ]; then
    OFFSET_SIGN=""
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
    date -j -v "$OFFSET_SIGN${OFFSET}H" -f "%Y%m%d%H" "$DATETIME" "+%Y%m%d%H"
else
    date -d "${DATETIME:0:8} ${DATETIME:8:2} $OFFSET_SIGN$OFFSET hours" "+%Y%m%d%H"
fi