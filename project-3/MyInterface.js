 /**
 * MyInterface class, creating a GUI interface.
 * @constructor
 */
function MyInterface() {
    //call CGFinterface constructor 
    CGFinterface.call(this);
}
;

MyInterface.prototype = Object.create(CGFinterface.prototype);
MyInterface.prototype.constructor = MyInterface;

/**
 * Initializes the interface.
 * @param {CGFapplication} application
 */
MyInterface.prototype.init = function(application) {
    // call CGFinterface init
    CGFinterface.prototype.init.call(this, application);

    // init GUI. For more information on the methods, check:
    //  http://workshop.chromeexperiments.com/examples/gui
    
    this.gui = new dat.GUI();

    // add a group of controls (and open/expand by default)
    
    return true;
};

/**
 * Adds a folder containing the IDs of the lights passed as parameter.
 */
MyInterface.prototype.addLightsGroup = function(lights) {

    var group = this.gui.addFolder("Lights");
    group.open();

    // add two check boxes to the group. The identifiers must be members variables of the scene initialized in scene.init as boolean
    // e.g. this.option1=true; this.option2=false;

    for (var key in lights) {
        if (lights.hasOwnProperty(key)) {
            this.scene.lightValues[key] = lights[key][0];
            group.add(this.scene.lightValues, key).name(`Light #${key.slice(-1)}`);
        }
    }
}

/* Adds a folder containing the IDs of the nodes marked as selected. */
MyInterface.prototype.add_selected_group = function(nodes) {

    this.shader_properties = this.gui.addFolder('Shaders');
    this.shader_properties.open();

    // Extracts every selectable node.
    let selectables = ['none'];

    for (let node_id in nodes) {
        let values = nodes[node_id];
        
        if (nodes[node_id].selectable)
            selectables.push(node_id);
    }

    // Adds every selectable node ID to the interface.
    this.shader_properties.add(this.scene, 'selected_node', selectables).name('Node');
}

MyInterface.prototype.add_shader_group = function(shaders) {

    let shader_ids = new Array();

    for (let shader_id in shaders)
        shader_ids.push(shader_id);

    // Adds every shader to the interface.
    this.shader_properties.add(this.scene, 'selected_shader', shader_ids).name('Shader');

    this.shader_properties.add(this.scene, 'scale_factor', -10, 10).name('Scale Factor').onChange(scale_factor => {
        this.scene.update_scale_factor(scale_factor);
    });

    let rgb_folder = this.shader_properties.addFolder('RGB');
    rgb_folder.open();

    rgb_folder.add(this.scene, 'toggle_rgb_cycling').name('Animate!');
    rgb_folder.add(this.scene, 'rgb_cycling', 0, 1).name('Frequency');
    rgb_folder.addColor(this.scene, 'solid_color').name('Solid Color');

}

