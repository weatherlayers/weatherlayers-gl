#!/bin/bash

set -eu

DATE="$1"
FORMAT="$2"

if [[ "$OSTYPE" == "darwin"* ]]; then
    date -j -f "%Y%m%d" "$DATE" "+$FORMAT"
else
    date -d "$DATE" "+$FORMAT"
fi