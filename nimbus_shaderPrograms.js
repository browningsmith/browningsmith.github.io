/*
 * Object: ShaderData
 *
 * Attributes:
 *     - vertexShaderCode - String representing vertex shader source code
 *     - fragmentShaderCode - String representing fragment shader source code
 *     - program - The resulting WebGL shader program
 *     - attributes - Pointers to shader attributes
 *     - uniforms - Pointers to shader uniforms
 *     - tieLocations - Function to pull out attribute and shader locations from the compiled program
 */

let skyBoxShader = {

    vertexShaderCode: `
    
        attribute vec4 a_vertexPosition;
        attribute vec2 a_textureCoordinates;

        uniform mat4 u_projectionMatrix;
        uniform mat4 u_worldViewMatrix;

        varying highp vec2 v_textureCoordinates;

        void main(void)
        {
            gl_Position = u_projectionMatrix * u_worldViewMatrix * a_vertexPosition; // Calculate vertex position in frame
            v_textureCoordinates = a_textureCoordinates;
        }
    `,

    fragmentShaderCode: `
    
        varying highp vec2 v_textureCoordinates;

        uniform sampler2D u_Sampler;
    
        void main(void)
        {
            gl_FragColor = texture2D(u_Sampler, v_textureCoordinates); // The color of the texture mapped to the current point
        }
    `,

    program: null,
    attributes: null,
    uniforms: null,

    tieLocations: function() {

        //Get location of attributes and uniforms, store in the ShaderData object
        this.attributes = {

            vertexPosition: ctx.getAttribLocation(this.program, "a_vertexPosition"),
            textureCoordinates: ctx.getAttribLocation(this.program, "a_textureCoordinates"),
        };
        
        this.uniforms = {

            projectionMatrix: ctx.getUniformLocation(this.program, "u_projectionMatrix"),
            worldViewMatrix: ctx.getUniformLocation(this.program, "u_worldViewMatrix"),
            uSampler: ctx.getUniformLocation(this.program, "u_Sampler"),
        };
    },
}

let shipInteriorShader = {

    vertexShaderCode: `

        attribute vec4 a_vertexPosition;
        attribute vec3 a_vertexNormal;
        attribute vec4 a_vertexColor;
        
        uniform mat4 u_projectionMatrix;
        uniform mat4 u_modelViewMatrix;
        uniform mat4 u_normalMatrix;
        uniform mat4 u_worldViewMatrix;

        varying lowp vec4 v_currentColor;
        varying highp vec4 v_currentPosition;
        varying highp vec4 v_currentNormal;

        void main(void) {

            v_currentPosition = u_modelViewMatrix * a_vertexPosition; // Calculate vertex position in the world
            
            gl_Position = u_projectionMatrix * u_worldViewMatrix * v_currentPosition; //Compute final vertex position based on model, worldview, and projection
            v_currentColor = a_vertexColor; //Color to be passed to fragment shader

            v_currentNormal = u_normalMatrix * vec4(a_vertexNormal, 1.0); //Compute new normals based on object
        }
    `,

    //Fragment Shader source code

    fragmentShaderCode: `

        varying lowp vec4 v_currentColor;
        varying highp vec4 v_currentPosition;
        varying highp vec4 v_currentNormal;

        void main(void) {

            highp vec3 ambientLight = vec3(0.3, 0.3, 0.3); //Set ambientLight to 0.3 rgb
            highp vec3 directionalLightColor = vec3(1.0, 1.0, 1.0); //Set directional light color to white

            highp vec3 lightPosition = vec3(0.0, 2.4, 0.0);

            highp vec3 lightDirection = normalize(lightPosition - v_currentPosition.xyz); //Set light direction vector

            highp float directional = max(dot(v_currentNormal.xyz, lightDirection),0.0); //Compute directional based on transformed normal and direction of light

            highp vec3 currentLighting = ambientLight + (directionalLightColor * directional); //Compute lighting of current vertex as ambient light plus directional light times the directional
            
            gl_FragColor = vec4(v_currentColor.rgb * currentLighting, 1.0); //Each fragment is the color multiplied by the light level
        }
    `,

    program: null,
    attributes: null,
    uniforms: null,

    tieLocations: function() {

        //Get location of attributes and uniforms, store in shaderProgramData object
        this.attributes = {

            vertexPosition: ctx.getAttribLocation(this.program, "a_vertexPosition"),
            vertexColor: ctx.getAttribLocation(this.program, "a_vertexColor"),
            vertexNormal: ctx.getAttribLocation(this.program, "a_vertexNormal"),
        };

        this.uniforms = {

            projectionMatrix: ctx.getUniformLocation(this.program, "u_projectionMatrix"),
            modelViewMatrix: ctx.getUniformLocation(this.program, "u_modelViewMatrix"),
            worldViewMatrix: ctx.getUniformLocation(this.program, "u_worldViewMatrix"),
            normalMatrix: ctx.getUniformLocation(this.program, "u_normalMatrix"),
        };
    },
}

let shipExteriorShader = {

    vertexShaderCode: `

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
            highp vec3 directionalLightColor = vec3(256.0 / 256.0, 256.0 / 256.0, 256.0 / 256.0); //Set directional light color to white

            highp vec3 lightDirection = normalize(vec3(0.2, 0.0, 1.0)); //Set light direction vector

            highp vec4 transformedNormal = u_normalMatrix * vec4(a_vertexNormal, 1.0); //Compute new normals based on object

            highp float directional = max(dot(transformedNormal.xyz, lightDirection * -1.0),0.0); //Compute directional based on transformed normal and direction of light

            v_currentLighting = ambientLight + (directionalLightColor * directional); //Compute lighting of current vertex as ambient light plus directional light times the directional
        }
    `,

    //Fragment Shader source code

    fragmentShaderCode: `

        varying lowp vec4 v_currentColor;
        varying lowp vec3 v_currentLighting;

        void main(void) {

            gl_FragColor = vec4(v_currentColor.rgb * v_currentLighting, 1.0); //Each fragment is the color multiplied by the light level
        }
    `,

    program: null,
    attributes: null,
    uniforms: null,

    tieLocations: function() {

        //Get location of attributes and uniforms, store in shaderProgramData object
        this.attributes = {

            vertexPosition: ctx.getAttribLocation(this.program, "a_vertexPosition"),
            vertexColor: ctx.getAttribLocation(this.program, "a_vertexColor"),
            vertexNormal: ctx.getAttribLocation(this.program, "a_vertexNormal"),
        };
        
        this.uniforms = {

            projectionMatrix: ctx.getUniformLocation(this.program, "u_projectionMatrix"),
            modelViewMatrix: ctx.getUniformLocation(this.program, "u_modelViewMatrix"),
            worldViewMatrix: ctx.getUniformLocation(this.program, "u_worldViewMatrix"),
            normalMatrix: ctx.getUniformLocation(this.program, "u_normalMatrix"),
        };
    },
}