#!/bin/bash

set -eu

DIR="$(dirname $0)"

DATE="20200626" # YYYYMMDD
TIME="12" # 00, 06, 12, 18

echo WIND
mkdir -p "$DIR/gfs/wind"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 0 UGRD,VGRD 10_m_above_ground "$DIR/gfs/wind/$DATE$TIME.f000.grib"
"$DIR/convert_gfs_wind.sh" 0 100 -128 127 "$DIR/gfs/wind/$DATE$TIME.f000.grib" "$DIR/gfs/wind/$DATE$TIME.f000.png"
echo

echo TMP
mkdir -p "$DIR/gfs/tmp"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 0 TMP 2_m_above_ground "$DIR/gfs/tmp/$DATE$TIME.f000.grib"
"$DIR/convert_gfs.sh" 193 328 "$DIR/gfs/tmp/$DATE$TIME.f000.grib" "$DIR/gfs/tmp/$DATE$TIME.f000.png"
echo

echo RH
mkdir -p "$DIR/gfs/rh"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 0 RH 2_m_above_ground "$DIR/gfs/rh/$DATE$TIME.f000.grib"
"$DIR/convert_gfs.sh" 0 100 "$DIR/gfs/rh/$DATE$TIME.f000.grib" "$DIR/gfs/rh/$DATE$TIME.f000.png"
echo

echo APCP
mkdir -p "$DIR/gfs/apcp"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 3 APCP surface "$DIR/gfs/apcp/$DATE$TIME.f003.grib"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 6 APCP surface "$DIR/gfs/apcp/$DATE$TIME.f006.grib"
"$DIR/convert_gfs_apcp.sh" 0 150 "$DIR/gfs/apcp/$DATE$TIME.f003.grib" "$DIR/gfs/apcp/$DATE$TIME.f006.grib" "$DIR/gfs/apcp/$DATE$TIME.f003.png"
echo

echo CAPE
mkdir -p "$DIR/gfs/cape"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 0 CAPE surface "$DIR/gfs/cape/$DATE$TIME.f000.grib"
"$DIR/convert_gfs.sh" 0 5000 "$DIR/gfs/cape/$DATE$TIME.f000.grib" "$DIR/gfs/cape/$DATE$TIME.f000.png"
echo

echo PWAT
mkdir -p "$DIR/gfs/pwat"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 0 PWAT entire_atmosphere_%5C%28considered_as_a_single_layer%5C%29 "$DIR/gfs/pwat/$DATE$TIME.f000.grib"
"$DIR/convert_gfs.sh" 0 70 "$DIR/gfs/pwat/$DATE$TIME.f000.grib" "$DIR/gfs/pwat/$DATE$TIME.f000.png"
echo

echo CWAT
mkdir -p "$DIR/gfs/cwat"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 0 CWAT entire_atmosphere_%5C%28considered_as_a_single_layer%5C%29 "$DIR/gfs/cwat/$DATE$TIME.f000.grib"
"$DIR/convert_gfs.sh" 0 1 "$DIR/gfs/cwat/$DATE$TIME.f000.grib" "$DIR/gfs/cwat/$DATE$TIME.f000.png"
echo

echo PRMSL
mkdir -p "$DIR/gfs/prmsl"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 0 PRMSL mean_sea_level "$DIR/gfs/prmsl/$DATE$TIME.f000.grib"
"$DIR/convert_gfs.sh" 92000 105000 "$DIR/gfs/prmsl/$DATE$TIME.f000.grib" "$DIR/gfs/prmsl/$DATE$TIME.f000.png"
echo

echo APTMP
mkdir -p "$DIR/gfs/aptmp"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 0 APTMP 2_m_above_ground "$DIR/gfs/aptmp/$DATE$TIME.f000.grib"
"$DIR/convert_gfs.sh" 236 332 "$DIR/gfs/aptmp/$DATE$TIME.f000.grib" "$DIR/gfs/aptmp/$DATE$TIME.f000.png"
echo