#!/bin/bash

set -eu

DATETIME="$1" # YYYYMMDDHH
OFFSET="$((10#$2))"

if [[ "$OSTYPE" == "darwin"* ]]; then
    date -j -v "${OFFSET}H" -f "%Y%m%d%H" "$DATETIME" "+%Y%m%d%H"
else
    date -d "${DATETIME:0:8} ${DATETIME:8:2} $OFFSET hours" "+%Y%m%d%H"
fi