#!/bin/bash

set -eu

DIR="$(dirname $0)"

"$DIR/gfs/wind/download.sh"
"$DIR/gfs/temperature/download.sh"
"$DIR/gfs/humidity/download.sh"
"$DIR/gfs/precipitation/download.sh"
"$DIR/gfs/cape/download.sh"
