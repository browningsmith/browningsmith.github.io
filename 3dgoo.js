let canvas = null;
let ctx = null;

let po2 = 4;
let dimension = Math.pow(2, po2);
let rowLength = 0.0;
let animationDuration = dimension * 1.0;

let shaderData = {

    vertexShaderCode: `
    
        attribute vec4 a_vertexPosition;

        void main(void)
        {
            gl_Position = a_vertexPosition;
        }
    `,

    fragmentShaderCode: `
    
        #define PI 3.1415926538
    
        precision highp float;
    
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_duration;
        uniform float u_dimension;
        uniform float u_rowLength;

        uniform sampler2D u_sampler;

        vec4 vol3D(sampler2D sampler, vec3 coord, float tileDimension, float rowLength)
        {
            vec2 tileCoord = floor(vec2(coord.z * tileDimension, 0.0));
            for (int i = 0; i < 5000; i++)
            {
                if (tileCoord.x >= rowLength)
                {
                    tileCoord.x -= rowLength;
                    tileCoord.y += 1.0;
                }
                else
                {
                    break;
                }
            }
            
            vec2 finalCoord = (tileCoord + coord.xy) / rowLength;

            return texture2D(sampler, finalCoord);
        }

        float noise3D(vec3 stu)
        {
            stu *= u_dimension;
            vec3 stu_i = floor(stu);
            vec3 stu_f = fract(stu);
            //vec2 smooth = smoothstep(0.0, 1.0, st_f);
            vec3 smooth = stu_f * stu_f * stu_f * (stu_f * (stu_f * 6.0 - 15.0) + 10.0);

            // Get the index of the eight corners of this grid square
            vec3 i000 = stu_i;
            vec3 i100 = stu_i + vec3(1.0, 0.0, 0.0); if (i100.x >= u_dimension) { i100.x -= u_dimension; }
            vec3 i010 = stu_i + vec3(0.0, 1.0, 0.0); if (i010.y >= u_dimension) { i010.y -= u_dimension; }
            vec3 i110 = stu_i + vec3(1.0, 1.0, 0.0); if (i110.x >= u_dimension) { i110.x -= u_dimension; } if (i110.y >= u_dimension) { i110.y -= u_dimension; }
            vec3 i001 = stu_i + vec3(0.0, 0.0, 1.0); if (i001.z >= u_dimension) { i001.z -= u_dimension; }
            vec3 i101 = stu_i + vec3(1.0, 0.0, 1.0); if (i101.x >= u_dimension) { i101.x -= u_dimension; } if (i101.z >= u_dimension) { i101.z -= u_dimension; }
            vec3 i011 = stu_i + vec3(0.0, 1.0, 1.0); if (i011.y >= u_dimension) { i011.y -= u_dimension; } if (i011.z >= u_dimension) { i011.z -= u_dimension; }
            vec3 i111 = stu_i + vec3(1.0, 1.0, 1.0); if (i111.x >= u_dimension) { i111.x -= u_dimension; } if (i111.y >= u_dimension) { i111.y -= u_dimension; } if (i111.z >= u_dimension) { i111.z -= u_dimension; }

            // Get the values of the eight corners
            vec3 f000 = vol3D(u_sampler, i000 / u_dimension, u_dimension, u_rowLength).xyz;
            vec3 f100 = vol3D(u_sampler, i100 / u_dimension, u_dimension, u_rowLength).xyz;
            vec3 f010 = vol3D(u_sampler, i010 / u_dimension, u_dimension, u_rowLength).xyz;
            vec3 f110 = vol3D(u_sampler, i110 / u_dimension, u_dimension, u_rowLength).xyz;
            vec3 f001 = vol3D(u_sampler, i001 / u_dimension, u_dimension, u_rowLength).xyz;
            vec3 f101 = vol3D(u_sampler, i101 / u_dimension, u_dimension, u_rowLength).xyz;
            vec3 f011 = vol3D(u_sampler, i011 / u_dimension, u_dimension, u_rowLength).xyz;
            vec3 f111 = vol3D(u_sampler, i111 / u_dimension, u_dimension, u_rowLength).xyz;

            // Calculate unit vectors
            vec3 c000 = normalize(f000 * 2.0 - 1.0);
            vec3 c100 = normalize(f100 * 2.0 - 1.0);
            vec3 c010 = normalize(f010 * 2.0 - 1.0);
            vec3 c110 = normalize(f110 * 2.0 - 1.0);
            vec3 c001 = normalize(f001 * 2.0 - 1.0);
            vec3 c101 = normalize(f101 * 2.0 - 1.0);
            vec3 c011 = normalize(f011 * 2.0 - 1.0);
            vec3 c111 = normalize(f111 * 2.0 - 1.0);

            // Calculate dot products
            float d000 = dot(c000, stu_f - vec3(0.0, 0.0, 0.0));
            float d100 = dot(c100, stu_f - vec3(1.0, 0.0, 0.0));
            float d010 = dot(c010, stu_f - vec3(0.0, 1.0, 0.0));
            float d110 = dot(c110, stu_f - vec3(1.0, 1.0, 0.0));
            float d001 = dot(c001, stu_f - vec3(0.0, 0.0, 1.0));
            float d101 = dot(c101, stu_f - vec3(1.0, 0.0, 1.0));
            float d011 = dot(c011, stu_f - vec3(0.0, 1.0, 1.0));
            float d111 = dot(c111, stu_f - vec3(1.0, 1.0, 1.0));

            // Mix it all together based on smoothstep
            return mix(
                    mix(
                        mix(
                            d000,
                            d100,
                            smooth.x
                        ),
                        mix(
                            d010,
                            d110,
                            smooth.x
                        ),
                        smooth.y
                    ),
                    mix(
                        mix(
                            d001,
                            d101,
                            smooth.x
                        ),
                        mix(
                            d011,
                            d111,
                            smooth.x
                        ),
                        smooth.y
                    ),
                    smooth.z
                );
        }

        vec3 wrapVolumeCoords(vec3 coord)
        {
            coord = fract(coord);

            if (coord.x < 0.0)
            {
                coord.x += 1.0;
            }
            if (coord.y < 0.0)
            {
                coord.y += 1.0;
            }
            if (coord.z < 0.0)
            {
                coord.z += 1.0;
            }

            return coord;
        }
        
        void main()
        {
            vec2 pixCoord = gl_FragCoord.xy;

            // Calculate field of vision (radians)
            float fov = 100.0 * PI / 180.0;

            // Calculate distance of origin from screen to get proper fov
            float dfs = u_resolution.y / (2.0 * tan(fov / 2.0));

            // Calculate direction of ray based on pixel coordinates and dfs
            vec3 rd = normalize(
                vec3(
                    pixCoord.x - u_resolution.x / 2.0,
                    pixCoord.y - u_resolution.y / 2.0,
                    dfs * -1.0
                )
            );

            // Move ray origin through negative z space
            vec3 ro = vec3(0.0, 0.0, (u_time / u_duration) * -1.0);

            float t = 0.100;
            float step = 0.010;
            float den = 0.0;

            // Perform ray marching along rd starting from ro
            for (int i=0; i < 1000; i++)
            {
                if (t >= 2.0)
                {
                    t = 2.0;
                    den = 0.0;
                    break;
                }
                
                den += clamp(0.0, 1.0, noise3D(wrapVolumeCoords( ro + rd * t)) + 0.08);

                if (den >= 1.0)
                {
                    den = 1.0;                   
                    break;
                }

                t += step;
            }
            den *= (1.0 - (t / 2.0)) * 1.0;
            den = clamp(0.0, 1.0, den);

            vec3 color1 = vec3(1.0, 1.0, 1.0);
            vec3 color2 = vec3(50.0 / 256.0, 50.0 / 256.0, 50.0 / 256.0);


            gl_FragColor = vec4(mix(color1, color2, den), 1.0);
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
            sampler: ctx.getUniformLocation(this.program, "u_sampler"),
            dimension: ctx.getUniformLocation(this.program, "u_dimension"),
            duration: ctx.getUniformLocation(this.program, "u_duration"),
            rowLength: ctx.getUniformLocation(this.program, "u_rowLength")
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

    // Compute rowLength and textureDimension
    if (po2 % 2 == 0)
    {
        rowLength = Math.pow(2, po2 / 2);
    }
    else
    {
        rowLength = Math.pow(2, (po2+1) / 2);
    }
    let textureDimension = rowLength * dimension;
    console.log("po2: " + po2);
    console.log("volume dimension: " + dimension);
    console.log("tile layout in rows of: " + rowLength);
    console.log("texture dimension: " + textureDimension);
    

    let textureData = new Array(textureDimension * textureDimension * 4);

    for (let i = 0; i < textureDimension * textureDimension * 4; i += 4)
    {
        textureData[i    ] = Math.floor(Math.random() * 256.0);
        textureData[i + 1] = Math.floor(Math.random() * 256.0);
        textureData[i + 2] = Math.floor(Math.random() * 256.0);
        textureData[i + 3] = 255;
    }


    /*let colorIndex = 0; // 0 red, 1 green, 2 yellow, 3 blue
    for (let z = 0; z < dimension; z++)
    {
        // Unpack z index into tile x and y
        let tileX = z;
        let tileY = 0;
        while (tileX >= rowLength)
        {
            tileX -= rowLength;
            tileY++;
        }

        // Reset intensity
        //let intensity = 255;
        //let dropFactor = 255 / (dimension * dimension);

        for (let y = 0; y < dimension; y++)
        {
            for (let x = 0; x < dimension; x++)
            {
                // Construct texture index
                let xx = tileX * dimension + x;
                let yy = tileY * dimension + y;
                let i = (yy * textureDimension + xx) * 4;
                //console.log(i);

                let intensity = Math.floor(Math.random() * 256.0);

                switch (colorIndex)
                {
                    case 0:
                        textureData[i    ] = Math.floor(intensity);
                        textureData[i + 1] = 0;
                        textureData[i + 2] = 0;
                        break;

                    case 1:
                        textureData[i    ] = 0;
                        textureData[i + 1] = Math.floor(intensity);
                        textureData[i + 2] = 0;
                        break;

                    case 2:
                        textureData[i    ] = Math.floor(intensity);
                        textureData[i + 1] = Math.floor(intensity);
                        textureData[i + 2] = 0;
                        break;

                    default:
                        textureData[i    ] = 0;
                        textureData[i + 1] = 0;
                        textureData[i + 2] = Math.floor(intensity);
                }
                textureData[i + 3] = 255;

                //intensity -= dropFactor;
            }
        }


        // Switch color index
        colorIndex++;
        if (colorIndex > 3)
        {
            colorIndex = 0;
        }
    }*/
    
    let texture = loadArrayToTexture(textureDimension, textureDimension, textureData);

    // Animation loop
    function newFrame(currentTime)
    {
        currentTime *= 0.001; // Convert to seconds
        currentTime = currentTime % animationDuration;
        
        renderFrame(currentTime, texture);

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

/**
 * Function: loadArrayToTexture
 * 
 * Input: int width, int height, int[] data
 * Output: 
 * 
 * Description: 
 */
function loadArrayToTexture(width, height, data)
{
    let texture = ctx.createTexture();
    ctx.bindTexture(ctx.TEXTURE_2D, texture);

    ctx.texImage2D(
        ctx.TEXTURE_2D,
        0, // LOD
        ctx.RGBA, // internal format
        width, // Width
        height, // Height
        0, // Border
        ctx.RGBA, // source format
        ctx.UNSIGNED_BYTE, // source type
        new Uint8Array(data)
    );

    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);

    return texture;
}

function renderFrame(currentTime, texture)
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

    //Instruct WebGL on which texture to use
    ctx.activeTexture(ctx.TEXTURE0);
    ctx.bindTexture(ctx.TEXTURE_2D, texture);
    ctx.uniform1i(shaderData.uniforms.sampler, 0);

    // Set resolution uniform
    ctx.uniform2f(shaderData.uniforms.resolution, ctx.canvas.width, ctx.canvas.height);

    // Set time uniform
    ctx.uniform1f(shaderData.uniforms.time, currentTime);

    // Set dimension uniform
    ctx.uniform1f(shaderData.uniforms.dimension, dimension);

    // Set duration uniform
    ctx.uniform1f(shaderData.uniforms.duration, animationDuration);

    // Set tile layout dimension
    ctx.uniform1f(shaderData.uniforms.rowLength, rowLength);

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
