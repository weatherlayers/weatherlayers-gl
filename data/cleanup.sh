#!/bin/bash

set -eu

DIR="$(dirname $0)"

for LAYER in wind tmp rh apcp03 cape tpw tcw prmsl aptmp; do
    find "$DIR/gfs/$LAYER" -name *.grib | xargs rm
done
