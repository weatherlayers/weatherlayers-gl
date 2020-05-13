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

        uniform sampler2D image;
        varying vec2 v_texCoord;
        
        void main() {
            gl_FragColor = texture2D(image, v_texCoord);
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
