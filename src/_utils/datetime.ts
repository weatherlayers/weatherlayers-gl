export function interpolateDatetime(start: string, end: string | null, ratio: number): string {
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

export function getDatetimeWeight(start: string, end: string | null, middle: string): number {
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

export function getClosestStartDatetime(datetimes: string[], datetime: string): string | undefined {
  const closestDatetime = [...datetimes].reverse().find(x => x <= datetime);
  return closestDatetime;
}

export function getClosestEndDatetime(datetimes: string[], datetime: string): string | undefined {
  const closestDatetime = datetimes.find(x => x >= datetime);
  return closestDatetime;
}