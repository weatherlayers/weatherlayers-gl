/**
 * @param {(i: number, a?: number) => (string | [number, number, number, number])} colorFunction
 * @param {number} count
 * @return {[number, number, number, number][]}
 */
export function colorRamp(colorFunction, count = 256) {
    const a = 255;
    const colors = new Array(count).fill(undefined).map((_, i) => {
        const color = colorFunction(i / (count - 1), a);
        if (typeof color === 'string') {
            const match = color.match(/^rgb\((\d+), *(\d+), *(\d+)\)$/);
            if (match) {
                return /** @type [number, number, number, number] */ ([parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10), a]);
            } else {
                throw new Error();
            }
        } else if (Array.isArray(color)) {
            return color;
        } else {
            throw new Error();
        }
    });
    return colors;
}