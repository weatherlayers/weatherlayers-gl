import { createProgram, createTexture, createBuffer, bindAttribute, bindTexture } from './webgl-common.js';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} metadata
 * @param {HTMLImageElement} image
 */
export function weather(canvas, metadata, image) {
    const gl = /** @type WebGLRenderingContext */ (canvas.getContext('webgl'));

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

        #define PI 3.1415926535897932384626433832795
        #define VAR1_MIN ${metadata.var1Min}
        #define VAR1_MAX ${metadata.var1Max}
        #define VAR2_MIN ${metadata.var2Min}
        #define VAR2_MAX ${metadata.var2Max}

        uniform sampler2D image;
        varying vec2 v_texCoord;

        float square(float x) {
            return x * x;
        }

        vec3 interpolateSinebow(float t) {
            t = t - 0.2;
            return vec3(
              square(sin(PI * (t + 0.0 / 3.0))),
              square(sin(PI * (t + 1.0 / 3.0))),
              square(sin(PI * (t + 2.0 / 3.0)))
            );
          }
        
        void main() {
            vec4 vector = texture2D(image, v_texCoord);
            float var1 = VAR1_MIN + vector.x * (VAR1_MAX - VAR1_MIN);
            float var2 = VAR2_MIN + vector.x * (VAR2_MAX - VAR2_MIN);
            float length = sqrt(square(var1) + square(var2));
            vec3 color = interpolateSinebow(min(length, 100.0) / 100.0);
            gl_FragColor = vec4(color, 1);
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
