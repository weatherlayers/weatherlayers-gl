#!/bin/bash

set -eu

DIR="$(dirname $0)"

DATE="20200515" # YYYYMMDD
TIME="00" # 00, 06, 12, 18
OFFSET="f000" # 3-hourly up to 10 days, 12-hourly up to 16 days
RESOLUTION="0p25" # 0p25, 0p50 or 1p00
LEVEL="lev_10_m_above_ground=on"
VARIABLES="var_UGRD=on&var_VGRD=on"
BBOX="leftlon=0&rightlon=360&toplat=90&bottomlat=-90"
URL="https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_${RESOLUTION}.pl?file=gfs.t${TIME}z.pgrb2.${RESOLUTION}.${OFFSET}&${LEVEL}&${VARIABLES}&${BBOX}&dir=%2Fgfs.${DATE}%2F${TIME}"

LAYER_FILENAME_PREFIX="${DIR}/${DATE}${TIME}"
if [ ! -f "${LAYER_FILENAME_PREFIX}.grib" ]; then
    curl "${URL}" -o "${LAYER_FILENAME_PREFIX}.grib"
fi

gdalwarp \
    --config CENTER_LONG 0 \
    "${LAYER_FILENAME_PREFIX}.grib" \
    "${LAYER_FILENAME_PREFIX}.tif"
gdal_translate \
    -ot Byte \
    -b 1 -b 2 -b 2 \
    -scale_1 -128 127 0 255 \
    -scale_2 -128 127 0 255 \
    -scale_3 -128 127 0 0 \
    --config GDAL_PAM_ENABLED NO \
    "${LAYER_FILENAME_PREFIX}.tif" \
    "${LAYER_FILENAME_PREFIX}.png"
