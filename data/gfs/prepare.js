const PNG = require('pngjs').PNG;
const fs = require('fs');

/**
 * @param {{ messages: { key: string; value: any; }[][]; }} grib
 * @return {Record<string, any>[]}
 */
function parseGrib(grib) {
    return grib.messages.map(message => Object.fromEntries(message.map(entry => [entry.key, entry.value])));
}

/**
 * @param {Record<string, any>} var1
 * @param {Record<string, any>} var2
 * @return {PNG}
*/
function gribToImage(var1, var2) {
    const width = var1.Ni;
    const height = var1.Nj - 1;
    const min = -128;
    const max = 127;
    const delta = max - min;
    
    const image = new PNG({
        colorType: 2,
        filterType: 4,
        width: width,
        height: height
    });
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const k = y * width + (x + width / 2) % width;
            image.data[i + 0] = Math.floor(255 * (var1.values[k] - min) / delta);
            image.data[i + 1] = Math.floor(255 * (var2.values[k] - min) / delta);
            image.data[i + 2] = 0;
            image.data[i + 3] = 255;
        }
    }

    return image;
}


const gribFilename = process.argv[2];
const imageFilename = process.argv[3];

const gribMessages = parseGrib(JSON.parse(fs.readFileSync(gribFilename, { encoding: 'utf8' })));

// parameter codes at https://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/grib2_table4-2.shtml
const ugrd = /** @type {Record<string, any>} */ (gribMessages.find(x => x.parameterCategory === 2 && x.parameterNumber === 2));
const vgrd = /** @type {Record<string, any>} */ (gribMessages.find(x => x.parameterCategory === 2 && x.parameterNumber === 3));

const image = gribToImage(ugrd, vgrd);

image.pack().pipe(fs.createWriteStream(imageFilename));
