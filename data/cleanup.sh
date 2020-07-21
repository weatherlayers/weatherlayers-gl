#!/bin/bash

set -eu

DIR="$(dirname "$0")"

find "$DIR" \( -name *.tif -or -name *.png -or -name *.png.aux.xml \) -delete