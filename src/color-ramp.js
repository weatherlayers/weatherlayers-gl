import rgba from 'color-rgba';

/**
 * @param {(i: number) => (string | [number, number, number])} colorFunction
 * @param {number} count
 * @return {[number, number, number, number][]}
 */
export function colorRamp(colorFunction, count = 256) {
    const colors = new Array(count).fill(undefined).map((_, i) => {
        const color = rgba(colorFunction(i / (count - 1)));
        if (!color) {
            return /** @type [number, number, number, number] */ ([255, 255, 255, 255]);
        }
        return /** @type [number, number, number, number] */ ([color[0], color[1], color[2], color[3] !== undefined ? color[3] * 256 : 255]);
    });
    
    return colors;
}