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
function main() {

    //Get canvas element
    canvas = document.getElementById("canvas");

    //Get hud canvas element
    hud = document.getElementById("hud");

    //Add mouse event listeners
    hud.addEventListener("mousemove", updateMouse);
    hud.addEventListener("mouseleave", mouseLeave);
    window.addEventListener("keydown", parseDownKey);
    window.addEventListener("keyup", parseUpKey);

    //Get canvas context
    ctx = canvas.getContext("webgl");

    //If unable to get context, alert user and end program
    if (!ctx) {

        alert("Unable to initialize WebGL. It may not be supported by this browser.");
        return;
    }

    //Get hud context
    hudCtx = hud.getContext("2d");

    //Create the shader programs
    createShaderProgram(skyBoxShader);
    createShaderProgram(shipInteriorShader);
    createShaderProgram(shipExteriorShader);

    //Load textures
    for (textureData in textures)
    {
        loadTexture(textures[textureData]);
    }

    // Attach skybox textures to the respective models
    skyBoxModels.negZplane.texture = textures.negZplane.texture;
    skyBoxModels.posXplane.texture = textures.posXplane.texture;
    skyBoxModels.posZplane.texture = textures.posZplane.texture;
    skyBoxModels.negXplane.texture = textures.negXplane.texture;
    skyBoxModels.posYplane.texture = textures.posYplane.texture;
    skyBoxModels.negYplane.texture = textures.negYplane.texture;

    //Create and fill buffers for skybox panels
    for (model in skyBoxModels)
    {
        initSkyBoxBuffers(skyBoxModels[model]);
    }

    //Create and fill buffers, attach them to their respective models
    for (model in models) {

        initBuffers(models[model]);
	}

    // Create more cubes in random places
    for (let i=0; i<2000; i++)
    {
        let newCube = {

            x: Math.random() * chunkSize * 2.0 - chunkSize,
            y: Math.random() * chunkSize * 2.0 - chunkSize,
            z: Math.random() * chunkSize * 2.0 - chunkSize,

            roll: 0.0,
            pitch: 0.0,
            yaw: 0.0,

            rollSpeed: 0.0,
            pitchSpeed: 0.0,
            yawSpeed: 0.0,

            scale: 1.0,

            model: models.cube
        };

        exteriorObjects.push(newCube);
    }

    // Set current boarded ship
    player.boardedShip = ship;
    player.isPiloting = true;

    // Randomize rotation speeds of each object
    randomizeRotations(exteriorObjects);

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
        for (object in exteriorObjects)
        {
            shiftToNextChunk(exteriorObjects[object]);
            updateObjectRotation(object, deltaT);
        }

        //Update ship position
        updateShipSpeedAndPosition(ship, deltaT);

        //Update player position
        updatePlayerPosition(deltaT);

        drawScene();
        drawHUD();

        requestAnimationFrame(newFrame);
    }

    alert("Movement Controls:\n\nMove cursor to look around cockpit\nE - Increase ship speed\nQ - Decrease ship speed\nA - Turn ship left\nD - Turn ship right\nW - Pitch ship down\nS - Pitch ship up\nF - Switch between ship control and player control");

    requestAnimationFrame(newFrame);
}

window.onload = main;