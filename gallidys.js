/**
 *               Filename: gallidys.js
 * 
 *                 Author: Browning Keith Smith
 *           Date Created: April 24, 2020
 *          Date Modified: April 24, 2020
 * 
 *            Description: Gallidys is an open world MMO war game, where you aid your faction in attempting to
 *                         conquer the alien world of Gallidys. The game blends aspects of RTS and FPS for a truly
 *                         unique gaming experience. Command your troops from the air, or join them on the ground!
 * 
 * Execution Requirements: Google Chrome. Program not currently supported in other browsers.
 *                         Browser must support HTML5 <canvas> element and WebGL context.
 * 
 *                         HTML file must include 2 instances of the <canvas> element, one with the id "canvas",
 *                         and one with the id "hud"
 * 
 *           Dependencies: gl-matrix.js https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js
 *                         gallidys_objLibrary.js
 *                         gallidys_methodLibrary.js
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
 *              link the shader programs, retirieve attribute locations from the compiled programs, calls
 *              functions to initialize buffer data, and begins the loop of calling animation frames.
 */
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

    //Create height voxels for central chunk
    heightVoxels.centralChunk = createHeightVoxels();

    //Initialize buffers for central chunk model
    objects.centralChunk.model.buffers = initVoxelBuffers(ctx, heightVoxels.centralChunk);

    //Initialize objectRotation to 0.0
    objectRotation = 0.0;

    //Initialize previousTimestamp
    var previousTimeStamp = 0;

    //Initialize deltaT
    var deltaT = 0.0;

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

        //Update camera roll
        updateRoll(deltaT);
        updatePosition(deltaT);

        drawScene(ctx, shaderProgramData, deltaT);
        drawHUD(hudCtx);

        requestAnimationFrame(newFrame);
    }

    requestAnimationFrame(newFrame);

    //Display controls when window loads
    alert("Controls:\nW - Move Forward\nS - Move Backward\nA - Move Left\nD - Move Right\nSPACE - Move Up\nLEFT SHIFT - Move Down\nQ - Roll Left\nE - Roll Right\nMove the mouse to change the direction you are facing.");
}

window.onload = main;
/*window.onbeforeunload = function () {

        return confirm("Are you sure you want to leave the page? Any unsaved changes will be lost");
};*/