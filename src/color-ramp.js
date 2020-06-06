/**
 * @param {(i: number) => (string | [number, number, number])} colorFunction
 * @param {number} count
 * @return {[number, number, number, number][]}
 */
export function colorRamp(colorFunction, count = 256) {
    const alpha = 255;
    const colors = new Array(count).fill(undefined).map((_, i) => {
        const color = colorFunction(i / (count - 1));
        if (typeof color === 'string') {
            let match;
            match = color.match(/^rgb\((\d+), *(\d+), *(\d+)\)$/);
            if (match) {
                return /** @type [number, number, number, number] */ ([parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10), alpha]);
            }
            match = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/);
            if (match) {
                return /** @type [number, number, number, number] */ ([parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16), alpha]);
            }
            throw new Error();
        } else if (Array.isArray(color)) {
            return /** @type [number, number, number, number] */ ([color[0], color[1], color[2], alpha]);
        } else {
            throw new Error();
        }
    });
    return colors;
}