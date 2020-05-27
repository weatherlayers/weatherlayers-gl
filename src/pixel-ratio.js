/**
 * @param {boolean} retina
 */
export function getPixelRatio(retina) {
    if (!retina) {
        return 1;
    }
    return Math.max(Math.floor(window.devicePixelRatio || 1), 2);
}