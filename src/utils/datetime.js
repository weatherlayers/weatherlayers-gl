/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/**
 * @param {string} value
 * @returns {string}
 */
export function formatDatetime(value) {
  if (!value) {
    return value;
  }

  const date = new Date(value);
  if (!date.getDate()) {
    return value;
  }

  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  const hour = `${date.getUTCHours()}`.padStart(2, '0');
  const minute = `${date.getUTCMinutes()}`.padStart(2, '0');
  const formattedValue = `${year}/${month}/${day} ${hour}:${minute} UTC`;
  return formattedValue;
}

/**
 * @param {string} start
 * @param {string} end
 * @param {number} ratio
 * @returns {string}
 */
export function interpolateDatetime(start, end, ratio) {
  if (ratio <= 0) {
    return start;
  } else if (ratio >= 1) {
    return end;
  } else {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const date = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) * ratio);
    return date.toISOString();
  }
}

/**
 * @param {string} start
 * @param {string} end
 * @param {string} middle
 * @returns {number}
 */
export function getDatetimeWeight(start, end, middle) {
  if (middle <= start) {
    return 0;
  } else if (middle >= end) {
    return 1;
  } else {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const middleDate = new Date(middle);
    const ratio = (middleDate.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime());
    return ratio;
  }
}

/**
 * @param {string[]} datetimes
 * @param {string} datetime
 * @returns {string | undefined}
 */
export function getClosestStartDatetime(datetimes, datetime) {
  const closestDatetime = [...datetimes].reverse().find(x => x <= datetime);
  return closestDatetime;
}

/**
 * @param {string[]} datetimes
 * @param {string} datetime
 * @returns {string | undefined}
 */
export function getClosestEndDatetime(datetimes, datetime) {
  const closestDatetime = datetimes.find(x => x >= datetime);
  return closestDatetime;
}