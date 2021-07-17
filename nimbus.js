/**
 *               Filename: nimbus.js
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
 *                         nimbus_objLibrary.js
 *                         nimbus_methodLibrary.js
 * 
 * Copyright (c) 2020, Browning Keith Smith. All rights reserved.
 */

/**
 * Function: main
 * 
 * Input: none
 * Output: none
 * 
 * Description: This function is called at the end of this file, as an event of window.onload,
 *              to ensure that all dependencies have been loaded. This function handles getting
 *              the canvas page elements, and getting their respective contexts. Displays an error
 *              messge if the webgl context is not supported by the browser.
 * 
 *              This function also handles adding event listeners to the appropriate page elements.
 * 
 *              Once these tasks are accomplished, the function calls other functions to compile and
 *              link the shader programs, retrieve attribute locations from the compiled programs, calls
 *              functions to initialize buffer data, and begins the loop of calling animation frames.
 */

const piOver2 = Math.PI / 2.0;

function main() {

    //Get canvas element
    const canvas = document.getElementById("canvas");

    //Get hud canvas element
    const hud = document.getElementById("hud");

    //Add mouse event listeners
    hud.addEventListener("mousemove", updateMouse);
    hud.addEventListener("mouseleave", mouseLeave);
    window.addEventListener("keydown", parseDownKey);
    window.addEventListener("keyup", parseUpKey);

    //Get canvas context
    const ctx = canvas.getContext("webgl");

    //If unable to get context, alert user and end program
    if (!ctx) {

        alert("Unable to initialize WebGL. It may not be supported by this browser.");
        return;
    }

    //Get hud context
    const hudCtx = hud.getContext("2d");

    //Create the shader program
    const shaderProgram = createShaderProgram(ctx);

    //Get location of attributes and uniforms, store in shaderProgramData object
    const shaderProgramData = {

        program: shaderProgram,
        attributes: {

            vertexPosition: ctx.getAttribLocation(shaderProgram, "a_vertexPosition"),
            vertexColor: ctx.getAttribLocation(shaderProgram, "a_vertexColor"),
            vertexNormal: ctx.getAttribLocation(shaderProgram, "a_vertexNormal"),
        },
        uniforms: {

            projectionMatrix: ctx.getUniformLocation(shaderProgram, "u_projectionMatrix"),
            modelViewMatrix: ctx.getUniformLocation(shaderProgram, "u_modelViewMatrix"),
            worldViewMatrix: ctx.getUniformLocation(shaderProgram, "u_worldViewMatrix"),
            normalMatrix: ctx.getUniformLocation(shaderProgram, "u_normalMatrix"),
        },
    };

    //Create and fill buffers, attach them to their respective models
    for (model in models) {

        models[model].buffers = initBuffers(ctx, model);
	}

    // Create more cubes in random places
    for (let i=0; i<1000; i++)
    {
        let newCube = {

            x: Math.random() * 200.0 - 100.0,
            y: Math.random() * 200.0 - 100.0,
            z: Math.random() * 200.0 - 100.0,

            roll: 0.0,
            pitch: 0.0,
            yaw: 0.0,

            rollSpeed: 0.0,
            pitchSpeed: 0.0,
            yawSpeed: 0.0,

            scale: 1.0,

            model: models.cube,
        };

        objects.push(newCube);
    }

    // Randomize rotation speeds of each object
    randomizeRotations(objects);

    //Initialize previousTimestamp
    let previousTimeStamp = 0;

    //Initialize deltaT
    let deltaT = 0.0;

    /**
     * Function: newFrame
     * 
     * Input: Double now
     * Output: none
     * 
     * Description: This function is responsible for calculating a deltaT
     *              in order to update object rotations and camera movement
     *              smoothly. Calls drawScene and drawHUD to render a new
     *              animation frame.
     */

    function newFrame(now) {

        //Get change in time
        now *= 0.001; //Convert to seconds

        deltaT = now - previousTimeStamp;
        previousTimeStamp = now;

        // Update object rotations
        for (object in objects)
        {
            updateObjectRotation(object, deltaT);
        }

        //Update camera position
        updatePosition(deltaT, ctx);

        drawScene(ctx, shaderProgramData);
        drawHUD(hudCtx);

        requestAnimationFrame(newFrame);
    }

    requestAnimationFrame(newFrame);
}

window.onload = main;