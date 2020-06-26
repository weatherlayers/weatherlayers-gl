#!/bin/bash

set -eu

DIR="$(dirname $0)"

download_gfs() {
    RESOLUTION="0p25" # 0p25, 0p50, 1p00
    DATE="$1" # YYYYMMDD
    TIME="$2" # 00, 06, 12, 18
    OFFSET="$(printf "%03d" $3)" # 3-hourly up to 10 days, 12-hourly up to 16 days
    VARIABLES="$(echo -n "$4" | awk 'BEGIN { RS=","; OFS="" } { print "var_", $1, "=on" }' | paste -d'&' -s -)"
    LEVEL="lev_$5=on"
    BBOX="leftlon=0&rightlon=360&toplat=90&bottomlat=-90"
    URL="https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_${RESOLUTION}.pl?file=gfs.t${TIME}z.pgrb2.${RESOLUTION}.f${OFFSET}&${VARIABLES}&${LEVEL}&${BBOX}&dir=%2Fgfs.${DATE}%2F${TIME}"
    OUTPUT_FILE="$6"

    if [ ! -f "$OUTPUT_FILE" ]; then
        curl "$URL" -o "$OUTPUT_FILE"
    fi
}

convert_gfs() {
    VALUE_MIN="$1"
    VALUE_MAX="$2"
    INPUT_FILE="$3"
    OUTPUT_FILE="$4"
    TMP_FILE="$(mktemp).tif"

    # map longitude from 0..360 to -180..180
    gdalwarp \
        -te -180 -90 180 90 \
        --config GRIB_NORMALIZE_UNITS NO \
        "$INPUT_FILE" \
        "$TMP_FILE"

    # transform into PNG image texture
    # map values to 0..255 uint8
    gdal_translate \
        -ot Byte \
        -b 1 \
        -scale "$VALUE_MIN" "$VALUE_MAX" \
        "$TMP_FILE" \
        "$OUTPUT_FILE"

    rm "$TMP_FILE"
}

convert_gfs_wind() {
    VALUE_MIN="$1"
    VALUE_MAX="$2"
    VECTOR_MIN="$3"
    VECTOR_MAX="$4"
    INPUT_FILE="$5"
    OUTPUT_FILE="$6"
    TMP_FILE="$(mktemp).tif"
    LENGTH_TMP_FILE="$(mktemp).tif"
    U_TMP_FILE="$(mktemp).tif"
    V_TMP_FILE="$(mktemp).tif"
    MERGED_TMP_FILE="$(mktemp).vrt"

    # map longitude from 0..360 to -180..180
    gdalwarp \
        -te -180 -90 180 90 \
        "$INPUT_FILE" \
        "$TMP_FILE"

    # calculate length
    gdal_calc.py --calc='sqrt(A * A + B * B)' -A "$TMP_FILE" --A_band=1 -B "$TMP_FILE" --B_band=2 --outfile "$LENGTH_TMP_FILE"
    gdalbuildvrt -b 1 "$U_TMP_FILE" "$TMP_FILE"
    gdalbuildvrt -b 2 "$V_TMP_FILE" "$TMP_FILE"
    gdalbuildvrt -separate "$MERGED_TMP_FILE" "$LENGTH_TMP_FILE" "$U_TMP_FILE" "$V_TMP_FILE"

    # transform into PNG image texture
    # map values to 0..255 uint8
    gdal_translate \
        -ot Byte \
        -b 1 -b 2 -b 3 \
        -scale_1 "$VALUE_MIN" "$VALUE_MAX" \
        -scale_2 "$VECTOR_MIN" "$VECTOR_MAX" \
        -scale_3 "$VECTOR_MIN" "$VECTOR_MAX" \
        "$MERGED_TMP_FILE" \
        "$OUTPUT_FILE"

    rm "$TMP_FILE"
    rm "$LENGTH_TMP_FILE"
    rm "$U_TMP_FILE"
    rm "$V_TMP_FILE"
    rm "$MERGED_TMP_FILE"
}

convert_gfs_apcp() {
    VALUE_MIN="$1"
    VALUE_MAX="$2"
    INPUT_FILE1="$3"
    INPUT_FILE2="$4"
    OUTPUT_FILE="$5"
    TMP_FILE1="$(mktemp).tif"
    TMP_FILE2="$(mktemp).tif"
    DIFF_TMP_FILE="$(mktemp).tif"

    # map longitude from 0..360 to -180..180
    gdalwarp \
        -te -180 -90 180 90 \
        --config GRIB_NORMALIZE_UNITS NO \
        "$INPUT_FILE1" \
        "$TMP_FILE1"
    gdalwarp \
        -te -180 -90 180 90 \
        --config GRIB_NORMALIZE_UNITS NO \
        "$INPUT_FILE2" \
        "$TMP_FILE2"

    # calculate difference
    gdal_calc.py --calc='B - A' -A "$TMP_FILE1" --A_band=1 -B "$TMP_FILE2" --B_band=1 --outfile "$DIFF_TMP_FILE"

    # transform into PNG image texture
    # map values to 0..255 uint8
    gdal_translate \
        -ot Byte \
        -b 1 \
        -scale "$VALUE_MIN" "$VALUE_MAX" \
        "$DIFF_TMP_FILE" \
        "$OUTPUT_FILE"

    rm "$TMP_FILE1"
    rm "$TMP_FILE2"
    rm "$DIFF_TMP_FILE"
}

DATE="20200626" # YYYYMMDD
TIME="12" # 00, 06, 12, 18

echo WIND
mkdir -p "$DIR/gfs/wind"
download_gfs "$DATE" "$TIME" 0 UGRD,VGRD 10_m_above_ground "$DIR/gfs/wind/$DATE$TIME.f000.grib"
convert_gfs_wind 0 100 -128 127 "$DIR/gfs/wind/$DATE$TIME.f000.grib" "$DIR/gfs/wind/$DATE$TIME.f000.png"
echo

echo TMP
mkdir -p "$DIR/gfs/tmp"
download_gfs "$DATE" "$TIME" 0 TMP 2_m_above_ground "$DIR/gfs/tmp/$DATE$TIME.f000.grib"
convert_gfs 193 328 "$DIR/gfs/tmp/$DATE$TIME.f000.grib" "$DIR/gfs/tmp/$DATE$TIME.f000.png"
echo

echo RH
mkdir -p "$DIR/gfs/rh"
download_gfs "$DATE" "$TIME" 0 RH 2_m_above_ground "$DIR/gfs/rh/$DATE$TIME.f000.grib"
convert_gfs 0 100 "$DIR/gfs/rh/$DATE$TIME.f000.grib" "$DIR/gfs/rh/$DATE$TIME.f000.png"
echo

echo APCP
mkdir -p "$DIR/gfs/apcp"
download_gfs "$DATE" "$TIME" 3 APCP surface "$DIR/gfs/apcp/$DATE$TIME.f003.grib"
download_gfs "$DATE" "$TIME" 6 APCP surface "$DIR/gfs/apcp/$DATE$TIME.f006.grib"
convert_gfs_apcp 0 150 "$DIR/gfs/apcp/$DATE$TIME.f003.grib" "$DIR/gfs/apcp/$DATE$TIME.f006.grib" "$DIR/gfs/apcp/$DATE$TIME.f003.png"
echo

echo CAPE
mkdir -p "$DIR/gfs/cape"
download_gfs "$DATE" "$TIME" 0 CAPE surface "$DIR/gfs/cape/$DATE$TIME.f000.grib"
convert_gfs 0 5000 "$DIR/gfs/cape/$DATE$TIME.f000.grib" "$DIR/gfs/cape/$DATE$TIME.f000.png"
echo

echo PWAT
mkdir -p "$DIR/gfs/pwat"
download_gfs "$DATE" "$TIME" 0 PWAT entire_atmosphere_%5C%28considered_as_a_single_layer%5C%29 "$DIR/gfs/pwat/$DATE$TIME.f000.grib"
convert_gfs 0 70 "$DIR/gfs/pwat/$DATE$TIME.f000.grib" "$DIR/gfs/pwat/$DATE$TIME.f000.png"
echo

echo CWAT
mkdir -p "$DIR/gfs/cwat"
download_gfs "$DATE" "$TIME" 0 CWAT entire_atmosphere_%5C%28considered_as_a_single_layer%5C%29 "$DIR/gfs/cwat/$DATE$TIME.f000.grib"
convert_gfs 0 1 "$DIR/gfs/cwat/$DATE$TIME.f000.grib" "$DIR/gfs/cwat/$DATE$TIME.f000.png"
echo

echo PRMSL
mkdir -p "$DIR/gfs/prmsl"
download_gfs "$DATE" "$TIME" 0 PRMSL mean_sea_level "$DIR/gfs/prmsl/$DATE$TIME.f000.grib"
convert_gfs 92000 105000 "$DIR/gfs/prmsl/$DATE$TIME.f000.grib" "$DIR/gfs/prmsl/$DATE$TIME.f000.png"
echo

echo APTMP
mkdir -p "$DIR/gfs/aptmp"
download_gfs "$DATE" "$TIME" 0 APTMP 2_m_above_ground "$DIR/gfs/aptmp/$DATE$TIME.f000.grib"
convert_gfs 236 332 "$DIR/gfs/aptmp/$DATE$TIME.f000.grib" "$DIR/gfs/aptmp/$DATE$TIME.f000.png"
echo