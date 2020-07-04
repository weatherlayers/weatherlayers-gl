#!/bin/bash

set -eu

DIR="$(dirname $0)"

DATE="20200626" # YYYYMMDD
TIME="12" # 00, 06, 12, 18

echo "GFS - wind"
mkdir -p "$DIR/gfs/wind"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 0 UGRD,VGRD 10_m_above_ground "$DIR/gfs/wind/$DATE$TIME.f000.grib"
"$DIR/convert_gfs_wind.sh" 0 100 -128 127 "$DIR/gfs/wind/$DATE$TIME.f000.grib" "$DIR/gfs/wind/$DATE$TIME.f000.png"
echo

echo "GFS - TMP"
mkdir -p "$DIR/gfs/tmp"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 0 TMP 2_m_above_ground "$DIR/gfs/tmp/$DATE$TIME.f000.grib"
"$DIR/convert_gfs.sh" 193 328 "$DIR/gfs/tmp/$DATE$TIME.f000.grib" "$DIR/gfs/tmp/$DATE$TIME.f000.png"
echo

echo "GFS - RH"
mkdir -p "$DIR/gfs/rh"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 0 RH 2_m_above_ground "$DIR/gfs/rh/$DATE$TIME.f000.grib"
"$DIR/convert_gfs.sh" 0 100 "$DIR/gfs/rh/$DATE$TIME.f000.grib" "$DIR/gfs/rh/$DATE$TIME.f000.png"
echo

echo "GFS - APCP"
mkdir -p "$DIR/gfs/apcp"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 3 APCP surface "$DIR/gfs/apcp/$DATE$TIME.f003.grib"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 6 APCP surface "$DIR/gfs/apcp/$DATE$TIME.f006.grib"
"$DIR/convert_gfs_apcp.sh" 0 150 "$DIR/gfs/apcp/$DATE$TIME.f003.grib" "$DIR/gfs/apcp/$DATE$TIME.f006.grib" "$DIR/gfs/apcp/$DATE$TIME.f003.png"
echo

echo "GFS - CAPE"
mkdir -p "$DIR/gfs/cape"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 0 CAPE surface "$DIR/gfs/cape/$DATE$TIME.f000.grib"
"$DIR/convert_gfs.sh" 0 5000 "$DIR/gfs/cape/$DATE$TIME.f000.grib" "$DIR/gfs/cape/$DATE$TIME.f000.png"
echo

echo "GFS - PWAT"
mkdir -p "$DIR/gfs/pwat"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 0 PWAT "entire_atmosphere_(considered_as_a_single_layer)" "$DIR/gfs/pwat/$DATE$TIME.f000.grib"
"$DIR/convert_gfs.sh" 0 70 "$DIR/gfs/pwat/$DATE$TIME.f000.grib" "$DIR/gfs/pwat/$DATE$TIME.f000.png"
echo

echo "GFS - CWAT"
mkdir -p "$DIR/gfs/cwat"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 0 CWAT "entire_atmosphere_(considered_as_a_single_layer)" "$DIR/gfs/cwat/$DATE$TIME.f000.grib"
"$DIR/convert_gfs.sh" 0 1 "$DIR/gfs/cwat/$DATE$TIME.f000.grib" "$DIR/gfs/cwat/$DATE$TIME.f000.png"
echo

echo "GFS - PRMSL"
mkdir -p "$DIR/gfs/prmsl"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 0 PRMSL mean_sea_level "$DIR/gfs/prmsl/$DATE$TIME.f000.grib"
"$DIR/convert_gfs.sh" 92000 105000 "$DIR/gfs/prmsl/$DATE$TIME.f000.grib" "$DIR/gfs/prmsl/$DATE$TIME.f000.png"
echo

echo "GFS - APTMP"
mkdir -p "$DIR/gfs/aptmp"
"$DIR/download_gfs.sh" "$DATE" "$TIME" 0 APTMP 2_m_above_ground "$DIR/gfs/aptmp/$DATE$TIME.f000.grib"
"$DIR/convert_gfs.sh" 236 332 "$DIR/gfs/aptmp/$DATE$TIME.f000.grib" "$DIR/gfs/aptmp/$DATE$TIME.f000.png"
echo

echo "OSCAR - currents"
mkdir -p "$DIR/oscar/currents"
"$DIR/download_oscar.sh" "$DATE" "$DIR/oscar/currents/$DATE.nc"
"$DIR/convert_oscar.sh" 0 1.5 -1 1 "$DIR/oscar/currents/$DATE.nc" "$DIR/oscar/currents/$DATE.png"
echo

echo "OSTIA - analysed_sst"
mkdir -p "$DIR/ostia/analysed_sst"
"$DIR/download_ostia.sh" "$DATE" SST "" "$DIR/ostia/analysed_sst/$DATE.nc"
"$DIR/convert_ostia_analysed_sst.sh" 270 304.65 "$DIR/ostia/analysed_sst/$DATE.nc" "$DIR/ostia/analysed_sst/$DATE.png"
echo

echo "OSTIA - sst_anomaly"
mkdir -p "$DIR/ostia/sst_anomaly"
"$DIR/download_ostia.sh" "$DATE" ANOM anom "$DIR/ostia/sst_anomaly/$DATE.nc"
"$DIR/convert_ostia_sst_anomaly.sh" -11 11 "$DIR/ostia/sst_anomaly/$DATE.nc" "$DIR/ostia/sst_anomaly/$DATE.png"
echo

echo "OSTIA - sea_ice_fraction"
mkdir -p "$DIR/ostia/sea_ice_fraction"
"$DIR/download_ostia.sh" "$DATE" SST "" "$DIR/ostia/sea_ice_fraction/$DATE.nc"
"$DIR/convert_ostia_sea_ice_fraction.sh" 0 1 "$DIR/ostia/sea_ice_fraction/$DATE.nc" "$DIR/ostia/sea_ice_fraction/$DATE.png"
echo