#!/bin/bash

set -eu

DIR="$(dirname $0)"

"$DIR/gfs/wind/download.sh"
"$DIR/gfs/tmp/download.sh"
"$DIR/gfs/rh/download.sh"
"$DIR/gfs/apcp03/download.sh"
"$DIR/gfs/cape/download.sh"
"$DIR/gfs/tpw/download.sh"
"$DIR/gfs/tcw/download.sh"
"$DIR/gfs/prmsl/download.sh"
"$DIR/gfs/aptmp/download.sh"
