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
 * @param {Record<string, any>?} var2
 * @return {{ metadata: Record<string, any>; texture: PNG; }}
*/
function gribToTexture(var1, var2) {
    /**
     * @param {number} date
     * @param {number} time
     * @return {string}
    */
    function gfsDateTimeToIsoString(date, time) {
        const dateString = `${date}`;
        return `${dateString.substr(0, 4)}-${dateString.substr(4, 2)}-${dateString.substr(6, 2)}T${time < 10 ? '0' + time : time}:00Z`;
    }

    const width = var1.Ni;
    const height = var1.Nj - 1;

    const metadata = {
        source: 'https://nomads.ncep.noaa.gov',
        date: gfsDateTimeToIsoString(var1.dataDate, var1.dataTime),
        width: width,
        height: height,
        var1Min: var1.minimum,
        var1Max: var1.maximum,
        var2Min: var2 ? var2.minimum : undefined,
        var2Max: var2 ? var2.maximum : undefined
    };
    
    const texture = new PNG({
        colorType: 2,
        filterType: 4,
        width: width,
        height: height
    });
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const k = y * width + (x + width * 7 / 12) % width; // wrap at 210 meridian, same as earth.nullschool.net
            texture.data[i + 0] = Math.floor(255 * (var1.values[k] - var1.minimum) / (var1.maximum - var1.minimum));
            texture.data[i + 1] = var2 ? Math.floor(255 * (var2.values[k] - var2.minimum) / (var2.maximum - var2.minimum)) : 0;
            texture.data[i + 2] = 0;
            texture.data[i + 3] = 255;
        }
    }

    return { metadata, texture };
}

const gribFilename = process.argv[2];
const layerFilenamePrefix = process.argv[3];
const metadataFilename = `${layerFilenamePrefix}.json`;
const textureFilename = `${layerFilenamePrefix}.png`;

const gribMessages = parseGrib(JSON.parse(fs.readFileSync(gribFilename, { encoding: 'utf8' })));

// parameter codes at https://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/grib2_table4-2.shtml
const ugrd = /** @type {Record<string, any>} */ (gribMessages.find(x => x.parameterCategory === 2 && x.parameterNumber === 2));
const vgrd = /** @type {Record<string, any>} */ (gribMessages.find(x => x.parameterCategory === 2 && x.parameterNumber === 3));

const { metadata, texture } = gribToTexture(ugrd, vgrd);

fs.writeFileSync(metadataFilename, JSON.stringify(metadata, null, 4) + '\n');
texture.pack().pipe(fs.createWriteStream(textureFilename));
