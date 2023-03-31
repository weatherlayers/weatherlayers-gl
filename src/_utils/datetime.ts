export type DatetimeISOString = string;

export type DatetimeFormatFunction = (value: DatetimeISOString) => DatetimeISOString;

export function interpolateDatetime(start: DatetimeISOString, end: DatetimeISOString | null, ratio: number): string {
  if (!end) {
    if (ratio === 0) {
      return start;
    } else {
      throw new Error('Invalid state');
    }
  }

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

export function getDatetimeWeight(start: DatetimeISOString, end: DatetimeISOString | null, middle: string): number {
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