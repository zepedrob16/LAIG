var DEGREE_TO_RAD = Math.PI / 180;

/**
 * XMLscene class, representing the scene that is to be rendered.
 * @constructor
 */
function XMLscene(interface) {
    CGFscene.call(this);

    this.interface = interface;

    this.last_tick = 0;
    this.lightValues = {};

    // Shader interface variables.
    this.selected_node = 'none';
    this.selected_shader = 'default';
    this.scale_factor = 1.5;

    this.elapsed_ticks = 0;

    this.solid_color = {r: 255, g: 0, b: 250};

    // RGB shader control variables.
    this.is_cycling = false;
    this.rgb_cycling = 0.1;
    this.rainbow_index = 0;

}

XMLscene.prototype = Object.create(CGFscene.prototype);
XMLscene.prototype.constructor = XMLscene;

/**
 * Initializes the scene, setting some WebGL defaults, initializing the camera and the axis.
 */
XMLscene.prototype.init = function(application) {
    CGFscene.prototype.init.call(this, application);

    this.initCameras();

    this.enableTextures(true);

    this.gl.clearDepth(100.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.depthFunc(this.gl.LEQUAL);

    this.axis = new CGFaxis(this);

    // Shader declaration.
    this.shaders = {default: this.defaultShader,
                    rgb: new CGFshader(this.gl, 'shaders/rgb.vert', 'shaders/rgb.frag')};

    this.shaders['rgb'].setUniformsValues({time_factor: 1});

    this.setUpdatePeriod(60);
}

/**
 * Initializes the scene lights with the values read from the LSX file.
 */
XMLscene.prototype.initLights = function() {
    var i = 0;
    // Lights index.

    // Reads the lights from the scene graph.
    for (var key in this.graph.lights) {
        if (i >= 8)
            break;              // Only eight lights allowed by WebGL.

        if (this.graph.lights.hasOwnProperty(key)) {
            var light = this.graph.lights[key];

            this.lights[i].setPosition(light[1][0], light[1][1], light[1][2], light[1][3]);
            this.lights[i].setAmbient(light[2][0], light[2][1], light[2][2], light[2][3]);
            this.lights[i].setDiffuse(light[3][0], light[3][1], light[3][2], light[3][3]);
            this.lights[i].setSpecular(light[4][0], light[4][1], light[4][2], light[4][3]);

            this.lights[i].setVisible(true);
            if (light[0])
                this.lights[i].enable();
            else
                this.lights[i].disable();

            this.lights[i].update();

            i++;
        }
    }

}

/**
 * Initializes the scene cameras.
 */
XMLscene.prototype.initCameras = function() {
    this.camera = new CGFcamera(0.4,0.1,500,vec3.fromValues(15, 15, 15),vec3.fromValues(0, 0, 0));
}

/* Handler called when the graph is finally loaded.
 * As loading is asynchronous, this may be called already after the application has started the run loop
 */
XMLscene.prototype.onGraphLoaded = function()
{
    this.camera.near = this.graph.near;
    this.camera.far = this.graph.far;
    this.axis = new CGFaxis(this,this.graph.referenceLength);

    this.setGlobalAmbientLight(this.graph.ambientIllumination[0], this.graph.ambientIllumination[1],
    this.graph.ambientIllumination[2], this.graph.ambientIllumination[3]);

    this.gl.clearColor(this.graph.background[0], this.graph.background[1], this.graph.background[2], this.graph.background[3]);

    this.initLights();

    // Adds lights group.
    this.interface.addLightsGroup(this.graph.lights);
    this.interface.add_selected_group(this.graph.nodes);
    this.interface.add_shader_group(this.shaders);
}

/* Triggered when the user changes the scale factor on the interface. */
XMLscene.prototype.update_scale_factor = function(scale_factor) {
    this.shaders['rgb'].setUniformsValues({normScale: scale_factor});
}

/* Automatically updates the scale factor. */
XMLscene.prototype.oscillate_scale_factor = function(scale_factor) {
    this.shaders['rgb'].setUniformsValues({amplitude: scale_factor});
}

/* Automatically updates the selected shader's color. */
XMLscene.prototype.oscillate_color = function(color) {
    this.shaders['rgb'].setUniformsValues({rgb_r: color.r / 255});
    this.shaders['rgb'].setUniformsValues({rgb_g: color.g / 255});
    this.shaders['rgb'].setUniformsValues({rgb_b: color.b / 255});
}

/* Generates a new color on the rainbow spectrum. */
XMLscene.prototype.generate_next_color = function() {
    let rgb_r = Math.sin(this.rgb_cycling * this.rainbow_index) * 127 + 128;
    let rgb_g = Math.sin(this.rgb_cycling * this.rainbow_index + 2) * 127 + 128;
    let rgb_b = Math.sin(this.rgb_cycling * this.rainbow_index + 4) * 127 + 128;

    this.rainbow_index++;
    return {r: rgb_r, g: rgb_g, b: rgb_b};
}

/* Toggles RGB cycling. Kinda dumb, but I REALLY wanted a button on the interface. */
XMLscene.prototype.toggle_rgb_cycling = function() {
    this.is_cycling = !this.is_cycling;
}

/* Automatically called, calculates the elapsed time between the last tick. */
XMLscene.prototype.update = function(tick) {
    
    this.oscillate_scale_factor((1 + Math.sin(this.elapsed_ticks)) / 2);
    
    if (this.is_cycling) {
        let color = this.generate_next_color();
        this.oscillate_color(color);
    } else {

        this.oscillate_color(this.solid_color);
    }

    let ms_tick_interval = (tick - this.last_tick) / 1000;

    if (this.graph.loadedOk)
        this.graph.tick = ms_tick_interval;

    this.elapsed_ticks += ms_tick_interval;
    this.last_tick = tick;
    return;
}



/**
 * Displays the scene.
 */
XMLscene.prototype.display = function() {
    
    // ---- BEGIN Background, camera and axis setup

    // Clear image and depth buffer everytime we update the scene
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Initialize Model-View matrix as identity (no transformation
    this.updateProjectionMatrix();
    this.loadIdentity();

    // Apply transformations corresponding to the camera position relative to the origin
    this.applyViewMatrix();

    this.pushMatrix();

    if (this.graph.loadedOk)
    {
        // Applies initial transformations.
        this.multMatrix(this.graph.initialTransforms);

		// Draw axis
		this.axis.display();

        var i = 0;
        for (var key in this.lightValues) {
            if (this.lightValues.hasOwnProperty(key)) {
                if (this.lightValues[key]) {
                    this.lights[i].setVisible(true);
                    this.lights[i].enable();
                }
                else {
                    this.lights[i].setVisible(false);
                    this.lights[i].disable();
                }
                this.lights[i].update();
                i++;
            }
        }

        // Displays the scene.
        this.graph.displayScene();

    }
	else
	{
		// Draw axis
		this.axis.display();
	}


    this.popMatrix();

    // ---- END Background, camera and axis setup

}
