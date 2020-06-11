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

# download GFS file
if [ ! -f "${LAYER_FILENAME_PREFIX}.grib" ]; then
    curl "${URL}" -o "${LAYER_FILENAME_PREFIX}.grib"
fi

# map longitude from 0..360 to -180..180
gdalwarp \
    --config CENTER_LONG 0 \
    "${LAYER_FILENAME_PREFIX}.grib" \
    "${LAYER_FILENAME_PREFIX}.tif"

# transform into PNG image texture
# map values from -128..127 float to 0..255 uint8
# R channel - band 1 (u wind vector)
# G channel - band 2 (v wind vector)
# B channel - empty
gdal_translate \
    -ot Byte \
    -b 1 -b 2 -b 2 \
    -scale_1 -128 127 0 255 \
    -scale_2 -128 127 0 255 \
    -scale_3 -128 127 0 0 \
    "${LAYER_FILENAME_PREFIX}.tif" \
    "${LAYER_FILENAME_PREFIX}.png"

# rm -f 1.tif 2.tif 3.tif 4.tif 5.vrt
# gdal_calc.py --calc='((A + 128) % 1) * 255' -A "${LAYER_FILENAME_PREFIX}.tif" --A_band=1 --outfile 1.tif
# gdal_calc.py --calc='((A + 128) % 1) * 255' -A "${LAYER_FILENAME_PREFIX}.tif" --A_band=2 --outfile 2.tif
# gdal_calc.py --calc='(floor(A + 128) / 255) * 255' -A "${LAYER_FILENAME_PREFIX}.tif" --A_band=1 --outfile 3.tif
# gdal_calc.py --calc='(floor(A + 128) / 255) * 255' -A "${LAYER_FILENAME_PREFIX}.tif" --A_band=2 --outfile 4.tif
# gdalbuildvrt -separate 5.vrt 1.tif 2.tif 3.tif 4.tif
# gdal_translate -ot Byte 5.vrt "${LAYER_FILENAME_PREFIX}.2.png"

# Maidstone, no wind
# LAT="51.270798"
# LNG="0.520587"
# gdallocationinfo -wgs84 -valonly "${LAYER_FILENAME_PREFIX}.tif" "$LNG" "$LAT"
# gdallocationinfo -wgs84 -valonly "${LAYER_FILENAME_PREFIX}.png" "$LNG" "$LAT" | head -2 | xargs -I{} echo "scale=14; ({}/255)*255-128" | bc
# gdallocationinfo -wgs84 -valonly "${LAYER_FILENAME_PREFIX}.2.png" "$LNG" "$LAT"