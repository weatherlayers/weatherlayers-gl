#!/bin/bash

set -eu

DIR="$(dirname $0)"

find "$DIR" -name *.grib -or -name *.png -or -name *.png.aux.xml | xargs rm