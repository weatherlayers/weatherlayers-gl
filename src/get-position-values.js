/**
 * @param {number} x
 * @param {number} y
 * @param {number} a
 * @return {number}
 */
function mix(x, y, a) {
    return x * (1 - a) + y * a;
}

/**
 * @param {Float32Array} x
 * @param {Float32Array} y
 * @param {number} a
 * @return {Float32Array}
 */
function mixArray(x, y, a) {
    const array = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) {
        array[i] = mix(x[i], y[i], a);
    }
    return array;
}

/**
 * manual bilinear filtering based on 4 adjacent pixels for smooth interpolation
 * see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
 * @param {{ data: Float32Array, width: number, height: number, numDimensions: number }} data
 * @param {[number, number]} position
 * @return {Float32Array}
 */
function texture2DBilinear(data, position) {
    const floorPosition = [Math.floor(position[0] * data.width), Math.floor(position[1] * data.height)];
    const fractPosition = [(position[0] * data.width) % 1, (position[1] * data.height) % 1];

    const topLeftIndex = (floorPosition[0] + floorPosition[1] * data.width) * data.numDimensions;
    const topRightIndex = (floorPosition[0] + (floorPosition[1] + 1) * data.width) * data.numDimensions;
    const bottomLeftIndex = ((floorPosition[0] + 1) + floorPosition[1] * data.width) * data.numDimensions;
    const bottomRightIndex = ((floorPosition[0] + 1) + (floorPosition[1] + 1) * data.width) * data.numDimensions;

    const topLeft = data.data.slice(topLeftIndex, topLeftIndex + data.numDimensions);
    const topRight = data.data.slice(topRightIndex, topRightIndex + data.numDimensions);
    const bottomLeft = data.data.slice(bottomLeftIndex, bottomLeftIndex + data.numDimensions);
    const bottomRight = data.data.slice(bottomRightIndex, bottomRightIndex + data.numDimensions);

    const values = mixArray(mixArray(topLeft, topRight, fractPosition[0]), mixArray(bottomLeft, bottomRight, fractPosition[0]), fractPosition[1]);

    return values;
}

/**
 * @param {{ data: Float32Array, width: number, height: number, numDimensions: number }} data
 * @param {[number, number]} position
 * @return {Float32Array}
 */
export function getPositionValues(data, position) {
    /** @type [number, number] */
    const wrappedPosition = [(position[0] + 1) % 1, position[1]];

    const values = texture2DBilinear(data, wrappedPosition);

    return values;
}