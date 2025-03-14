export type DatetimeISOString = string;

export type DatetimeISOStringRange = [start: DatetimeISOString, end: DatetimeISOString];

export type OpenDatetimeISOStringRange = [start: DatetimeISOString | null, end: DatetimeISOString | null];

export type DatetimeFormatFunction = (value: DatetimeISOString) => DatetimeISOString;

export type DurationISOString = string;

export function interpolateDatetime(start: DatetimeISOString, end: DatetimeISOString | null, weight: number): string {
  if (!end) {
    if (weight === 0) {
      return start;
    } else {
      throw new Error('Invalid state');
    }
  }

  if (weight <= 0) {
    return start;
  } else if (weight >= 1) {
    return end;
  } else {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const date = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) * weight);
    return date.toISOString();
  }
}

export function getDatetimeWeight(start: DatetimeISOString, end: DatetimeISOString | null, middle: DatetimeISOString): number {
  if (!end) {
    if (start === middle) {
      return 0;
    } else {
      throw new Error('Invalid state');
    }
  }

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

export function getClosestStartDatetime(datetimes: DatetimeISOString[], datetime: DatetimeISOString): DatetimeISOString | undefined {
  const closestDatetime = [...datetimes].reverse().find(x => x <= datetime);
  return closestDatetime;
}

export function getClosestEndDatetime(datetimes: DatetimeISOString[], datetime: DatetimeISOString): DatetimeISOString | undefined {
  const closestDatetime = datetimes.find(x => x >= datetime);
  return closestDatetime;
}

export function offsetDatetime(datetime: DatetimeISOString, hour: number): DatetimeISOString {
  const datetimeDate = new Date(datetime);
  const updatedDatetimeDate = new Date(datetimeDate.getTime() + hour * 1000 * 60 * 60);
  return updatedDatetimeDate.toISOString();
}

export function offsetDatetimeRange(datetime: DatetimeISOString, startHour: number, endHour: number): DatetimeISOStringRange {
  return [offsetDatetime(datetime, startHour), offsetDatetime(datetime, endHour)];
}

export function formatDatetime(value: DatetimeISOString): string {
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
  const formattedValue = `${year}/${month}/${day} ${hour}:${minute}\xa0UTC`;
  return formattedValue;
}