/**
 *               Filename: nimbus_methodLibrary.js
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

 /**
 * Function: createShaderProgram
 * 
 * Input: WebGLRenderingContext ctx
 * Output: WebGLProgram, prints error to console if there is an error linking the program
 * 
 * Description: This function handles finishing compiling a new shader program. It calls
 *              loadShader for the vertex shader and the fragment shader, whose source codes are declared
 *              at the top of this file, and attempts to link the resulting shaders together into
 *              a new WebGLProgram.
 */
function createShaderProgram(ctx) {

    //Compile shaders
    const vertexShader = loadShader(ctx, ctx.VERTEX_SHADER, vertexShaderCode);
    const fragmentShader = loadShader(ctx, ctx.FRAGMENT_SHADER, fragmentShaderCode);

    //Create pointer to new shader program
    const newShaderProgram = ctx.createProgram();

    //Attach shaders
    ctx.attachShader(newShaderProgram, vertexShader);
    ctx.attachShader(newShaderProgram, fragmentShader);

    //Link program to complete
    ctx.linkProgram(newShaderProgram);

    //If there was an error linking, print error to console and return null
    if (!ctx.getProgramParameter(newShaderProgram, ctx.LINK_STATUS)) {

        console.error("Error creating shader program: " + ctx.getProgramInfoLog(newShaderProgram));
        return null;
    }

    return newShaderProgram;
}

/**
 * Function: loadShader
 * 
 * Input: WebGLRenderingContext ctx, (WebGLRenderingContext constant representing shader type) type, String code
 * Output: WebGLShader, prints error to console if there is an error compiling the shader
 * 
 * Description: This function compiles and returns a new shader of the type "type", using the source code
 *              "code". Prints an error to the console if it is unable to compile the shader, with a
 *              description of the compilation error.
 */
function loadShader(ctx, type, code) {

    //Create pointer to a new shader
    const newShader = ctx.createShader(type);

    //Attach the code
    ctx.shaderSource(newShader, code);

    //Compile the shader
    ctx.compileShader(newShader);

    //If there was an error compiling, print error to console, delete shader, and return null
    if (!ctx.getShaderParameter(newShader, ctx.COMPILE_STATUS)) {

        console.error("Error compiling a shader: " + ctx.getShaderInfoLog(newShader));
        ctx.deleteShader(newShader);
        return null;
    }

    return newShader;
}

/**
 * Function: initBuffers
 * 
 * Input: WebGLRenderingContext ctx, model model,
 * Output: Collection of WebGLRenderingContext buffer data
 * 
 * Description: This function takes the given model, and creates buffers for them
 *              and places the appropriate data in these buffers. It creates a buffer
 *              for vertex position data, a buffer for vertex normals, a buffer for
 *              vertex colors, and a buffer for vertex indices.
 */
function initBuffers(ctx, model) {

    //Create pointer to a new buffer
    let vertexBuffer = ctx.createBuffer();

    //Bind buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, vertexBuffer);

    //Pass in the vertex data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(models[model].vertexValues), ctx.STATIC_DRAW);

    //Create pointer to a new buffer
    let colorBuffer = ctx.createBuffer();

    //Bind buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, colorBuffer);

    //Pass in color data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(models[model].colorValues), ctx.STATIC_DRAW);

    //Create pointer to a new buffer
    let normalBuffer = ctx.createBuffer();

    //Bind the buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, normalBuffer);

    //Pass in normals data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(models[model].normalValues), ctx.STATIC_DRAW);

    //Create pointer to a new buffer
    let drawPointBuffer = ctx.createBuffer();

    //Bind the buffer to element buffer
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, drawPointBuffer);

    //Pass in element index data
    ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(models[model].drawPointIndices), ctx.STATIC_DRAW);

    return {

        vertex: vertexBuffer,
        color: colorBuffer,
        normal: normalBuffer,
        drawPoint: drawPointBuffer,
    };
}

/**
 * Function: drawHUD
 * 
 * Input: CanvasRenderingContext2D hudCtx
 * Output: None
 * 
 * Description: Clears the canvas, then draws a horizontal and vertical white line on the 
 *              2D hud canvas at the center of the screen
 */
function drawHUD(hudCtx) {

    hudCtx.canvas.width = hudCtx.canvas.clientWidth;   //Resize canvas to fit CSS styling
    hudCtx.canvas.height = hudCtx.canvas.clientHeight;

    hudCtx.clearRect(0, 0, hudCtx.canvas.width, hudCtx.canvas.height); //Clear canvas

    //Create horizontal line
    hudCtx.beginPath();
    hudCtx.moveTo(hudCtx.canvas.width / 2 - 25, hudCtx.canvas.height / 2);
    hudCtx.lineTo(hudCtx.canvas.width / 2 + 25, hudCtx.canvas.height / 2);

    //Create vertical line
    hudCtx.moveTo(hudCtx.canvas.width / 2, hudCtx.canvas.height / 2 - 25);
    hudCtx.lineTo(hudCtx.canvas.width / 2, hudCtx.canvas.height / 2 + 25);

    //Draw the lines, white
    hudCtx.strokeStyle = 'white';
    hudCtx.stroke();
}

/**
 * Function: drawScene
 * 
 * Input: WebGLRenderingContext ctx, shaderProgramData, Double deltaT
 * Output: None
 * 
 * Description: Handles a variety of functionality on rendering the 3D scene
 *              First, resets the canvas size and drawing area to match window size,
 *              Next clears the canvas with fully opaque black, and clears the depth buffer.
 *              Enables depth testing and obscuring farther away objects
 *              Computes a new FOV based on the new window size
 */
function drawScene(ctx, shaderProgramData) {

    ctx.canvas.width = ctx.canvas.clientWidth;   //Resize canvas to fit CSS styling
    ctx.canvas.height = ctx.canvas.clientHeight;

    ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height); //Resize viewport

    //Clear the canvas
    ctx.clearColor(voidColor[0], voidColor[1], voidColor[2], 1.0); //set clear color to voidColor
    ctx.clearDepth(1.0); //set clear depth to 1.0
    ctx.clear(ctx.COLOR_BUFFER_BIT, ctx.DEPTH_BUFFER_BIT);

    //Enable depth testing and have it obscure objects further back
    ctx.enable(ctx.DEPTH_TEST);
    ctx.depthFunc(ctx.LEQUAL);

    //Enable backface culling
    ctx.enable(ctx.CULL_FACE);
    ctx.cullFace(ctx.BACK);

    //Tell WebGL to use the shader program
    ctx.useProgram(shaderProgramData.program);

    //Compute projection matrix based on new window size
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, ctx.canvas.width / ctx.canvas.height, 0.1, 1000.0);

    //Compute worldViewMatrix based on opposite coordinates of camera position and camera rotation
    mat4.identity(worldViewMatrix);
    mat4.rotate(worldViewMatrix, worldViewMatrix, camera.pitchAngle * -1.0, [1, 0, 0]); // Third transform, rotate whole world around x axis (in the opposite direction the camera is facing)
    mat4.rotate(worldViewMatrix, worldViewMatrix, camera.yawAngle * -1.0, [0, 1, 0]); //Second transform, rotate whole world around y axis (in the opposite direction the camera is facing)
    mat4.translate(worldViewMatrix, worldViewMatrix, [camera.x * -1.0, camera.y * -1.0, camera.z * -1.0]); //First transform, move whole world away from camera

    //Set worldview and projection uniforms
    ctx.uniformMatrix4fv(shaderProgramData.uniforms.projectionMatrix, false, projectionMatrix);
    ctx.uniformMatrix4fv(shaderProgramData.uniforms.worldViewMatrix, false, worldViewMatrix);

    //Render all objects
    for (object in objects) {

        drawObject(ctx, shaderProgramData, object);
    }
}

/**
 * Function: drawObject
 * 
 * Input: WebGLRenderingContext ctx, shaderProgramData, Object object
 * Output: None
 * 
 * Description: Handles drawing a specific object in the frame
 */

 function drawObject(ctx, shaderProgramData, object) {
 
    //Compute new model view matrix
    mat4.identity(modelViewMatrix);

    mat4.translate(modelViewMatrix, modelViewMatrix, [objects[object].x, objects[object].y, objects[object].z]);  //Fifth transform: move back from origin based on position
    mat4.rotate(modelViewMatrix, modelViewMatrix, objects[object].pitch, [1, 0, 0]); //Fourth transform: rotate around x based on object pitch
    mat4.rotate(modelViewMatrix, modelViewMatrix, objects[object].yaw, [0, 1, 0]);   //Third transform: rotate around y based on object yaw
    mat4.rotate(modelViewMatrix, modelViewMatrix, objects[object].roll, [0, 0, 1]);  //Second transform: rotate around z based on object roll

    //Compute new normals matrix
    //Do it before the scaling is applied, because otherwise the lighting doesn't work for some reason, not sure why yet :/
    mat4.identity(normalMatrix);
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    mat4.scale(modelViewMatrix, modelViewMatrix, [objects[object].scale, objects[object].scale, objects[object].scale]); //First transform: scale object based on object scale

    //Instruct WebGL how to pull out vertices
    ctx.bindBuffer(ctx.ARRAY_BUFFER, objects[object].model.buffers.vertex);
    ctx.vertexAttribPointer(shaderProgramData.attributes.vertexPosition, 3, ctx.FLOAT, false, 0, 0); //Pull out 3 values at a time, no offsets
    ctx.enableVertexAttribArray(shaderProgramData.attributes.vertexPosition); //Enable the pointer to the buffer

    //Instruct WebGL how to pull out colors
    ctx.bindBuffer(ctx.ARRAY_BUFFER, objects[object].model.buffers.color);
    ctx.vertexAttribPointer(shaderProgramData.attributes.vertexColor, 4, ctx.FLOAT, false, 0, 0); //Pull out 4 values at a time, no offsets
    ctx.enableVertexAttribArray(shaderProgramData.attributes.vertexColor); //Enable the pointer to the buffer

    //Instruct WebGL how to pull out normals
    ctx.bindBuffer(ctx.ARRAY_BUFFER, objects[object].model.buffers.normal);
    ctx.vertexAttribPointer(shaderProgramData.attributes.vertexNormal, 3, ctx.FLOAT, false, 0, 0); //Pull out 3 values at a time, no offsets
    ctx.enableVertexAttribArray(shaderProgramData.attributes.vertexNormal); //Enable the pointer to the buffer

    //Give WebGL the element array
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, objects[object].model.buffers.drawPoint);

    //Set the uniforms
    ctx.uniformMatrix4fv(shaderProgramData.uniforms.modelViewMatrix, false, modelViewMatrix);
    ctx.uniformMatrix4fv(shaderProgramData.uniforms.normalMatrix, false, normalMatrix);

    //Draw triangles
    ctx.drawElements(ctx.TRIANGLES, objects[object].model.drawPointCount, ctx.UNSIGNED_SHORT, 0);
 }

/**
 * Function: updateMouse
 * 
 * Input: KeyboardEvent event
 * Output: None
 * 
 * Description: Updates lastMousePosition, and uses the change in mouse position to
 *              update the direction that the camera is facing by calling pithcUp
 *              and yawRight
 */
function updateMouse(event) {

    //If the mouse is not in the window, record coordinates, set that it is in window, and return
    if (!lastMousePosition.inWindow) {
     
        lastMousePosition.x = event.offsetX; //record x
        lastMousePosition.y = event.offsetY; //record y
        lastMousePosition.inWindow = true; //Set that mouse is in window

        return;
	}

    //Record change in x and y
    let deltaX = event.offsetX - lastMousePosition.x;
    let deltaY = event.offsetY - lastMousePosition.y;

    //Update mouse position
    lastMousePosition.x = event.offsetX;
    lastMousePosition.y = event.offsetY;

    //console.log("deltaX: " + deltaX + " deltaY: " + deltaY);

    //Yaw and pitch based on change in x and y
    pitchUp(deltaY * -0.01);
    yawRight(deltaX * -0.01);
}

/**
 * Function: mouseLeave
 * 
 * Input: KeyboardEvent event
 * Output: None
 * 
 * Description: Sets lastMousePosition to false. This function should be called
 *              in the event the mouse leaves the window.
 */
function mouseLeave(event) {

    lastMousePosition.inWindow = false;
}

/**
 * Function: parseDownKey
 * 
 * Input: KeyboardEvent event
 * Output: None
 * 
 * Description: This function parses which key triggered the event,
 *              and whether the key had already been pressed. If the
 *              key was not already pressed, it sets that key to pressed,
 *              then calls updateCameraSpeed to update the speed and
 *              direction in which the camera is moving.
 */
function parseDownKey(event) {

    let code = event.code;  //Edge does not recognize this apparently

    //console.log("Key Down: " + code);

    //Find which key was pressed down
    for (key in keys) {

        //If the code of the key pressed matches
        if (code == keys[key].code) {

            //If key was not already down
            if (!(keys[key].down)) {

                //Update that key is down
                keys[key].down = true;

                //Update camera speeds
                updateCameraSpeed();
            }
            else {

                return;
            }
        } 
    }
}

/**
 * Function: parseUpKey
 * 
 * Input: KeyboardEvent event
 * Output: None
 * 
 * Description: This function parses which key triggered the up event,
 *              and whether the key had already been let go. If the
 *              key was not already let go, it sets that key to not pressed,
 *              then calls updateCameraSpeed to update the speed and
 *              direction in which the camera is moving.
 */
function parseUpKey(event) {

    let code = event.code; //Edge does not recognize this apparently

    //console.log("Key Up: " + code);

    //Find which key was released
    for (key in keys) {

        //If the code of the key released matches
        if (code == keys[key].code) {

            //If key was already down
            if (keys[key].down) {

                //Update that key is up
                keys[key].down = false;

                //Update camera speeds
                updateCameraSpeed();
            }
            else {

                return;
            }
        } 
    }
}

/**
 * Function: updateCameraSpeed
 * 
 * Input: KeyboardEvent event
 * Output: None
 * 
 * Description: This function takes a look at the state of pressed keys, and
 *              sets the speed of the camera based on that.
 */
function updateCameraSpeed() {

    //If both W and S are down, or if neither of them are down
    if ((keys.W.down && keys.S.down) || !(keys.W.down || keys.S.down)) {

        //Set forward speed to 0.0
        camera.forwardSpeed = 0.0;

        //console.log("Camera forward speed set to " + camera.forwardSpeed);
    }
    else {

        //If W is the key that is down
        if (keys.W.down) {

            //Set forward speed to camera.speed
            camera.forwardSpeed = camera.speed;

            //console.log("Camera forward speed set to " + camera.forwardSpeed);
        }
        else {

            //Set forward speed to reverse camera.speed
            camera.forwardSpeed = camera.speed * -1.0;

            //console.log("Camera forward speed set to " + camera.forwardSpeed);
        }
    }

    //If both A and D are down, or if neither of them are down
    if ((keys.A.down && keys.D.down) || !(keys.A.down || keys.D.down)) {

        //Set right speed to 0.0
        camera.rightSpeed = 0.0;

        //console.log("Camera right speed set to " + camera.rightSpeed);
    }
    else {

        //If A is the key that is down
        if (keys.A.down) {

            //Set right speed to reverse camera.speed
            camera.rightSpeed = camera.speed * -1.0;

            //console.log("Camera right speed set to " + camera.rightSpeed);
        }
        else {

            //Set right speed to camera.speed
            camera.rightSpeed = camera.speed;

            //console.log("Camera right speed set to " + camera.rightSpeed);
        }
    }

    //If both Space and ShiftLeft are down, or if neither of them are down
    if ((keys.Space.down && keys.ShiftLeft.down) || !(keys.Space.down || keys.ShiftLeft.down)) {

        //Set up speed to 0.0
        camera.upSpeed = 0.0;

        //console.log("Camera up speed set to " + camera.upSpeed);
    }
    else {

        //If A is the key that is down
        if (keys.Space.down) {

            //Set up speed to camera.speed
            camera.upSpeed = camera.speed;

            //console.log("Camera up speed set to " + camera.upSpeed);
        }
        else {

            //Set up speed to reverse camera.speed
            camera.upSpeed = camera.speed * -1.0;

            //console.log("Camera up speed set to " + camera.upSpeed);
        }
    }
}

/**
 * Function: updatePosition
 * 
 * Input: Double deltaT, WebGLRenderingContext ctx
 * Output: None
 * 
 * Description: Updates the camera position based on camera directional speeds 
 *              and deltaT as long as the given directional speed is greater than zero.
 *              Records what the last x and z position of the camera were, and initializes
 *              checkForStrides method to see if terrain data needs to be swapped between
 *              chunks
 */
//Function to update the camera position based on camera speeds
function updatePosition(deltaT,ctx) {

    //Record the cameras last position
    camera.lastx = camera.x;
    camera.lastz = camera.z;

    //Move camera forward/backward
    //If forward speed is not zero
    if (!(camera.forwardSpeed == 0.0)) {

        moveForward(camera.forwardSpeed * deltaT); //Move camera forward by forwardSpeed * change in time from last frame
    }

    //Move camera up/down
    //If up speed is not zero
    if (!(camera.upSpeed == 0.0)) {

        moveUp(camera.upSpeed * deltaT); //Move camera forward by forwardSpeed * change in time from last frame
    }

    //Move camera left/right
    //If right speed is not zero
    if (!(camera.rightSpeed == 0.0)) {

        moveRight(camera.rightSpeed * deltaT); //Move camera forward by rightSpeed * change in time from last frame
    }
}

/**
 * Function: pitchUp
 * 
 * Input: Double angle
 * Output: None
 * 
 * Description: Pitches the camera around it's local x vector by the given angle
 */
//Function to pitch the camera around it's local x vector
function pitchUp(angle) {

    // Update camera pitchAngle
    camera.pitchAngle += angle;

    if (camera.pitchAngle > piOver2)
    {
        camera.pitchAngle = piOver2;
    }

    if (camera.pitchAngle < piOver2 * -1.0)
    {
        camera.pitchAngle = piOver2 * -1.0;
    }
}

/**
 * Function: yawRight
 * 
 * Input: Double angle
 * Output: None
 * 
 * Description: Rotates the camera around it's local y vector by the given angle
 */
//Function to yaw the camera around it's local y vector
function yawRight(angle) {

    // Update camera yawAngle
    camera.yawAngle += angle
    
    //Create a quaternion representing rotation around upVec
    const yawQuat = quat.create();

    //Now set the quaternion using the positive angle
    quat.setAxisAngle(yawQuat, vec3.fromValues(0.0, 1.0, 0.0), angle);

    //Apply this rotation to camera's rightVec and forwardVec
    vec3.transformQuat(camera.rightVec, camera.rightVec, yawQuat);
    vec3.transformQuat(camera.forwardVec, camera.forwardVec, yawQuat);

    //Normalize camera's rightVec and forwardVec
    vec3.normalize(camera.rightVec, camera.rightVec);
    vec3.normalize(camera.forwardVec, camera.forwardVec);
}

/**
 * Function: moveForward
 * 
 * Input: Double amount
 * Output: None
 * 
 * Description: Moves the camera forward by given amount. Moves
 *              backward if given amount is negative
 */
function moveForward(amount) {

    camera.x += camera.forwardVec[0] * amount;
    camera.z += camera.forwardVec[2] * amount;
}

/**
 * Function: moveRight
 * 
 * Input: Double amount
 * Output: None
 * 
 * Description: Moves the camera right by given amount. Moves
 *              left if given amount is negative
 */
function moveRight(amount) {

    camera.x += camera.rightVec[0] * amount;
    camera.z += camera.rightVec[2] * amount;
}

/**
 * Function: moveUp
 * 
 * Input: Double amount
 * Output: None
 * 
 * Description: Moves the camera up by given amount. Moves
 *              down if given amount is negative
 */
//Function to move up based on camera directional vectors
function moveUp(amount) {

    camera.y += amount;
}

/**
 * Function: updateObjectRotation
 * 
 * Input: object, deltaT
 * Output: None
 * 
 * Description: Updates the roll pitch and yaw of
 * an object based on it's speeds and deltaT
 */
function updateObjectRotation(object, deltaT) {

    objects[object].roll += objects[object].rollSpeed * deltaT;
    objects[object].pitch += objects[object].pitchSpeed * deltaT;
    objects[object].yaw += objects[object].yawSpeed * deltaT;
}

/**
 * Function: randomizeRotations
 * 
 * Input: objects
 * Output: None
 * 
 * Description: Sets a random rotation speed for each object
 * in objects
 */
function randomizeRotations(objects)
{
    for (object in objects)
    {
        objects[object].rollSpeed = Math.random() * 5.0;
        objects[object].pitchSpeed = Math.random() * 5.0;
        objects[object].yawSpeed = Math.random() * 5.0;
    }
}