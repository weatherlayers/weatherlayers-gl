import { createProgram, createTexture, createBuffer, bindAttribute, bindTexture } from './webgl-common.js';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} metadata
 * @param {HTMLImageElement} image
 */
export function weather(canvas, metadata, image) {
    const gl = /** @type WebGLRenderingContext */ (canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false }));

    const vertexShaderSource = `
        attribute vec2 a_position;
        uniform mat3 u_matrix;
        varying vec2 v_texCoord;

        void main() {
            gl_Position = vec4(u_matrix * vec3(a_position, 1), 1);
            v_texCoord = a_position;
        }
    `;

    const fragmentShaderSource = `
        precision highp float;

        #define M_PI 3.1415926535897932384626433832795
        #define SHOW_GRID false
        #define GRID_SIZE 8.0
        #define MIN ${metadata.min}
        #define MAX ${metadata.max}
        #define DELTA ${metadata.max - metadata.min}

        uniform sampler2D image;
        varying vec2 v_texCoord;

        vec4 sinebowColor(float hue, float a) {
            // Map hue [0, 1] to radians [0, 5/6τ]. Don't allow a full rotation because that keeps hue == 0 and
            // hue == 1 from mapping to the same color.
            float rad = hue * 2.0 * M_PI * 5.0 / 6.0;
            rad *= 0.75;  // increase frequency to 2/3 cycle per rad
    
            float s = sin(rad);
            float c = cos(rad);
            float r = max(0.0, -c);
            float g = max(s, 0.0);
            float b = max(max(c, 0.0), -s);
            return vec4(r, g, b, a);
        }

        vec4 interpolateColor(vec4 start, vec4 end, float i, float a) {
            return vec4(
                start.r + i * (end.r - start.r),
                start.g + i * (end.g - start.g),
                start.b + i * (end.b - start.b),
                a
            );
        }

        vec4 fadeToWhite(float i, float a) {
            return interpolateColor(sinebowColor(1.0, 0.0), vec4(1.0, 1.0, 1.0, 1.0), i, a);
        }
    
        vec4 extendedSinebowColor(float i, float a) {
            float BOUNDARY = 0.45;
            return i <= BOUNDARY ?
                sinebowColor(i / BOUNDARY, a) :
                fadeToWhite((i - BOUNDARY) / (1.0 - BOUNDARY), a);
        }

        vec4 windColor(float speed) {
            return extendedSinebowColor(min(speed, 100.0) / 100.0, 0.4);
        }
        
        void main() {
            if (SHOW_GRID) {
                if (fract((gl_FragCoord.x - 0.5) / GRID_SIZE) < 0.00001 && fract((gl_FragCoord.y - 0.5) / GRID_SIZE) < 0.00001) {
                    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
                    return;
                }
            }

            vec2 textureVector = texture2D(image, v_texCoord).rg;
            vec2 speedVector = MIN + textureVector * DELTA;
            float speed = length(speedVector);
            vec4 color = windColor(speed);
            gl_FragColor = color;
        }
    `;

    // quad = 2 triangles, 4 triangle strip vertices (top left, bottom left, top right, bottom right)
    const position = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const positionBuffer = createBuffer(gl, new Float32Array(position.flat()));
    
    // convert dst pixel coords to clipspace coords
    // https://stackoverflow.com/questions/12250953/drawing-an-image-using-webgl
    const dstX = 0;
    const dstY = 0;
    const dstWidth = 1440;
    const dstHeight = 720;
    const clipX = dstX / gl.canvas.width  *  2 - 1;
    const clipY = dstY / gl.canvas.height * -2 + 1;
    const clipWidth = dstWidth  / gl.canvas.width  *  2;
    const clipHeight = dstHeight / gl.canvas.height * -2;
    const matrix = [
        clipWidth, 0, 0,
        0, clipHeight, 0,
        clipX, clipY, 1,
    ];

    const texture = createTexture(gl, image);

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    gl.useProgram(program.program);
    bindAttribute(gl, positionBuffer, program.attributes['a_position'], position[0].length);
    bindTexture(gl, texture, 0);
    gl.uniformMatrix3fv(program.uniforms['u_matrix'], false, matrix);
    gl.uniform1i(program.uniforms['image'], 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, position.length);
}
