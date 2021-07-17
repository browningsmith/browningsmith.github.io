/**
 *               Filename: nimbus_objLibrary.js
 * 
 *                 Author: Browning Keith Smith
 *           Date Created: July 14, 2021
 *          Date Modified: July 14, 2021
 * 
 *            Description: 
 * 
 * Execution Requirements: Google Chrome. Program not currently supported in other browsers.
 *                         Browser must support HTML5 <canvas> element and WebGL context.
 * 
 *                         HTML file must include 2 instances of the <canvas> element, one with the id "canvas",
 *                         and one with the id "hud"
 * 
 *           Dependencies: gl-matrix.js https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js
 * 
 * Copyright (c) 2021, Browning Keith Smith. All rights reserved.
 */

 //Vertex Shader source code

const vertexShaderCode = `

    attribute vec4 a_vertexPosition;
    attribute vec3 a_vertexNormal;
    attribute vec4 a_vertexColor;
    
    uniform mat4 u_projectionMatrix;
    uniform mat4 u_modelViewMatrix;
    uniform mat4 u_normalMatrix;
    uniform mat4 u_worldViewMatrix;

    varying lowp vec4 v_currentColor;
    varying highp vec3 v_currentLighting;

    void main(void) {

        gl_Position = u_projectionMatrix * u_worldViewMatrix * u_modelViewMatrix * a_vertexPosition; //Compute vertex position based on model, worldview, and projection
        v_currentColor = a_vertexColor; //Color to be passed to fragment shader
        
        highp vec3 ambientLight = vec3(0.3, 0.3, 0.3); //Set ambientLight to 0.3 rgb
        highp vec3 directionalLightColor = vec3(1.0, 1.0, 1.0); //Set directional light color to white

        highp vec3 lightDirection = normalize(vec3(0.5, 1.0, 1.0)); //Set light direction vector

        highp vec4 transformedNormal = u_normalMatrix * vec4(a_vertexNormal, 1.0); //Compute new normals based on object

        highp float directional = max(dot(transformedNormal.xyz, lightDirection),0.0); //Compute directional based on transformed normal and direction of light

        v_currentLighting = ambientLight + (directionalLightColor * directional); //Compute lighting of current vertex as ambient light plus directional light times the directional
    }
`;

//Fragment Shader source code

const fragmentShaderCode = `

    varying lowp vec4 v_currentColor;
    varying lowp vec3 v_currentLighting;

    void main(void) {

        gl_FragColor = vec4(v_currentColor.rgb * v_currentLighting, 1.0); //Each fragment is the color multiplied by the light level
    }
`;

//View Matrices
const modelViewMatrix = mat4.create();
const worldViewMatrix = mat4.create();
const normalMatrix = mat4.create();

//Projection matrix
const projectionMatrix = mat4.create();

//Void color
let voidColor = [128.0 / 256.0, 223.0 / 256.0, 224.0 / 256.0]; //sky blue

//Chunk dimensions
const chunkLength = 255.0; //With the way model is rendering currently, this is the maximum
const chunkWidth = 255.0; //With the way model is rendering currently, this is the maximum

/**
 * Object: keys
 * 
 * Description: A collection of key objects, to be used when
 *              interpreting user input
 */

const keys = {

    /**
     * Object: key
     * 
     * Description: An object representing a key on the keyboard
     * 
     * Attributes: String code, boolean down
     */

    W: {

        code: "KeyW",
        down: false,
    },
    S: {

        code: "KeyS",
        down: false,
    },
    A: {

        code: "KeyA",
        down: false,
    },
    D: {

        code: "KeyD",
        down: false,
    },
    Space: {

        code: "Space",
        down: false,
    },
    ShiftLeft: {

        code: "ShiftLeft",
        down: false,
    },
};

/**
 * Object: models
 * 
 * Description: A collection of model objects
 */

let models = {

    /**
     * Object: model
     * 
     * Description: A collection of data representing a 3D model
     *              Contains data about the model's vertex locations,
     *              normal values of vertices, color values of vertices,
     *              and total count of vertices.
     * 
     * Attributes: Float32Array vertexValues,
     *             Float32Array normalValues,
     *             Float32Array colorValues,
     *             Integer vertexCount
     */

    cube: {

        vertexValues: [

            // Front face
            -1.0,  1.0, 1.0,
             1.0,  1.0, 1.0,
             1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0,

            // Back face
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,
            -1.0, -1.0, -1.0,

            // Left face
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0,
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,

            // Right face
            1.0,  1.0,  1.0,
            1.0,  1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0,  1.0,

            // Top face
            -1.0, 1.0,  1.0,
             1.0, 1.0,  1.0,
             1.0, 1.0, -1.0,
            -1.0, 1.0, -1.0,

            // bottom face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0, -1.0, -1.0,
            -1.0, -1.0, -1.0,

        ],

        normalValues: [

            // Front
            0.0,  0.0, 1.0,
            0.0,  0.0, 1.0,
            0.0,  0.0, 1.0,
            0.0,  0.0, 1.0,

            // Back
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,

            // left
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,

            // right
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,

            // Top
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,

            // Bottom
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
        ],

        colorValues: [

            //Front white
            1.0, 1.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 1.0,

            //Back red
            1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0,

            //Left green
            0.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,

            //Right blue
            0.0, 0.0, 1.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
            0.0, 0.0, 1.0, 1.0,

            //Top purple
            1.0, 0.0, 1.0, 1.0,
            1.0, 0.0, 1.0, 1.0,
            1.0, 0.0, 1.0, 1.0,
            1.0, 0.0, 1.0, 1.0,

            //Bottom yellow
            1.0, 1.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0,

        ],

        drawPointIndices: [
        
            //Front
            2, 1, 0,
            3, 2, 0,

            //Back
            4, 5, 6,
            4, 6, 7,

            //Left
            8, 9, 10,
            8, 10, 11,

            //right
            14, 13, 12,
            15, 14, 12,

            //Top
            16, 17, 18,
            16, 18, 19,

            //Bottom
            22, 21, 20,
            23, 22, 20,
		],

        drawPointCount: 36,
    },
};

/**
 * Object: objects
 * 
 * Description: a collection of 3D objects for the program to render
 */

let objects = [

    /**
     * Object: object
     * 
     * Description: A 3D object for the program to render, not to be confused with a JavaScript "Object"
     * 
     * Attributes: Double x, y, z
     *             Double roll, pitch, yaw,
     *             Double scale,
     *             model model
     */
];

/**
 * Object: camera
 * 
 * Description: Contains data on camera position and angle. Is a representation
 *              of the user's first-person location and perspective.
 * 
 * Attributes: Double x, y, z,
 *             vec3 rightVec, upVec, forwardVec,
 *             mat4 rotationMatrix,
 *             Double speed, rightSpeed, upSpeed, forwardSpeed
 */
let camera = {

    x: 0.0, //Camera initialized 6 units above origin
    y: 6.0,
    z: 0.0,

    lastx: 0.0,
    lastz: chunkLength * 1.0 + 1.0, //Set the last z to be at least a chunk behind

    yawAngle: 0.0, // Angle of roration around y axis
    pitchAngle: 0.0, // Angle of rotation around x axis

    //Normal vectors representing right, left, and forward for the camera.
    //Camera is initialized facing negative Z
    rightVec: vec3.fromValues(1.0, 0.0, 0.0),
    forwardVec: vec3.fromValues(0.0, 0.0, -1.0),

    speed: 25.0,

    rightSpeed: 0.0,
    upSpeed: 0.0,
    forwardSpeed: 0.0,
};

/**
 * Object: lastMousePosition
 * 
 * Description: contains data on last mouse position relative to the canvas
 * 
 * Attributes: Boolean inWindow,
 *             Double x, y,
 * 
 */
let lastMousePosition = {

    inWindow: false,
    x: 0,
    y: 0,
};