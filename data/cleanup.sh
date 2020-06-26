#!/bin/bash

set -eu

DIR="$(dirname $0)"

for LAYER in wind tmp rh apcp cape tpw tcw prmsl aptmp; do
    find "$DIR/gfs/$LAYER" -name *.grib -or -name *.png -or -name *.png.aux.xml | xargs rm
done
