let canvas = null;
let ctx = null;

let shaderData = {

    vertexShaderCode: `
    
        attribute vec4 a_vertexPosition;

        void main(void)
        {
            gl_Position = a_vertexPosition;
        }
    `,

    fragmentShaderCode: `
    
        precision highp float;
    
        uniform vec2 u_resolution;
        uniform float u_time;

        vec2 random2( vec2 p )
        {
            return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
        }
        
        void main()
        {
            vec2 st = gl_FragCoord.xy/u_resolution;
            vec3 color = vec3(0.0);

            // Scale
            st *= 25.0;

            // Separate into tiles
            vec2 i = floor(st);
            vec2 f = fract(st);

            float min_dist = 9.0;

            // Generate points in this and surrounding tiles
            for (int x = -1; x < 2; x++)
            {
                for (int y = -1; y < 2; y++)
                {
                    vec2 ll_corner = i + vec2(float(x), float(y));

                    vec2 point = random2(ll_corner);

                    point = 0.5 + 0.5*sin(u_time + 6.2831*point);

                    point += ll_corner;

                    float dist = distance(st, point);

                    min_dist = min(min_dist, dist);
                }
            }

            color = vec3(0.0, 0.8 - min_dist*0.5, 0.0);
        
            gl_FragColor = vec4(color, 1.0);
        }
    `,

    program: null,
    attributes: null,
    uniforms: null,

    tieLocations: function() {

        //Get location of attributes and uniforms, store in the ShaderData object
        this.attributes = {

            vertexPosition: ctx.getAttribLocation(this.program, "a_vertexPosition"),
        };
        this.uniforms = {

            resolution: ctx.getUniformLocation(this.program, "u_resolution"),
            time: ctx.getUniformLocation(this.program, "u_time"),
        }
        
    },
};

let planeObject = {

    vertexCoordinates: [

        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
    ],

    elementIndices: [

        0, 2, 3,
        0, 1, 2,
    ],

    elementCount: 6,
};

function main()
{
    //Get canvas element
    canvas = document.getElementById("canvas");

    //Get canvas context
    ctx = canvas.getContext("webgl");

    //If unable to get context, alert user and end program
    if (!ctx) {

        alert("Unable to initialize WebGL. It may not be supported by this browser.");
        return;
    }

    createShaderProgram(shaderData);

    loadModel(planeObject);

    // Animation loop
    function newFrame(currentTime)
    {
        currentTime *= 0.001; // Convert to seconds
        
        renderFrame(currentTime);

        requestAnimationFrame(newFrame);
    }

    requestAnimationFrame(newFrame);
}

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
 function createShaderProgram(shaderData) {

    //Compile shaders
    const vertexShader = loadShader(ctx.VERTEX_SHADER, shaderData.vertexShaderCode);
    const fragmentShader = loadShader(ctx.FRAGMENT_SHADER, shaderData.fragmentShaderCode);

    //Create pointer to new shader program
    let newShaderProgram = ctx.createProgram();

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

    // Delete shaders now they are no longer needed
    ctx.deleteShader(vertexShader);
    ctx.deleteShader(fragmentShader);

    shaderData.program = newShaderProgram;

    // Pull out attribute and uniform locations based on custom tieLocations function
    shaderData.tieLocations();
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
 function loadShader(type, code) {

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
 * Function: loadModel
 * 
 * Input: model model,
 * Output: None
 * 
 * Description: This function takes the given model, and creates buffers for them
 *              and places the appropriate data in these buffers. It creates a buffer
 *              for vertex position data, a buffer for vertex normals, a buffer for
 *              vertex colors, and a buffer for vertex indices.
 */
 function loadModel(model) {

    //Create pointer to a new buffer
    let vertexBuffer = ctx.createBuffer();

    //Bind buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, vertexBuffer);

    //Pass in the vertex data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(model.vertexCoordinates), ctx.STATIC_DRAW);


    //Create pointer to a new buffer
    let elementIndicesBuffer = ctx.createBuffer();

    //Bind the buffer to element buffer
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, elementIndicesBuffer);

    //Pass in element index data
    ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.elementIndices), ctx.STATIC_DRAW);

    model.buffers = {

        vertex: vertexBuffer,
        elementIndices: elementIndicesBuffer,
    };
}

function renderFrame(currentTime)
{
    ctx.canvas.width = ctx.canvas.clientWidth;   //Resize canvas to fit CSS styling
    ctx.canvas.height = ctx.canvas.clientHeight;

    ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height); //Resize viewport

    //Clear the canvas
    ctx.clearColor(0.0, 0.0, 0.0, 1.0); //set clear color to black
    ctx.clearDepth(1.0); //set clear depth to 1.0
    ctx.clear(ctx.COLOR_BUFFER_BIT, ctx.DEPTH_BUFFER_BIT);

    //Tell WebGL to use the shader program
    ctx.useProgram(shaderData.program);

    // Set resolution uniform
    ctx.uniform2f(shaderData.uniforms.resolution, ctx.canvas.width, ctx.canvas.height);

    // Set time uniform
    ctx.uniform1f(shaderData.uniforms.time, currentTime);

    //Instruct WebGL how to pull out vertices
    ctx.bindBuffer(ctx.ARRAY_BUFFER, planeObject.buffers.vertex);
    ctx.vertexAttribPointer(shaderData.attributes.vertexPosition, 3, ctx.FLOAT, false, 0, 0); //Pull out 3 values at a time, no offsets
    ctx.enableVertexAttribArray(shaderData.attributes.vertexPosition); //Enable the pointer to the buffer

    //Give WebGL the element array
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, planeObject.buffers.elementIndices);

    //Draw triangles
    ctx.drawElements(ctx.TRIANGLES, planeObject.elementCount, ctx.UNSIGNED_SHORT, 0);
}

window.onload = main;