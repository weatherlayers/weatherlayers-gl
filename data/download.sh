#!/bin/bash

set -eu

DIR="$(dirname $0)"

DATE="20200615" # YYYYMMDD
TIME="00" # 00, 06, 12, 18

for LAYER in wind tmp rh apcp03 cape tpw tcw prmsl aptmp; do
    "$DIR/gfs/$LAYER/download.sh" "$DATE" "$TIME"
done
