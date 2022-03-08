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