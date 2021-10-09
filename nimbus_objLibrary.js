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

const piOver2 = Math.PI / 2.0;

// Axis ids used by gl-matrix.js rotation functions
const XAXIS = [1, 0, 0];
const YAXIS = [0, 1, 0];
const ZAXIS = [0, 0, 1];

// 3d vector of zeroes
const VEC3_ZERO = [0, 0, 0];

// Vectors that can be used to set translation and rotations to be used by gl-matrix functions
let translation = vec3.create(0.0, 0.0, 0.0);
let scaling = vec3.create(0.0, 0.0, 0.0);

//Canvas and context element(s)
let canvas = null;
let hud = null;
let ctx = null;
let hudCtx = null;

//View Matrices
const modelViewMatrix = mat4.create();
const worldViewMatrix = mat4.create();
const normalMatrix = mat4.create();
const skyBoxRotationMatrix = mat4.create();
const shipInteriorViewMatrix = mat4.create();

//Projection matrix
const projectionMatrix = mat4.create();

//Void color
//let voidColor = [128.0 / 256.0, 223.0 / 256.0, 224.0 / 256.0]; //sky blue
let voidColor = [0.0 / 256.0, 0.0 / 256.0, 0.0 / 256.0]; //black

chunkSize = 1000.0;

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
    Q: {

        code: "KeyQ",
        down: false,
    },
    E: {

        code: "KeyE",
        down: false,
    },
    F: {
        code: "KeyF",
        down: false,
        toggleSequence: 0, // 0 for up, 1 for down, 2 for up again
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
 * Object: objects
 * 
 * Description: a collection of 3D objects for the program to render
 */

let interiorObjects = [

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
]

let exteriorObjects = [

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
 * Object: player
 * 
 * Description: Contains data on player position and view angle. Is a representation
 *              of the user's first-person location and perspective.
 * 
 * Attributes: Double x, y, z, yawAngle, pitchAngle
 *             vec3 rightVec, forwardVec,
 *             
 *             Double speed, rightSpeed, upSpeed, forwardSpeed
 */
let player = {

    x: 0.0,
    y: 0.0,
    z: 0.0,

    yawAngle: 0.0, // Angle of rotation around y axis
    pitchAngle: 0.0, // Angle of rotation around x axis

    //Normal vectors representing right, left, and forward for the player's view.
    //Player is initialized facing negative Z
    rightVec: vec3.fromValues(1.0, 0.0, 0.0),
    forwardVec: vec3.fromValues(0.0, 0.0, -1.0),

    speed: 10.0,

    rightSpeed: 0.0,
    upSpeed: 0.0,
    forwardSpeed: 0.0,

    boardedShip: null,
    isPiloting: false,
};

/**
 * Object: ship
 * 
 * Description: Contains data on ship position and rotation.
 * 
 * Attributes: Double x, y, z, yawAngle, pitchAngle, rollAngle
 *             vec3 rightVec, upVec, forwardVec
 *             
 *             Double speed, rightSpeed, upSpeed, forwardSpeed
 */
 let ship = {

    x: 0.0,
    y: 0.0,
    z: 0.0,

    yawAngle: Math.PI, // Angle of rotation around y axis
    pitchAngle: 0.0, // Angle of rotation around x axis
    rollAngle: 0.0, // Angle of rotation around z axis

    //Normal vectors representing right, left, and forward for the ship's facing direction.
    //Ship is initialized facing negative Z
    rightVec: vec3.fromValues(1.0, 0.0, 0.0),
    upVec: vec3.fromValues(0.0, 1.0, 0.0),
    forwardVec: vec3.fromValues(0.0, 0.0, -1.0),

    accelRate: 30.0,
    isPressingAccelerate: false,
    isAutoDecelActive: false,
    forwardAccel: 0.0,
    forwardSpeed: 100.0,

    isPressingYaw: false,
    yawAccelRate: 30.0 * Math.PI / 180.0,
    yawAccel: 0.0,
    yawSpeed: 0.0,
    maxYawSpeed: 70.0 * Math.PI / 180.0,

    isPressingPitch: false,
    pitchAccelRate: 30.0 * Math.PI / 180.0,
    pitchAccel: 0.0,
    pitchSpeed: 0.0,
    maxPitchSpeed: 70.0 * Math.PI / 180.0,

    interiorModel: models.shipInterior,
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
