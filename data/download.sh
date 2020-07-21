#!/bin/bash

# download and convert all supported data
#
# params
# - date - YYYYMMDD
# - time - HH
# - forecast - NNN
#
# required credentials
# OSCAR
# - env variables PODAAC_USERNAME, PODAAC_PASSWORD
# - sign up at Earthdata https://urs.earthdata.nasa.gov/users/new
# - get credentials at PODAAC https://podaac-tools.jpl.nasa.gov/drive/
# OSTIA
# - env variables CMEMS_USERNAME, CMEMS_PASSWORD
# - sign up at CMEMS https://marine.copernicus.eu/services-portfolio/register-now/

set -eu

DIR="$(dirname "$0")"

DATE="${1:-$(date "+%Y%m%d")}" # YYYYMMDD
TIME="$((10#${2:-$(date "+%H")}))" # HH
FORECAST="$((10#${3:-0}))"
HEIGHT="0"

DATETIME="$("$DIR/datetime_forecast.sh" "$DATE$TIME" "$FORECAST")" 
YEAR="$("$DIR/date_format.sh" "${DATETIME:0:8}" "%Y")"
MONTH="$("$DIR/date_format.sh" "${DATETIME:0:8}" "%m")"
DAY="$("$DIR/date_format.sh" "${DATETIME:0:8}" "%d")"
# HOUR="${DATETIME:8:2}"

echo "GFS"
if [ "$(($TIME % 6))" -eq 0 ]; then
    GFS_FILE="$DIR/gfs/$DATETIME.grib"
    if [ ! -f "$GFS_FILE" ]; then
        "$DIR/download_gfs.sh" "$DATE" "$TIME" "$FORECAST" "$GFS_FILE" || true
    fi

    if [ -f "$GFS_FILE" ]; then
        echo "GFS - wind"
            mkdir -p "$DIR/gfs/wind/$HEIGHT/$YEAR/$MONTH/$DAY"
            "$DIR/convert_gfs_wind.sh" UGRD VGRD 10-HTGL 0 100 -128 127 "$GFS_FILE" "$DIR/gfs/wind/$HEIGHT/$YEAR/$MONTH/$DAY/$DATETIME.png" || true
        echo

        echo "GFS - TMP"
            mkdir -p "$DIR/gfs/tmp/$HEIGHT/$YEAR/$MONTH/$DAY"
            "$DIR/convert_gfs.sh" TMP 2-HTGL 193 328 "$GFS_FILE" "$DIR/gfs/tmp/$HEIGHT/$YEAR/$MONTH/$DAY/$DATETIME.png" || true
        echo

        echo "GFS - RH"
            mkdir -p "$DIR/gfs/rh/$HEIGHT/$YEAR/$MONTH/$DAY"
            "$DIR/convert_gfs.sh" RH 2-HTGL 0 100 "$GFS_FILE" "$DIR/gfs/rh/$HEIGHT/$YEAR/$MONTH/$DAY/$DATETIME.png" || true
        echo

        echo "GFS - APCP"
            # normalize APCP data
            # 
            # GFS files contain APCP variables in buckets by 6 hours
            # see http://gradsusr.org/pipermail/gradsusr/2016-May/039759.html
            # see https://www.ftp.cpc.ncep.noaa.gov/wd51we/wgrib2/tricks.wgrib2 - item 22
            #
            # f000 - no data
            # f003 - APCP03, 0-3 hour
            # f006 - APCP06, 0-6 hour
            # f009 - APCP03, 6-9 hour
            # f012 - APCP06, 6-12 hour
            # f015 - APCP03, 12-15 hour
            #
            # normalizing uses either 1, 2, or 3 files
            # 0-3 hour - use f003 APCP03
            # 1-4 hour - calculate f004 APCP04 - f001 APCP01
            # 4-7 hour - calculate (f006 APCP06 - f004 APCP04) + f007 APCP01

            apcp_var() {
                echo -n "APCP$(printf "%02d" "$((($1 - 1) % 6 + 1))")"
            }

            FORECAST_GFS_APCP_END_OFFSET="3" # 1-6
            FORECAST_GFS_APCP_END="$(($FORECAST + $FORECAST_GFS_APCP_END_OFFSET))"
            GFS_APCP_END_FILE="$DIR/gfs/$DATETIME.apcp.end.grib"
            if [ ! -f "$GFS_APCP_END_FILE" ]; then
                "$DIR/download_gfs_filter.sh" "$DATE" "$TIME" "$FORECAST_GFS_APCP_END" APCP surface "$GFS_APCP_END_FILE" || true
            fi
            
            if [ -f "$GFS_APCP_END_FILE" ]; then
                if [ "$(($FORECAST % 6))" -gt "0" ]; then
                    if [ "$(($FORECAST_GFS_APCP_END % 6))" -gt "0" -a "$(($FORECAST_GFS_APCP_END % 6))" -lt "$(($FORECAST % 6))" ]; then
                        FORECAST_GFS_APCP_MIDDLE="$(($FORECAST_GFS_APCP_END / 6 * 6))"
                        GFS_APCP_MIDDLE_FILE="$DIR/gfs/$DATETIME.apcp.middle.grib"
                        if [ ! -f "$GFS_APCP_MIDDLE_FILE" ]; then
                            "$DIR/download_gfs_filter.sh" "$DATE" "$TIME" "$FORECAST_GFS_APCP_MIDDLE" APCP surface "$GFS_APCP_MIDDLE_FILE" || true
                        fi

                        if [ -f "$GFS_APCP_MIDDLE_FILE" ]; then
                            # 3 input files (start, middle, end)
                            mkdir -p "$DIR/gfs/apcp/$HEIGHT/$YEAR/$MONTH/$DAY"
                            "$DIR/convert_gfs_apcp_diff2.sh" "$(apcp_var "$FORECAST")" "$(apcp_var "$FORECAST_GFS_APCP_MIDDLE")" "$(apcp_var "$FORECAST_GFS_APCP_END")" 0-SFC 0 150 "$GFS_FILE" "$GFS_APCP_MIDDLE_FILE" "$GFS_APCP_END_FILE" "$DIR/gfs/apcp/$HEIGHT/$YEAR/$MONTH/$DAY/$DATETIME.png" || true
                        else
                            echo "ERROR: $GFS_APCP_MIDDLE_FILE file not found"
                        fi
                    else
                        # 2 input files (start, end)
                        mkdir -p "$DIR/gfs/apcp/$HEIGHT/$YEAR/$MONTH/$DAY"
                        "$DIR/convert_gfs_apcp_diff.sh" "$(apcp_var "$FORECAST")" "$(apcp_var "$FORECAST_GFS_APCP_END")" 0-SFC 0 150 "$GFS_FILE" "$GFS_APCP_END_FILE" "$DIR/gfs/apcp/$HEIGHT/$YEAR/$MONTH/$DAY/$DATETIME.png" || true
                    fi
                else
                    # 1 input file (end)
                    mkdir -p "$DIR/gfs/apcp/$HEIGHT/$YEAR/$MONTH/$DAY"
                    "$DIR/convert_gfs.sh" "$(apcp_var "$FORECAST_GFS_APCP_END")" 0-SFC 0 150 "$GFS_APCP_END_FILE" "$DIR/gfs/apcp/$HEIGHT/$YEAR/$MONTH/$DAY/$DATETIME.png" || true
                fi
            else
                echo "ERROR: $GFS_APCP_END_FILE file not found"
            fi
        echo

        echo "GFS - CAPE"
            mkdir -p "$DIR/gfs/cape/$HEIGHT/$YEAR/$MONTH/$DAY"
            "$DIR/convert_gfs.sh" CAPE 0-SFC 0 5000 "$GFS_FILE" "$DIR/gfs/cape/$HEIGHT/$YEAR/$MONTH/$DAY/$DATETIME.png" || true
        echo

        echo "GFS - PWAT"
            mkdir -p "$DIR/gfs/pwat/$HEIGHT/$YEAR/$MONTH/$DAY"
            "$DIR/convert_gfs.sh" PWAT 0-EATM 0 70 "$GFS_FILE" "$DIR/gfs/pwat/$HEIGHT/$YEAR/$MONTH/$DAY/$DATETIME.png" || true
        echo

        echo "GFS - CWAT"
            mkdir -p "$DIR/gfs/cwat/$HEIGHT/$YEAR/$MONTH/$DAY"
            "$DIR/convert_gfs.sh" CWAT 0-EATM 0 1 "$GFS_FILE" "$DIR/gfs/cwat/$HEIGHT/$YEAR/$MONTH/$DAY/$DATETIME.png" || true
        echo

        echo "GFS - PRMSL"
            mkdir -p "$DIR/gfs/prmsl/$HEIGHT/$YEAR/$MONTH/$DAY"
            "$DIR/convert_gfs.sh" PRMSL 0-MSL 92000 105000 "$GFS_FILE" "$DIR/gfs/prmsl/$HEIGHT/$YEAR/$MONTH/$DAY/$DATETIME.png" || true
        echo

        echo "GFS - APTMP"
            mkdir -p "$DIR/gfs/aptmp/$HEIGHT/$YEAR/$MONTH/$DAY"
            "$DIR/convert_gfs.sh" APTMP 2-HTGL 236 332 "$GFS_FILE" "$DIR/gfs/aptmp/$HEIGHT/$YEAR/$MONTH/$DAY/$DATETIME.png" || true
        echo
    else
        echo "ERROR: $GFS_FILE file not found"
    fi
else
    echo "skipped"
fi
echo

# TODO: date filter?
echo "OSCAR"
if [ "$TIME" -eq 12 -a "$FORECAST" -eq 0 ]; then
    OSCAR_FILE="$DIR/oscar/$DATE.nc"
    if [ ! -f "$OSCAR_FILE" ]; then
        "$DIR/download_oscar.sh" "$DATE" "$OSCAR_FILE" || true
    fi

    if [ -f "$OSCAR_FILE" ]; then
        echo "OSCAR - currents"
            mkdir -p "$DIR/oscar/currents/$HEIGHT/$YEAR/$MONTH/$DAY"
            "$DIR/convert_oscar.sh" 0 1.5 -1 1 "$OSCAR_FILE" "$DIR/oscar/currents/$HEIGHT/$YEAR/$MONTH/$DAY/$DATE.png" || true
        echo
    else
        echo "ERROR: $OSCAR_FILE file not found"
    fi
else
    echo "skipped"
fi
echo

echo "OSTIA"
if [ "$TIME" -eq 12 -a "$FORECAST" -eq 0 ]; then
    OSTIA_SST_FILE="$DIR/ostia/$DATE.sst.nc"
    if [ ! -f "$OSTIA_SST_FILE" ]; then
        "$DIR/download_ostia_sst.sh" "$DATE" "$OSTIA_SST_FILE" || true
    fi

    if [ -f "$OSTIA_SST_FILE" ]; then
        echo "OSTIA - analysed_sst"
            mkdir -p "$DIR/ostia/analysed_sst/$HEIGHT/$YEAR/$MONTH/$DAY"
            "$DIR/convert_ostia_analysed_sst.sh" analysed_sst 270 304.65 "$OSTIA_SST_FILE" "$DIR/ostia/analysed_sst/$HEIGHT/$YEAR/$MONTH/$DAY/$DATE.png" || true
        echo

        echo "OSTIA - sea_ice_fraction"
            mkdir -p "$DIR/ostia/sea_ice_fraction/$HEIGHT/$YEAR/$MONTH/$DAY"
            "$DIR/convert_ostia_sea_ice_fraction.sh" sea_ice_fraction 0 1 "$OSTIA_SST_FILE" "$DIR/ostia/sea_ice_fraction/$HEIGHT/$YEAR/$MONTH/$DAY/$DATE.png" || true
        echo
    else
        echo "ERROR: $OSTIA_SST_FILE file not found"
    fi

    OSTIA_ANOM_FILE="$DIR/ostia/$DATE.anom.nc"
    if [ ! -f "$OSTIA_ANOM_FILE" ]; then
        "$DIR/download_ostia_anom.sh" "$DATE" "$OSTIA_ANOM_FILE" || true
    fi

    if [ -f "$OSTIA_ANOM_FILE" ]; then
        echo "OSTIA - sst_anomaly"
            mkdir -p "$DIR/ostia/sst_anomaly/$HEIGHT/$YEAR/$MONTH/$DAY"
            "$DIR/convert_ostia_sst_anomaly.sh" sst_anomaly -11 11 "$OSTIA_ANOM_FILE" "$DIR/ostia/sst_anomaly/$HEIGHT/$YEAR/$MONTH/$DAY/$DATE.png" || true
        echo
    else
        echo "ERROR: $OSTIA_ANOM_FILE file not found"
    fi
else
    echo "skipped"
fi
echo

# TODO: extract forecast band?
echo "WAVEWATCH"
if [ "$(($TIME % 6))" -eq 0 -a "$FORECAST" -eq 0 ]; then
    WAVEWATCH_FILE="$DIR/wavewatch/$DATETIME.grib"
    if [ ! -f "$WAVEWATCH_FILE" ]; then
        "$DIR/download_wavewatch.sh" "$DATE" "$TIME" "$WAVEWATCH_FILE" || true
    fi

    if [ -f "$WAVEWATCH_FILE" ]; then
        echo "WAVEWATCH - waves"
            mkdir -p "$DIR/wavewatch/waves/$HEIGHT/$YEAR/$MONTH/$DAY"
            "$DIR/convert_wavewatch_waves.sh" PERPW DIRPW 0 25 -20 20 "$WAVEWATCH_FILE" "$DIR/wavewatch/waves/$HEIGHT/$YEAR/$MONTH/$DAY/$DATETIME.png" || true
        echo

        echo "WAVEWATCH - HTSGW"
            mkdir -p "$DIR/wavewatch/htsgw/$HEIGHT/$YEAR/$MONTH/$DAY"
            "$DIR/convert_wavewatch.sh" HTSGW 0 15 "$WAVEWATCH_FILE" "$DIR/wavewatch/htsgw/$HEIGHT/$YEAR/$MONTH/$DAY/$DATETIME.png" || true
        echo
    else
        echo "ERROR: $WAVEWATCH_FILE file not found"
    fi
else
    echo "skipped"
fi
echo