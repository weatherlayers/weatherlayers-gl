#!/bin/bash

set -eu

DIR="$(dirname "$0")"

find "$DIR" -name *.grib -or -name *.nc | xargs rm