var DEGREE_TO_RAD = Math.PI / 180;

// Order of the groups in the XML document.
var INITIALS_INDEX = 0;
var ILLUMINATION_INDEX = 1;
var LIGHTS_INDEX = 2;
var TEXTURES_INDEX = 3;
var MATERIALS_INDEX = 4;
var ANIMATIONS_INDEX = 5;
var NODES_INDEX = 6;

/**
 * MySceneGraph class, representing the scene graph.
 * @constructor
 */
 function MySceneGraph(filename, scene) {
    this.loadedOk = null;

    // Establish bidirectional references between scene and graph.
    this.scene = scene;
    scene.graph = this;
    save_graph(scene.graph);

    this.all_seats = this.fill_seat_matrix();
    this.all_teacups = this.fill_teacup_matrix();

    this.nodes = [];
    this.cpoints = [];
    this.teacups_green = [];
    this.teacups_black = [];
    this.black_index = 0;
    this.green_index = 0;

    this.idRoot = null; // The id of the root element.

    this.axisCoords = [];
    this.axisCoords['x'] = [1, 0, 0];
    this.axisCoords['y'] = [0, 1, 0];
    this.axisCoords['z'] = [0, 0, 1];

    // File reading
    this.reader = new CGFXMLreader();

    /*
	 * Read the contents of the xml file, and refer to this class for loading and error handlers.
	 * After the file is read, the reader calls onXMLReady on this object.
	 * If any error occurs, the reader calls onXMLError on this object, with an error message
	 */

    this.reader.open('scenes/' + filename, this);

    this.tick = 0;
}

/*
 * Callback to be executed after successful reading
 */
 MySceneGraph.prototype.onXMLReady = function()
 {
    console.log("XML Loading finished.");
    var rootElement = this.reader.xmlDoc.documentElement;

    // Here should go the calls for different functions to parse the various blocks
    var error = this.parseLSXFile(rootElement);

    if (error != null ) {
        this.onXMLError(error);
        return;
    }

    this.loadedOk = true;

    // As the graph loaded ok, signal the scene so that any additional initialization depending on the graph can take place
    this.scene.onGraphLoaded();
}

/**
 * Parses the LSX file, processing each block.
 */
 MySceneGraph.prototype.parseLSXFile = function(rootElement) {
    if (rootElement.nodeName != "SCENE")
        return "root tag <SCENE> missing";

    var nodes = rootElement.children;

    // Reads the names of the nodes to an auxiliary buffer.
    var nodeNames = [];

    for (var i = 0; i < nodes.length; i++) {
        nodeNames.push(nodes[i].nodeName);
    }

    var error;

    // Processes each node, verifying errors.

    // <INITIALS>
    var index;
    if ((index = nodeNames.indexOf("INITIALS")) == -1)
        return "tag <INITIALS> missing";
    else {
        if (index != INITIALS_INDEX)
            this.onXMLMinorError("tag <INITIALS> out of order");

        if ((error = this.parseInitials(nodes[index])) != null )
            return error;
    }

    // <ILLUMINATION>
    if ((index = nodeNames.indexOf("ILLUMINATION")) == -1)
        return "tag <ILLUMINATION> missing";
    else {
        if (index != ILLUMINATION_INDEX)
            this.onXMLMinorError("tag <ILLUMINATION> out of order");

        if ((error = this.parseIllumination(nodes[index])) != null )
            return error;
    }

    // <LIGHTS>
    if ((index = nodeNames.indexOf("LIGHTS")) == -1)
        return "tag <LIGHTS> missing";
    else {
        if (index != LIGHTS_INDEX)
            this.onXMLMinorError("tag <LIGHTS> out of order");

        if ((error = this.parseLights(nodes[index])) != null )
            return error;
    }

    // <TEXTURES>
    if ((index = nodeNames.indexOf("TEXTURES")) == -1)
        return "tag <TEXTURES> missing";
    else {
        if (index != TEXTURES_INDEX)
            this.onXMLMinorError("tag <TEXTURES> out of order");

        if ((error = this.parseTextures(nodes[index])) != null )
            return error;
    }

    // <MATERIALS>
    if ((index = nodeNames.indexOf("MATERIALS")) == -1)
        return "tag <MATERIALS> missing";
    else {
        if (index != MATERIALS_INDEX)
            this.onXMLMinorError("tag <MATERIALS> out of order");

        if ((error = this.parseMaterials(nodes[index])) != null )
            return error;
    }

    // <ANIMATIONS>
    if ((index = nodeNames.indexOf("ANIMATIONS")) == -1)
        return "tag <ANIMATIONS> missing";
    else {
        if (index != ANIMATIONS_INDEX)
            this.onXMLMinorError("tag <ANIMATIONS> out of order");

        if ((error = this.parseAnimations(nodes[index])) != null)
            return error;
    }

    // <NODES>
    if ((index = nodeNames.indexOf("NODES")) == -1)
        return "tag <NODES> missing";
    else {
        if (index != NODES_INDEX)
            this.onXMLMinorError("tag <NODES> out of order");

        if ((error = this.parseNodes(nodes[index])) != null )
            return error;
    }

}

/**
 * Parses the <INITIALS> block.
 */
 MySceneGraph.prototype.parseInitials = function(initialsNode) {

    var children = initialsNode.children;

    var nodeNames = [];

    for (var i = 0; i < children.length; i++)
        nodeNames.push(children[i].nodeName);

    // Frustum planes.
    this.near = 0.1;
    this.far = 1000;
    var indexFrustum = nodeNames.indexOf("frustum");
    if (indexFrustum == -1) {
        this.onXMLMinorError("frustum planes missing; assuming 'near = 0.1' and 'far = 500'");
    }
    else {
        this.near = this.reader.getFloat(children[indexFrustum], 'near');
        this.far = this.reader.getFloat(children[indexFrustum], 'far');

        if (this.near == null ) {
            this.near = 0.1;
            this.onXMLMinorError("unable to parse value for near plane; assuming 'near = 0.1'");
        }
        else if (this.far == null ) {
            this.far = 500;
            this.onXMLMinorError("unable to parse value for far plane; assuming 'far = 500'");
        }
        else if (isNaN(this.near)) {
            this.near = 0.1;
            this.onXMLMinorError("non-numeric value found for near plane; assuming 'near = 0.1'");
        }
        else if (isNaN(this.far)) {
            this.far = 500;
            this.onXMLMinorError("non-numeric value found for far plane; assuming 'far = 500'");
        }
        else if (this.near <= 0) {
            this.near = 0.1;
            this.onXMLMinorError("'near' must be positive; assuming 'near = 0.1'");
        }

        if (this.near >= this.far)
            return "'near' must be smaller than 'far'";
    }

    // Checks if at most one translation, three rotations, and one scaling are defined.
    if (initialsNode.getElementsByTagName('translation').length > 1)
        return "no more than one initial translation may be defined";

    if (initialsNode.getElementsByTagName('rotation').length > 3)
        return "no more than three initial rotations may be defined";

    if (initialsNode.getElementsByTagName('scale').length > 1)
        return "no more than one scaling may be defined";

    // Initial transforms.
    this.initialTranslate = [];
    this.initialScaling = [];
    this.initialRotations = [];

    // Gets indices of each element.
    var translationIndex = nodeNames.indexOf("translation");
    var thirdRotationIndex = nodeNames.indexOf("rotation");
    var secondRotationIndex = nodeNames.indexOf("rotation", thirdRotationIndex + 1);
    var firstRotationIndex = nodeNames.lastIndexOf("rotation");
    var scalingIndex = nodeNames.indexOf("scale");

    // Checks if the indices are valid and in the expected order.
    // Translation.
    this.initialTransforms = mat4.create();
    mat4.identity(this.initialTransforms);
    if (translationIndex == -1)
        this.onXMLMinorError("initial translation undefined; assuming T = (0, 0, 0)");
    else {
        var tx = this.reader.getFloat(children[translationIndex], 'x');
        var ty = this.reader.getFloat(children[translationIndex], 'y');
        var tz = this.reader.getFloat(children[translationIndex], 'z');

        if (tx == null ) {
            tx = 0;
            this.onXMLMinorError("failed to parse x-coordinate of initial translation; assuming tx = 0");
        }
        else if (isNaN(tx)) {
            tx = 0;
            this.onXMLMinorError("found non-numeric value for x-coordinate of initial translation; assuming tx = 0");
        }

        if (ty == null ) {
            ty = 0;
            this.onXMLMinorError("failed to parse y-coordinate of initial translation; assuming ty = 0");
        }
        else if (isNaN(ty)) {
            ty = 0;
            this.onXMLMinorError("found non-numeric value for y-coordinate of initial translation; assuming ty = 0");
        }

        if (tz == null ) {
            tz = 0;
            this.onXMLMinorError("failed to parse z-coordinate of initial translation; assuming tz = 0");
        }
        else if (isNaN(tz)) {
            tz = 0;
            this.onXMLMinorError("found non-numeric value for z-coordinate of initial translation; assuming tz = 0");
        }

        if (translationIndex > thirdRotationIndex || translationIndex > scalingIndex)
            this.onXMLMinorError("initial translation out of order; result may not be as expected");

        mat4.translate(this.initialTransforms, this.initialTransforms, [tx, ty, tz]);
    }

    // Rotations.
    var initialRotations = [];
    initialRotations['x'] = 0;
    initialRotations['y'] = 0;
    initialRotations['z'] = 0;

    var rotationDefined = [];
    rotationDefined['x'] = false;
    rotationDefined['y'] = false;
    rotationDefined['z'] = false;

    var axis;
    var rotationOrder = [];

    // Third rotation (first rotation defined).
    if (thirdRotationIndex != -1) {
        axis = this.reader.getItem(children[thirdRotationIndex], 'axis', ['x', 'y', 'z']);
        if (axis != null ) {
            var angle = this.reader.getFloat(children[thirdRotationIndex], 'angle');
            if (angle != null && !isNaN(angle)) {
                initialRotations[axis] += angle;
                if (!rotationDefined[axis])
                    rotationOrder.push(axis);
                rotationDefined[axis] = true;
            }
            else this.onXMLMinorError("failed to parse third initial rotation 'angle'");
        }
    }

    // Second rotation.
    if (secondRotationIndex != -1) {
        axis = this.reader.getItem(children[secondRotationIndex], 'axis', ['x', 'y', 'z']);
        if (axis != null ) {
            var angle = this.reader.getFloat(children[secondRotationIndex], 'angle');
            if (angle != null && !isNaN(angle)) {
                initialRotations[axis] += angle;
                if (!rotationDefined[axis])
                    rotationOrder.push(axis);
                rotationDefined[axis] = true;
            }
            else this.onXMLMinorError("failed to parse second initial rotation 'angle'");
        }
    }

    // First rotation.
    if (firstRotationIndex != -1) {
        axis = this.reader.getItem(children[firstRotationIndex], 'axis', ['x', 'y', 'z']);
        if (axis != null ) {
            var angle = this.reader.getFloat(children[firstRotationIndex], 'angle');
            if (angle != null && !isNaN(angle)) {
                initialRotations[axis] += angle;
                if (!rotationDefined[axis])
                    rotationOrder.push(axis);
                rotationDefined[axis] = true;
            }
            else this.onXMLMinorError("failed to parse first initial rotation 'angle'");
        }
    }

    // Checks for undefined rotations.
    if (!rotationDefined['x'])
        this.onXMLMinorError("rotation along the Ox axis undefined; assuming Rx = 0");
    else if (!rotationDefined['y'])
        this.onXMLMinorError("rotation along the Oy axis undefined; assuming Ry = 0");
    else if (!rotationDefined['z'])
        this.onXMLMinorError("rotation along the Oz axis undefined; assuming Rz = 0");

    // Updates transform matrix.
    for (var i = 0; i < rotationOrder.length; i++)
        mat4.rotate(this.initialTransforms, this.initialTransforms, DEGREE_TO_RAD * initialRotations[rotationOrder[i]], this.axisCoords[rotationOrder[i]]);

    // Scaling.
    if (scalingIndex == -1)
        this.onXMLMinorError("initial scaling undefined; assuming S = (1, 1, 1)");
    else {
        var sx = this.reader.getFloat(children[scalingIndex], 'sx');
        var sy = this.reader.getFloat(children[scalingIndex], 'sy');
        var sz = this.reader.getFloat(children[scalingIndex], 'sz');

        if (sx == null ) {
            sx = 1;
            this.onXMLMinorError("failed to parse x parameter of initial scaling; assuming sx = 1");
        }
        else if (isNaN(sx)) {
            sx = 1;
            this.onXMLMinorError("found non-numeric value for x parameter of initial scaling; assuming sx = 1");
        }

        if (sy == null ) {
            sy = 1;
            this.onXMLMinorError("failed to parse y parameter of initial scaling; assuming sy = 1");
        }
        else if (isNaN(sy)) {
            sy = 1;
            this.onXMLMinorError("found non-numeric value for y parameter of initial scaling; assuming sy = 1");
        }

        if (sz == null ) {
            sz = 1;
            this.onXMLMinorError("failed to parse z parameter of initial scaling; assuming sz = 1");
        }
        else if (isNaN(sz)) {
            sz = 1;
            this.onXMLMinorError("found non-numeric value for z parameter of initial scaling; assuming sz = 1");
        }

        if (scalingIndex < firstRotationIndex)
            this.onXMLMinorError("initial scaling out of order; result may not be as expected");

        mat4.scale(this.initialTransforms, this.initialTransforms, [sx, sy, sz]);
    }

    // ----------
    // Reference length.
    this.referenceLength = 1;

    var indexReference = nodeNames.indexOf("reference");
    if (indexReference == -1)
        this.onXMLMinorError("reference length undefined; assuming 'length = 1'");
    else {
        // Reads the reference length.
        var length = this.reader.getFloat(children[indexReference], 'length');

        if (length != null ) {
            if (isNaN(length))
                this.onXMLMinorError("found non-numeric value for reference length; assuming 'length = 1'");
            else if (length <= 0)
                this.onXMLMinorError("reference length must be a positive value; assuming 'length = 1'");
            else
                this.referenceLength = length;
        }
        else
            this.onXMLMinorError("unable to parse reference length; assuming 'length = 1'");

    }

    console.log("Parsed initials");

    return null ;
}

/**
 * Parses the <ILLUMINATION> block.
 */
 MySceneGraph.prototype.parseIllumination = function(illuminationNode) {

    // Reads the ambient and background values.
    var children = illuminationNode.children;
    var nodeNames = [];
    for (var i = 0; i < children.length; i++)
        nodeNames.push(children[i].nodeName);

    // Retrieves the global ambient illumination.
    this.ambientIllumination = [0, 0, 0, 1];
    var ambientIndex = nodeNames.indexOf("ambient");
    if (ambientIndex != -1) {
        // R.
        var r = this.reader.getFloat(children[ambientIndex], 'r');
        if (r != null ) {
            if (isNaN(r))
                return "ambient 'r' is a non numeric value on the ILLUMINATION block";
            else if (r < 0 || r > 1)
                return "ambient 'r' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.ambientIllumination[0] = r;
        }
        else
            this.onXMLMinorError("unable to parse R component of the ambient illumination; assuming R = 0");

        // G.
        var g = this.reader.getFloat(children[ambientIndex], 'g');
        if (g != null ) {
            if (isNaN(g))
                return "ambient 'g' is a non numeric value on the ILLUMINATION block";
            else if (g < 0 || g > 1)
                return "ambient 'g' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.ambientIllumination[1] = g;
        }
        else
            this.onXMLMinorError("unable to parse G component of the ambient illumination; assuming G = 0");

        // B.
        var b = this.reader.getFloat(children[ambientIndex], 'b');
        if (b != null ) {
            if (isNaN(b))
                return "ambient 'b' is a non numeric value on the ILLUMINATION block";
            else if (b < 0 || b > 1)
                return "ambient 'b' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.ambientIllumination[2] = b;
        }
        else
            this.onXMLMinorError("unable to parse B component of the ambient illumination; assuming B = 0");

        // A.
        var a = this.reader.getFloat(children[ambientIndex], 'a');
        if (a != null ) {
            if (isNaN(a))
                return "ambient 'a' is a non numeric value on the ILLUMINATION block";
            else if (a < 0 || a > 1)
                return "ambient 'a' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.ambientIllumination[3] = a;
        }
        else
            this.onXMLMinorError("unable to parse A component of the ambient illumination; assuming A = 1");
    }
    else
        this.onXMLMinorError("global ambient illumination undefined; assuming Ia = (0, 0, 0, 1)");

    // Retrieves the background clear color.
    this.background = [0, 0, 0, 1];
    var backgroundIndex = nodeNames.indexOf("background");
    if (backgroundIndex != -1) {
        // R.
        var r = this.reader.getFloat(children[backgroundIndex], 'r');
        if (r != null ) {
            if (isNaN(r))
                return "background 'r' is a non numeric value on the ILLUMINATION block";
            else if (r < 0 || r > 1)
                return "background 'r' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.background[0] = r;
        }
        else
            this.onXMLMinorError("unable to parse R component of the background colour; assuming R = 0");

        // G.
        var g = this.reader.getFloat(children[backgroundIndex], 'g');
        if (g != null ) {
            if (isNaN(g))
                return "background 'g' is a non numeric value on the ILLUMINATION block";
            else if (g < 0 || g > 1)
                return "background 'g' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.background[1] = g;
        }
        else
            this.onXMLMinorError("unable to parse G component of the background colour; assuming G = 0");

        // B.
        var b = this.reader.getFloat(children[backgroundIndex], 'b');
        if (b != null ) {
            if (isNaN(b))
                return "background 'b' is a non numeric value on the ILLUMINATION block";
            else if (b < 0 || b > 1)
                return "background 'b' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.background[2] = b;
        }
        else
            this.onXMLMinorError("unable to parse B component of the background colour; assuming B = 0");

        // A.
        var a = this.reader.getFloat(children[backgroundIndex], 'a');
        if (a != null ) {
            if (isNaN(a))
                return "background 'a' is a non numeric value on the ILLUMINATION block";
            else if (a < 0 || a > 1)
                return "background 'a' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.background[3] = a;
        }
        else
            this.onXMLMinorError("unable to parse A component of the background colour; assuming A = 1");
    }
    else
        this.onXMLMinorError("background clear colour undefined; assuming (R, G, B, A) = (0, 0, 0, 1)");

    console.log("Parsed illumination");

    return null ;
}

/**
 * Parses the <LIGHTS> node.
 */
 MySceneGraph.prototype.parseLights = function(lightsNode) {

    var children = lightsNode.children;

    this.lights = [];
    var numLights = 0;

    var grandChildren = [];
    var nodeNames = [];

    // Any number of lights.
    for (var i = 0; i < children.length; i++) {

        if (children[i].nodeName != "LIGHT") {
            this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
            continue;
        }

        // Get id of the current light.
        var lightId = this.reader.getString(children[i], 'id');
        if (lightId == null )
            return "no ID defined for light";

        // Checks for repeated IDs.
        if (this.lights[lightId] != null )
            return "ID must be unique for each light (conflict: ID = " + lightId + ")";

        grandChildren = children[i].children;
        // Specifications for the current light.

        nodeNames = [];
        for (var j = 0; j < grandChildren.length; j++) {
            console.log(grandChildren[j].nodeName);
            nodeNames.push(grandChildren[j].nodeName);
        }

        // Gets indices of each element.
        var enableIndex = nodeNames.indexOf("enable");
        var positionIndex = nodeNames.indexOf("position");
        var ambientIndex = nodeNames.indexOf("ambient");
        var diffuseIndex = nodeNames.indexOf("diffuse");
        var specularIndex = nodeNames.indexOf("specular");

        // Light enable/disable
        var enableLight = true;
        if (enableIndex == -1) {
            this.onXMLMinorError("enable value missing for ID = " + lightId + "; assuming 'value = 1'");
        }
        else {
            var aux = this.reader.getFloat(grandChildren[enableIndex], 'value');
            if (aux == null ) {
                this.onXMLMinorError("unable to parse value component of the 'enable light' field for ID = " + lightId + "; assuming 'value = 1'");
            }
            else if (isNaN(aux))
                return "'enable value' is a non numeric value on the LIGHTS block";
            else if (aux != 0 &&     aux != 1)
                return "'enable value' must be 0 or 1 on the LIGHTS block"
            else
                enableLight = aux == 0 ? false : true;
        }

        // Retrieves the light position.
        var positionLight = [];
        if (positionIndex != -1) {
            // x
            var x = this.reader.getFloat(grandChildren[positionIndex], 'x');
            if (x != null ) {
                if (isNaN(x))
                    return "'x' is a non numeric value on the LIGHTS block";
                else
                    positionLight.push(x);
            }
            else
                return "unable to parse x-coordinate of the light position for ID = " + lightId;

            // y
            var y = this.reader.getFloat(grandChildren[positionIndex], 'y');
            if (y != null ) {
                if (isNaN(y))
                    return "'y' is a non numeric value on the LIGHTS block";
                else
                    positionLight.push(y);
            }
            else
                return "unable to parse y-coordinate of the light position for ID = " + lightId;

            // z
            var z = this.reader.getFloat(grandChildren[positionIndex], 'z');
            if (z != null ) {
                if (isNaN(z))
                    return "'z' is a non numeric value on the LIGHTS block";
                else
                    positionLight.push(z);
            }
            else
                return "unable to parse z-coordinate of the light position for ID = " + lightId;

            // w
            var w = this.reader.getFloat(grandChildren[positionIndex], 'w');
            if (w != null ) {
                if (isNaN(w))
                    return "'w' is a non numeric value on the LIGHTS block";
                else if (w < 0 || w > 1)
                    return "'w' must be a value between 0 and 1 on the LIGHTS block"
                else
                    positionLight.push(w);
            }
            else
                return "unable to parse w-coordinate of the light position for ID = " + lightId;
        }
        else
            return "light position undefined for ID = " + lightId;

        // Retrieves the ambient component.
        var ambientIllumination = [];
        if (ambientIndex != -1) {
            // R
            var r = this.reader.getFloat(grandChildren[ambientIndex], 'r');
            if (r != null ) {
                if (isNaN(r))
                    return "ambient 'r' is a non numeric value on the LIGHTS block";
                else if (r < 0 || r > 1)
                    return "ambient 'r' must be a value between 0 and 1 on the LIGHTS block"
                else
                    ambientIllumination.push(r);
            }
            else
                return "unable to parse R component of the ambient illumination for ID = " + lightId;

            // G
            var g = this.reader.getFloat(grandChildren[ambientIndex], 'g');
            if (g != null ) {
                if (isNaN(g))
                    return "ambient 'g' is a non numeric value on the LIGHTS block";
                else if (g < 0 || g > 1)
                    return "ambient 'g' must be a value between 0 and 1 on the LIGHTS block"
                else
                    ambientIllumination.push(g);
            }
            else
                return "unable to parse G component of the ambient illumination for ID = " + lightId;

            // B
            var b = this.reader.getFloat(grandChildren[ambientIndex], 'b');
            if (b != null ) {
                if (isNaN(b))
                    return "ambient 'b' is a non numeric value on the LIGHTS block";
                else if (b < 0 || b > 1)
                    return "ambient 'b' must be a value between 0 and 1 on the LIGHTS block"
                else
                    ambientIllumination.push(b);
            }
            else
                return "unable to parse B component of the ambient illumination for ID = " + lightId;

            // A
            var a = this.reader.getFloat(grandChildren[ambientIndex], 'a');
            if (a != null ) {
                if (isNaN(a))
                    return "ambient 'a' is a non numeric value on the LIGHTS block";
                else if (a < 0 || a > 1)
                    return "ambient 'a' must be a value between 0 and 1 on the LIGHTS block"
                ambientIllumination.push(a);
            }
            else
                return "unable to parse A component of the ambient illumination for ID = " + lightId;
        }
        else
            return "ambient component undefined for ID = " + lightId;

        // Retrieves the diffuse component
        var diffuseIllumination = [];
        if (diffuseIndex != -1) {
            // R
            var r = this.reader.getFloat(grandChildren[diffuseIndex], 'r');
            if (r != null ) {
                if (isNaN(r))
                    return "diffuse 'r' is a non numeric value on the LIGHTS block";
                else if (r < 0 || r > 1)
                    return "diffuse 'r' must be a value between 0 and 1 on the LIGHTS block"
                else
                    diffuseIllumination.push(r);
            }
            else
                return "unable to parse R component of the diffuse illumination for ID = " + lightId;

            // G
            var g = this.reader.getFloat(grandChildren[diffuseIndex], 'g');
            if (g != null ) {
                if (isNaN(g))
                    return "diffuse 'g' is a non numeric value on the LIGHTS block";
                else if (g < 0 || g > 1)
                    return "diffuse 'g' must be a value between 0 and 1 on the LIGHTS block"
                else
                    diffuseIllumination.push(g);
            }
            else
                return "unable to parse G component of the diffuse illumination for ID = " + lightId;

            // B
            var b = this.reader.getFloat(grandChildren[diffuseIndex], 'b');
            if (b != null ) {
                if (isNaN(b))
                    return "diffuse 'b' is a non numeric value on the LIGHTS block";
                else if (b < 0 || b > 1)
                    return "diffuse 'b' must be a value between 0 and 1 on the LIGHTS block"
                else
                    diffuseIllumination.push(b);
            }
            else
                return "unable to parse B component of the diffuse illumination for ID = " + lightId;

            // A
            var a = this.reader.getFloat(grandChildren[diffuseIndex], 'a');
            if (a != null ) {
                if (isNaN(a))
                    return "diffuse 'a' is a non numeric value on the LIGHTS block";
                else if (a < 0 || a > 1)
                    return "diffuse 'a' must be a value between 0 and 1 on the LIGHTS block"
                else
                    diffuseIllumination.push(a);
            }
            else
                return "unable to parse A component of the diffuse illumination for ID = " + lightId;
        }
        else
            return "diffuse component undefined for ID = " + lightId;

        // Retrieves the specular component
        var specularIllumination = [];
        if (specularIndex != -1) {
            // R
            var r = this.reader.getFloat(grandChildren[specularIndex], 'r');
            if (r != null ) {
                if (isNaN(r))
                    return "specular 'r' is a non numeric value on the LIGHTS block";
                else if (r < 0 || r > 1)
                    return "specular 'r' must be a value between 0 and 1 on the LIGHTS block"
                else
                    specularIllumination.push(r);
            }
            else
                return "unable to parse R component of the specular illumination for ID = " + lightId;

            // G
            var g = this.reader.getFloat(grandChildren[specularIndex], 'g');
            if (g != null ) {
                if (isNaN(g))
                    return "specular 'g' is a non numeric value on the LIGHTS block";
                else if (g < 0 || g > 1)
                    return "specular 'g' must be a value between 0 and 1 on the LIGHTS block"
                else
                    specularIllumination.push(g);
            }
            else
                return "unable to parse G component of the specular illumination for ID = " + lightId;

            // B
            var b = this.reader.getFloat(grandChildren[specularIndex], 'b');
            if (b != null ) {
                if (isNaN(b))
                    return "specular 'b' is a non numeric value on the LIGHTS block";
                else if (b < 0 || b > 1)
                    return "specular 'b' must be a value between 0 and 1 on the LIGHTS block"
                else
                    specularIllumination.push(b);
            }
            else
                return "unable to parse B component of the specular illumination for ID = " + lightId;

            // A
            var a = this.reader.getFloat(grandChildren[specularIndex], 'a');
            if (a != null ) {
                if (isNaN(a))
                    return "specular 'a' is a non numeric value on the LIGHTS block";
                else if (a < 0 || a > 1)
                    return "specular 'a' must be a value between 0 and 1 on the LIGHTS block"
                else
                    specularIllumination.push(a);
            }
            else
                return "unable to parse A component of the specular illumination for ID = " + lightId;
        }
        else
            return "specular component undefined for ID = " + lightId;

        // Light global information.
        this.lights[lightId] = [enableLight, positionLight, ambientIllumination, diffuseIllumination, specularIllumination];
        numLights++;
    }

    if (numLights == 0)
        return "at least one light must be defined";
    else if (numLights > 8)
        this.onXMLMinorError("too many lights defined; WebGL imposes a limit of 8 lights");

    console.log("Parsed lights");

    return null ;
}

/**
 * Parses the <TEXTURES> block.
 */
 MySceneGraph.prototype.parseTextures = function(texturesNode) {

    this.textures = [];

    var eachTexture = texturesNode.children;
    // Each texture.

    var oneTextureDefined = false;

    for (var i = 0; i < eachTexture.length; i++) {
        var nodeName = eachTexture[i].nodeName;
        if (nodeName == "TEXTURE") {
            // Retrieves texture ID.
            var textureID = this.reader.getString(eachTexture[i], 'id');
            if (textureID == null )
                return "failed to parse texture ID";
            // Checks if ID is valid.
            if (this.textures[textureID] != null )
                return "texture ID must unique (conflict with ID = " + textureID + ")";

            var texSpecs = eachTexture[i].children;
            var filepath = null ;
            var amplifFactorS = null ;
            var amplifFactorT = null ;
            // Retrieves texture specifications.
            for (var j = 0; j < texSpecs.length; j++) {
                var name = texSpecs[j].nodeName;
                if (name == "file") {
                    if (filepath != null )
                        return "duplicate file paths in texture with ID = " + textureID;

                    filepath = this.reader.getString(texSpecs[j], 'path');
                    if (filepath == null )
                        return "unable to parse texture file path for ID = " + textureID;
                }
                else if (name == "amplif_factor") {
                    if (amplifFactorS != null  || amplifFactorT != null )
                        return "duplicate amplification factors in texture with ID = " + textureID;

                    amplifFactorS = this.reader.getFloat(texSpecs[j], 's');
                    amplifFactorT = this.reader.getFloat(texSpecs[j], 't');

                    if (amplifFactorS == null  || amplifFactorT == null )
                        return "unable to parse texture amplification factors for ID = " + textureID;
                    else if (isNaN(amplifFactorS))
                        return "'amplifFactorS' is a non numeric value";
                    else if (isNaN(amplifFactorT))
                        return "'amplifFactorT' is a non numeric value";
                    else if (amplifFactorS <= 0 || amplifFactorT <= 0)
                        return "value for amplifFactor must be positive";
                }
                else
                    this.onXMLMinorError("unknown tag name <" + name + ">");
            }

            if (filepath == null )
                return "file path undefined for texture with ID = " + textureID;
            else if (amplifFactorS == null )
                return "s amplification factor undefined for texture with ID = " + textureID;
            else if (amplifFactorT == null )
                return "t amplification factor undefined for texture with ID = " + textureID;

            var texture = new CGFtexture(this.scene,"./scenes/" + filepath);

            this.textures[textureID] = [texture, amplifFactorS, amplifFactorT];
            oneTextureDefined = true;
        }
        else
            this.onXMLMinorError("unknown tag name <" + nodeName + ">");
    }

    if (!oneTextureDefined)
        return "at least one texture must be defined in the TEXTURES block";

    console.log("Parsed textures");
}

/**
 * Parses the <MATERIALS> node.
 */
 MySceneGraph.prototype.parseMaterials = function(materialsNode) {

    var children = materialsNode.children;
    // Each material.

    this.materials = [];

    var oneMaterialDefined = false;

    for (var i = 0; i < children.length; i++) {
        if (children[i].nodeName != "MATERIAL") {
            this.onXMLMinorError("unknown tag name <" + children[i].nodeName + ">");
            continue;
        }

        var materialID = this.reader.getString(children[i], 'id');
        if (materialID == null )
            return "no ID defined for material";

        if (this.materials[materialID] != null )
            return "ID must be unique for each material (conflict: ID = " + materialID + ")";

        var materialSpecs = children[i].children;

        var nodeNames = [];

        for (var j = 0; j < materialSpecs.length; j++)
            nodeNames.push(materialSpecs[j].nodeName);

        // Determines the values for each field.
        // Shininess.
        var shininessIndex = nodeNames.indexOf("shininess");
        if (shininessIndex == -1)
            return "no shininess value defined for material with ID = " + materialID;
        var shininess = this.reader.getFloat(materialSpecs[shininessIndex], 'value');
        if (shininess == null )
            return "unable to parse shininess value for material with ID = " + materialID;
        else if (isNaN(shininess))
            return "'shininess' is a non numeric value";
        else if (shininess <= 0)
            return "'shininess' must be positive";

        // Specular component.
        var specularIndex = nodeNames.indexOf("specular");
        if (specularIndex == -1)
            return "no specular component defined for material with ID = " + materialID;
        var specularComponent = [];
        // R.
        var r = this.reader.getFloat(materialSpecs[specularIndex], 'r');
        if (r == null )
            return "unable to parse R component of specular reflection for material with ID = " + materialID;
        else if (isNaN(r))
            return "specular 'r' is a non numeric value on the MATERIALS block";
        else if (r < 0 || r > 1)
            return "specular 'r' must be a value between 0 and 1 on the MATERIALS block"
        specularComponent.push(r);
        // G.
        var g = this.reader.getFloat(materialSpecs[specularIndex], 'g');
        if (g == null )
           return "unable to parse G component of specular reflection for material with ID = " + materialID;
       else if (isNaN(g))
           return "specular 'g' is a non numeric value on the MATERIALS block";
       else if (g < 0 || g > 1)
           return "specular 'g' must be a value between 0 and 1 on the MATERIALS block";
       specularComponent.push(g);
        // B.
        var b = this.reader.getFloat(materialSpecs[specularIndex], 'b');
        if (b == null )
            return "unable to parse B component of specular reflection for material with ID = " + materialID;
        else if (isNaN(b))
            return "specular 'b' is a non numeric value on the MATERIALS block";
        else if (b < 0 || b > 1)
            return "specular 'b' must be a value between 0 and 1 on the MATERIALS block";
        specularComponent.push(b);
        // A.
        var a = this.reader.getFloat(materialSpecs[specularIndex], 'a');
        if (a == null )
            return "unable to parse A component of specular reflection for material with ID = " + materialID;
        else if (isNaN(a))
            return "specular 'a' is a non numeric value on the MATERIALS block";
        else if (a < 0 || a > 1)
            return "specular 'a' must be a value between 0 and 1 on the MATERIALS block";
        specularComponent.push(a);

        // Diffuse component.
        var diffuseIndex = nodeNames.indexOf("diffuse");
        if (diffuseIndex == -1)
            return "no diffuse component defined for material with ID = " + materialID;
        var diffuseComponent = [];
        // R.
        r = this.reader.getFloat(materialSpecs[diffuseIndex], 'r');
        if (r == null )
            return "unable to parse R component of diffuse reflection for material with ID = " + materialID;
        else if (isNaN(r))
            return "diffuse 'r' is a non numeric value on the MATERIALS block";
        else if (r < 0 || r > 1)
            return "diffuse 'r' must be a value between 0 and 1 on the MATERIALS block";
        diffuseComponent.push(r);
        // G.
        g = this.reader.getFloat(materialSpecs[diffuseIndex], 'g');
        if (g == null )
            return "unable to parse G component of diffuse reflection for material with ID = " + materialID;
        else if (isNaN(g))
            return "diffuse 'g' is a non numeric value on the MATERIALS block";
        else if (g < 0 || g > 1)
            return "diffuse 'g' must be a value between 0 and 1 on the MATERIALS block";
        diffuseComponent.push(g);
        // B.
        b = this.reader.getFloat(materialSpecs[diffuseIndex], 'b');
        if (b == null )
            return "unable to parse B component of diffuse reflection for material with ID = " + materialID;
        else if (isNaN(b))
            return "diffuse 'b' is a non numeric value on the MATERIALS block";
        else if (b < 0 || b > 1)
            return "diffuse 'b' must be a value between 0 and 1 on the MATERIALS block";
        diffuseComponent.push(b);
        // A.
        a = this.reader.getFloat(materialSpecs[diffuseIndex], 'a');
        if (a == null )
            return "unable to parse A component of diffuse reflection for material with ID = " + materialID;
        else if (isNaN(a))
            return "diffuse 'a' is a non numeric value on the MATERIALS block";
        else if (a < 0 || a > 1)
            return "diffuse 'a' must be a value between 0 and 1 on the MATERIALS block";
        diffuseComponent.push(a);

        // Ambient component.
        var ambientIndex = nodeNames.indexOf("ambient");
        if (ambientIndex == -1)
            return "no ambient component defined for material with ID = " + materialID;
        var ambientComponent = [];
        // R.
        r = this.reader.getFloat(materialSpecs[ambientIndex], 'r');
        if (r == null )
            return "unable to parse R component of ambient reflection for material with ID = " + materialID;
        else if (isNaN(r))
            return "ambient 'r' is a non numeric value on the MATERIALS block";
        else if (r < 0 || r > 1)
            return "ambient 'r' must be a value between 0 and 1 on the MATERIALS block";
        ambientComponent.push(r);
        // G.
        g = this.reader.getFloat(materialSpecs[ambientIndex], 'g');
        if (g == null )
            return "unable to parse G component of ambient reflection for material with ID = " + materialID;
        else if (isNaN(g))
            return "ambient 'g' is a non numeric value on the MATERIALS block";
        else if (g < 0 || g > 1)
            return "ambient 'g' must be a value between 0 and 1 on the MATERIALS block";
        ambientComponent.push(g);
        // B.
        b = this.reader.getFloat(materialSpecs[ambientIndex], 'b');
        if (b == null )
         return "unable to parse B component of ambient reflection for material with ID = " + materialID;
     else if (isNaN(b))
         return "ambient 'b' is a non numeric value on the MATERIALS block";
     else if (b < 0 || b > 1)
         return "ambient 'b' must be a value between 0 and 1 on the MATERIALS block";
     ambientComponent.push(b);
        // A.
        a = this.reader.getFloat(materialSpecs[ambientIndex], 'a');
        if (a == null )
            return "unable to parse A component of ambient reflection for material with ID = " + materialID;
        else if (isNaN(a))
            return "ambient 'a' is a non numeric value on the MATERIALS block";
        else if (a < 0 || a > 1)
            return "ambient 'a' must be a value between 0 and 1 on the MATERIALS block";
        ambientComponent.push(a);

        // Emission component.
        var emissionIndex = nodeNames.indexOf("emission");
        if (emissionIndex == -1)
            return "no emission component defined for material with ID = " + materialID;
        var emissionComponent = [];
        // R.
        r = this.reader.getFloat(materialSpecs[emissionIndex], 'r');
        if (r == null )
            return "unable to parse R component of emission for material with ID = " + materialID;
        else if (isNaN(r))
            return "emisson 'r' is a non numeric value on the MATERIALS block";
        else if (r < 0 || r > 1)
            return "emisson 'r' must be a value between 0 and 1 on the MATERIALS block";
        emissionComponent.push(r);
        // G.
        g = this.reader.getFloat(materialSpecs[emissionIndex], 'g');
        if (g == null )
            return "unable to parse G component of emission for material with ID = " + materialID;
        if (isNaN(g))
            return "emisson 'g' is a non numeric value on the MATERIALS block";
        else if (g < 0 || g > 1)
            return "emisson 'g' must be a value between 0 and 1 on the MATERIALS block";
        emissionComponent.push(g);
        // B.
        b = this.reader.getFloat(materialSpecs[emissionIndex], 'b');
        if (b == null )
            return "unable to parse B component of emission for material with ID = " + materialID;
        else if (isNaN(b))
            return "emisson 'b' is a non numeric value on the MATERIALS block";
        else if (b < 0 || b > 1)
            return "emisson 'b' must be a value between 0 and 1 on the MATERIALS block";
        emissionComponent.push(b);
        // A.
        a = this.reader.getFloat(materialSpecs[emissionIndex], 'a');
        if (a == null )
            return "unable to parse A component of emission for material with ID = " + materialID;
        else if (isNaN(a))
            return "emisson 'a' is a non numeric value on the MATERIALS block";
        else if (a < 0 || a > 1)
            return "emisson 'a' must be a value between 0 and 1 on the MATERIALS block";
        emissionComponent.push(a);

        // Creates material with the specified characteristics.
        var newMaterial = new CGFappearance(this.scene);
        newMaterial.setShininess(shininess);
        newMaterial.setAmbient(ambientComponent[0], ambientComponent[1], ambientComponent[2], ambientComponent[3]);
        newMaterial.setDiffuse(diffuseComponent[0], diffuseComponent[1], diffuseComponent[2], diffuseComponent[3]);
        newMaterial.setSpecular(specularComponent[0], specularComponent[1], specularComponent[2], specularComponent[3]);
        newMaterial.setEmission(emissionComponent[0], emissionComponent[1], emissionComponent[2], emissionComponent[3]);
        this.materials[materialID] = newMaterial;
        oneMaterialDefined = true;
    }

    if (!oneMaterialDefined)
        return "at least one material must be defined on the MATERIALS block";

    // Generates a default material.
    this.generateDefaultMaterial();

    console.log("Parsed materials");
}

/**
    Parses the <ANIMATIONS> block.
    Implemented as part of the second project's requirements.
    **/
    MySceneGraph.prototype.parseAnimations = function(animationsNode) {

    // Traverses nodes.
    let children = animationsNode.children;
    this.animations = [];

    for (let i = 0; i < children.length; i++) {

        // Verifies whether the main tag name is ANIMATION.
        if (children[i].nodeName != "ANIMATION") {
            this.onXMLMinorError(`Unknown tag name < ${children[i].nodeName}>!`);
            continue;
        }

        // Extracts ANIMATION tag.
        let animationID = this.reader.getString(children[i], 'id');

        // Checks whether ANIMATION has no ID defined.
        if (animationID == null)
            return "No ID defined for animation!";

        // Checks whether the animation's ID is duplicated.
        if (this.animations[animationID] != null)
            return `ID must be unique for each animation (conflict: ID = ${animationID})!`;

        // Extracts TYPE tag.
        let type = this.reader.getString(children[i], 'type');
        let animation_specs = children[i].children;

        if (type == null)
            return "No TYPE defined for animation!";

        /** LINEAR AND BEZIER type animations handler. **/
        if (type == 'linear' || type == 'bezier') {

            let speed = this.reader.getFloat(children[i], 'speed');

            // Checks whether ANIMATION has no SPEED defined.
            if (speed == null) return "No SPEED defined for animation!";

            let animation_specs = children[i].children;
            let control_points = [];

            // Iterates through every animation descendant.
            for (let i = 0; i < animation_specs.length; i++) {

                // Extracts a single control point.
                if (animation_specs[i].nodeName == 'controlpoint') {

                    let xx = this.reader.getFloat(animation_specs[i], 'xx');
                    if (xx == null) return `Couldn't parse xx component for animation with ID ${animationID}!`;

                    let yy = this.reader.getFloat(animation_specs[i], 'yy');
                    if (yy == null) return `Couldn't parse yy component for animation with ID ${animationID}!`;

                    let zz = this.reader.getFloat(animation_specs[i], 'zz');
                    if (yy == null) return `Couldn't parse zz component for animation with ID ${animationID}!`;

                    control_points.push({x: xx, y: yy, z: zz}); // Creates a new control point object.
                }
                else {
                    this.onXMLMinorError(`Unknown tag <${animation_specs[i].nodeName}>! Skipping...`);
                }
            }

            // Adds the right animation object to the animation list.
            if (type == 'linear') {

                // A line can only be drawn when the parser's able to extract at least 2 control points.
                if (control_points.length < 2)
                    return `Could only parse ${control_points.length} nodes!`;
                
                this.animations[animationID] = new LinearAnimation(control_points, speed);
            }
            if (type == 'bezier') {

                // A bezier curve has exactly 4 points.
                if (control_points.length != 4)
                    return `A bezier curve has 4 points. Found ${control_points.length}!`;

                this.animations[animationID] = new BezierAnimation(control_points, speed);      
            }
        }

        /** CIRCULAR type animations handler. **/
        else if (type == 'circular') {

            // Extracts the SPEED property.
            let speed = this.reader.getFloat(children[i], 'speed');
            if (speed == null) 
                return `No SPEED property defined for animation with ID ${animationID}.`;

            // Extracts the CENTERX property.
            let centerx = this.reader.getFloat(children[i], 'centerx');
            if (centerx == null)
                return `No CENTERX property defined for animation with ID ${animationID}.`;

            // Extracts the CENTERY property.
            let centery = this.reader.getFloat(children[i], 'centery');
            if (centery == null)
                return `No CENTERY property defined for animation with ID ${animationID}.`;

            // Extracts the CENTERZ property.
            let centerz = this.reader.getFloat(children[i], 'centerz');
            if (centerz == null)
                return `No CENTERZ property defined for animation with ID ${animationID}.`;

            // Extracts the RADIUS property.
            let radius = this.reader.getFloat(children[i], 'radius');
            if (radius == null)
                return `No RADIUS property defined for animation with ID ${animationID}.`;

            // Extracts the STARTANG property.
            let startang = this.reader.getFloat(children[i], 'startang');
            if (startang == null)
                return `No STARTANG property defined for animation with ID ${animationID}.`;

            // Extracts the ROTANG property.
            let rotang = this.reader.getFloat(children[i], 'rotang');
            if (rotang == null)
                return `No ROTANG property defined for animation with ID ${animationID}.`;

            // Adds a new circular animation.
            let center = [centerx, centery, centerz]
            this.animations[animationID] = new CircularAnimation(center, radius, startang, rotang, speed);
        }

        /** COMBO type animations handler. **/
        else if (type == 'combo') {
            let animation_specs = children[i].children;

            if (animation_specs.length == 0)
                return `No SPANREF defined for combo animation with ID ${animationID}.`;

            // Aggregates every animation identificator.
            let every_animation = [];

            for (let i = 0; i < animation_specs.length; i++) {
                let anim_ref = this.reader.getString(animation_specs[i], 'id');
                let anim_obj = this.animations[anim_ref].clone();

                // Checks whether there's combo animations inside combo animations.
                if (anim_obj == anim_obj.constructor.name == 'ComboAnimation')
                    return `Combo animation with ID ${animationID} contains at least one combo animation.`;

                every_animation.push(anim_obj);
            }
            this.animations[animationID] = new ComboAnimation(every_animation);
        }
        else
            return "Unknown TYPE defined for this animation!";
    }

}

/**
 * Parses the <NODES> block.
 */
 MySceneGraph.prototype.parseNodes = function(nodesNode) {

    // Traverses nodes.
    var children = nodesNode.children;

    for (var i = 0; i < children.length; i++) {
        var nodeName;
        if ((nodeName = children[i].nodeName) == "ROOT") {

            // Retrieves root node.
            if (this.idRoot != null )
                return "there can only be one root node";
            else {
                var root = this.reader.getString(children[i], 'id');
                if (root == null )
                    return "failed to retrieve root node ID";
                this.idRoot = root;
            }
        }
        else if (nodeName == "NODE") {
            // Retrieves node ID.
            var nodeID = this.reader.getString(children[i], 'id');
            if (nodeID == null )
                return "failed to retrieve node ID";
            // Checks if ID is valid.
            if (this.nodes[nodeID] != null )
                return "node ID must be unique (conflict: ID = " + nodeID + ")";


            // Extracts optional selectable attribute.
            let selectable = this.reader.getBoolean(children[i], 'selectable', false);

            // If selectable does not exist, its default value is false.
            if (selectable == null)
                selectable = false;

            this.log(`Processing node ${nodeID}.`);


            // Creates node.
            this.nodes[nodeID] = new MyGraphNode(this, nodeID);

            // Adds selectable parameter to node object.
            this.nodes[nodeID].selectable = selectable;

            // Gathers child nodes.
            var nodeSpecs = children[i].children;
            var specsNames = [];
            var possibleValues = ["MATERIAL", "TEXTURE", "TRANSLATION", "ROTATION", "SCALE", "ANIMATIONREFS", "DESCENDANTS"];
            for (var j = 0; j < nodeSpecs.length; j++) {
                var name = nodeSpecs[j].nodeName;
                specsNames.push(nodeSpecs[j].nodeName);

                // Warns against possible invalid tag names.
                if (possibleValues.indexOf(name) == -1)
                    this.onXMLMinorError("unknown tag <" + name + ">");
            }

            // Retrieves material ID.
            var materialIndex = specsNames.indexOf("MATERIAL");
            if (materialIndex == -1)
                return "material must be defined (node ID = " + nodeID + ")";
            var materialID = this.reader.getString(nodeSpecs[materialIndex], 'id');
            if (materialID == null )
                return "unable to parse material ID (node ID = " + nodeID + ")";
            if (materialID != "null" && this.materials[materialID] == null )
                return "ID does not correspond to a valid material (node ID = " + nodeID + ")";

            this.nodes[nodeID].materialID = materialID;

            // Retrieves texture ID.
            var textureIndex = specsNames.indexOf("TEXTURE");
            if (textureIndex == -1)
                return "texture must be defined (node ID = " + nodeID + ")";
            var textureID = this.reader.getString(nodeSpecs[textureIndex], 'id');
            if (textureID == null )
                return "unable to parse texture ID (node ID = " + nodeID + ")";
            if (textureID != "null" && textureID != "clear" && this.textures[textureID] == null )
                return "ID does not correspond to a valid texture (node ID = " + nodeID + ")";

            this.nodes[nodeID].textureID = textureID;

            // Retrieves possible transformations.
            for (var j = 0; j < nodeSpecs.length; j++) {
                switch (nodeSpecs[j].nodeName) {
                    case "TRANSLATION":
                    // Retrieves translation parameters.
                    var x = this.reader.getFloat(nodeSpecs[j], 'x');
                    if (x == null ) {
                        this.onXMLMinorError("unable to parse x-coordinate of translation; discarding transform");
                        break;
                    }
                    else if (isNaN(x))
                        return "non-numeric value for x-coordinate of translation (node ID = " + nodeID + ")";

                    var y = this.reader.getFloat(nodeSpecs[j], 'y');
                    if (y == null ) {
                        this.onXMLMinorError("unable to parse y-coordinate of translation; discarding transform");
                        break;
                    }
                    else if (isNaN(y))
                        return "non-numeric value for y-coordinate of translation (node ID = " + nodeID + ")";

                    var z = this.reader.getFloat(nodeSpecs[j], 'z');
                    if (z == null ) {
                        this.onXMLMinorError("unable to parse z-coordinate of translation; discarding transform");
                        break;
                    }
                    else if (isNaN(z))
                        return "non-numeric value for z-coordinate of translation (node ID = " + nodeID + ")";

                    mat4.translate(this.nodes[nodeID].transformMatrix, this.nodes[nodeID].transformMatrix, [x, y, z]);
                    break;
                    case "ROTATION":
                    // Retrieves rotation parameters.
                    var axis = this.reader.getItem(nodeSpecs[j], 'axis', ['x', 'y', 'z']);
                    if (axis == null ) {
                        this.onXMLMinorError("unable to parse rotation axis; discarding transform");
                        break;
                    }
                    var angle = this.reader.getFloat(nodeSpecs[j], 'angle');
                    if (angle == null ) {
                        this.onXMLMinorError("unable to parse rotation angle; discarding transform");
                        break;
                    }
                    else if (isNaN(angle))
                        return "non-numeric value for rotation angle (node ID = " + nodeID + ")";

                    mat4.rotate(this.nodes[nodeID].transformMatrix, this.nodes[nodeID].transformMatrix, angle * DEGREE_TO_RAD, this.axisCoords[axis]);
                    break;
                    case "SCALE":
                    // Retrieves scale parameters.
                    var sx = this.reader.getFloat(nodeSpecs[j], 'sx');
                    if (sx == null ) {
                        this.onXMLMinorError("unable to parse x component of scaling; discarding transform");
                        break;
                    }
                    else if (isNaN(sx))
                        return "non-numeric value for x component of scaling (node ID = " + nodeID + ")";

                    var sy = this.reader.getFloat(nodeSpecs[j], 'sy');
                    if (sy == null ) {
                        this.onXMLMinorError("unable to parse y component of scaling; discarding transform");
                        break;
                    }
                    else if (isNaN(sy))
                        return "non-numeric value for y component of scaling (node ID = " + nodeID + ")";

                    var sz = this.reader.getFloat(nodeSpecs[j], 'sz');
                    if (sz == null ) {
                        this.onXMLMinorError("unable to parse z component of scaling; discarding transform");
                        break;
                    }
                    else if (isNaN(sz))
                        return "non-numeric value for z component of scaling (node ID = " + nodeID + ")";

                    mat4.scale(this.nodes[nodeID].transformMatrix, this.nodes[nodeID].transformMatrix, [sx, sy, sz]);
                    break;
                    default:
                    break;
                }
            }

            /**
                Retrieves animation references.
                **/
                let animations_ref_index = specsNames.indexOf('ANIMATIONREFS');

                if (animations_ref_index != -1) {
                    let animation_refs = nodeSpecs[animations_ref_index].children;

                    let node_animations = [];

                    for (let i = 0; i < animation_refs.length; i++) {
                        if (animation_refs[i].nodeName == 'ANIMATIONREF'){
                            let anim_id = this.reader.getString(animation_refs[i], 'id');

                        // Checks whether the provided animation ID maps to an existing one.
                        if (this.animations[anim_id] == null)
                            return `Couldn't find animation ID ${anim_id} on node ${nodeID}!`;
                        
                        let anim_obj = this.animations[anim_id].clone(); // Clones the animation object for each node.
                        node_animations.push(anim_obj); // Stores in full animations array.
                    }
                }
                this.nodes[nodeID].animations = node_animations;
            }

            // Retrieves information about children.
            var descendantsIndex = specsNames.indexOf("DESCENDANTS");
            if (descendantsIndex == -1)
                return "an intermediate node must have descendants";

            var descendants = nodeSpecs[descendantsIndex].children;

            var sizeChildren = 0;
            for (var j = 0; j < descendants.length; j++) {
                if (descendants[j].nodeName == "NODEREF")
                {

                 var curId = this.reader.getString(descendants[j], 'id');

                 this.log("   Descendant: "+curId);

                 if (curId == null )
                    this.onXMLMinorError("unable to parse descendant id");
                else if (curId == nodeID)
                    return "a node may not be a child of its own";
                else {
                    this.nodes[nodeID].addChild(curId);
                    sizeChildren++;
                }
            }
            else
             if (descendants[j].nodeName == "LEAF") {

                var type = this.reader.getItem(descendants[j], 'type', ['rectangle', 'cylinder', 'sphere', 'triangle', 'circle', 'patch']);

            // Handles the CPLINE tag and its descendants.
            if (type == 'patch') {
              var cplines = descendants[j].children;

              for (let y = 0; y < cplines.length; y++) {
                let cpoints = cplines[y].children;

                var grouped_cpoints = []; // Array to group every CPOINT.

                for (let z = 0; z < cpoints.length; z++) {
                  let cpoint_xx = this.reader.getFloat(cpoints[z], "xx");
                  let cpoint_yy = this.reader.getFloat(cpoints[z], "yy");
                  let cpoint_zz = this.reader.getFloat(cpoints[z], "zz");
                  let cpoint_ww = this.reader.getFloat(cpoints[z], "ww");

                  grouped_cpoints.push([cpoint_xx, cpoint_yy, cpoint_zz, cpoint_ww]); // Push every CPOINT on different arrays.
              }
                this.cpoints.push(grouped_cpoints); // Push the CPLINE to the patch list.
            }
        }

        if (type != null)
           this.log("   Leaf: "+ type);
       else
           this.warn("Error in leaf");

						//parse leaf
						this.nodes[nodeID].addLeaf(new MyGraphLeaf(this, descendants[j]));
                        sizeChildren++;

                        this.cpoints = [];
                    }

                    else
                      this.onXMLMinorError("unknown tag <" + descendants[j].nodeName + ">");

              }
              if (sizeChildren == 0)
                return "at least one descendant must be defined for each intermediate node";
        }
        else
            this.onXMLMinorError("unknown tag name <" + nodeName);
    }
    console.log("Parsed nodes");

    this.assign_picking_ids();
    console.log('Picking ready!');
    console.log(this.nodes);

    return null;
}

/**
 *  Handles picking of nodes.
 *  Assigns an unique picking_id for each, due to "registerForPick" function requiring an integer.
 **/
 MySceneGraph.prototype.assign_picking_ids = function() {
    let picking_id = 1;

    for (let i = 0; i < this.nodes['plates'].children.length; i++) {
        this.nodes[this.nodes['plates'].children[i]].picking_id = picking_id;
        picking_id++;

        for (let j = 0; j < this.nodes[this.nodes['plates'].children[i]].children.length; j++) {
            this.nodes[this.nodes[this.nodes['plates'].children[i]].children[j]].picking_id = picking_id;
            picking_id++;
        }
    }

    this.nodes['cymbal'].picking_id = picking_id; picking_id++;

    for (let i = 0; i < this.nodes['gamemode_selector'].children.length; i++) {
        this.nodes[this.nodes['gamemode_selector'].children[i]].picking_id = picking_id;
        picking_id++;
    }

    for (let i = 0; i < this.nodes['teacups_black'].children.length; i++) {
        this.nodes[this.nodes['teacups_black'].children[i]].picking_id = picking_id;
        this.teacups_black.push(this.nodes['teacups_black'].children[i]);
        picking_id++;
    }

    for (let i = 0; i < this.nodes['teacups_green'].children.length; i++) {
        this.nodes[this.nodes['teacups_green'].children[i]].picking_id = picking_id;
        this.teacups_green.push(this.nodes['teacups_green'].children[i]);
        picking_id++;        
    }
}

/*
 * Callback to be executed on any read error
 */
 MySceneGraph.prototype.onXMLError = function(message) {
    console.error("XML Loading Error: " + message);
    this.loadedOk = false;
}

/**
 * Callback to be executed on any minor error, showing a warning on the console.
 */
 MySceneGraph.prototype.onXMLMinorError = function(message) {
    console.warn("Warning: " + message);
}

MySceneGraph.prototype.log = function(message) {
    console.log("   " + message);
}

/**
 * Generates a default material, with a random name. This material will be passed onto the root node, which
 * may override it.
 */
 MySceneGraph.prototype.generateDefaultMaterial = function() {
    var materialDefault = new CGFappearance(this.scene);
    materialDefault.setShininess(1);
    materialDefault.setSpecular(0, 0, 0, 1);
    materialDefault.setDiffuse(0.5, 0.5, 0.5, 1);
    materialDefault.setAmbient(0, 0, 0, 1);
    materialDefault.setEmission(0, 0, 0, 1);

    // Generates random material ID not currently in use.
    this.defaultMaterialID = null;
    do this.defaultMaterialID = MySceneGraph.generateRandomString(5);
    while (this.materials[this.defaultMaterialID] != null);

    this.materials[this.defaultMaterialID] = materialDefault;
}

/**
 * Generates a random string of the specified length.
 */
 MySceneGraph.generateRandomString = function(length) {
    // Generates an array of random integer ASCII codes of the specified length
    // and returns a string of the specified length.
    var numbers = [];
    for (var i = 0; i < length; i++)
        numbers.push(Math.floor(Math.random() * 256));          // Random ASCII code.

    return String.fromCharCode.apply(null, numbers);
}
/**
 * Displays the scene, processing each node, starting in the root node.
 */
 MySceneGraph.prototype.displayScene = function() {

    if (this.scene.switch_root)
        this.processNode('root', this.nodes['root'].textureID, this.nodes['root'].materialID, this.scene.shaders['default'], 0);
    else
        this.processNode('root_2', this.nodes['root_2'].textureID, this.nodes['root_2'].materialID, this.scene.shaders['default'], 0);
}

MySceneGraph.prototype.processNode = function(root_node_id, init_texture, init_material, active_shader, picking_id) {

  let root_node = this.nodes[root_node_id]; // The root node object.
  let new_material = init_material, new_texture = init_texture, new_picking = picking_id;
  let new_shader = active_shader;

  if (this.nodes[root_node_id].animations != undefined) {

    // Extracts the node's matrix, excluding the animation transformations.
    let node_matrix = root_node.transformMatrix.slice(12, 16);

    // Updates every animation associated with a certain ID.
    let anim_list = this.nodes[root_node_id].animations;

    for (let i = 0; i < anim_list.length; i++) {

        if (!anim_list[i].completed) {
            anim_list[i].obj_pos_vec = node_matrix;
            let anim_mat = anim_list[i].play(this.tick);
            this.scene.multMatrix(anim_mat);

            break;
        }
    }
}

this.scene.multMatrix(root_node.transformMatrix);

if (root_node_id == this.scene.selected_node)
    new_shader = this.scene.shaders[this.scene.selected_shader];

  //this.scene.setActiveShader(new_shader);

  for (let i = 0; i < root_node.leaves.length; i++){ // Draws every leaf.

    if (new_material != 'null')
      this.materials[new_material].apply();

    //root_node.leaves[i].primitive.updateTexture(this.textures[new_texture]);

    if (this.textures[new_texture] != undefined)
      this.textures[new_texture][0].bind();

  root_node.leaves[i].primitive.display();
}

for (let i = 0; i < root_node.children.length; i++) {

    let child = this.nodes[root_node.children[i]];

    if (child.materialID != 'null')
      new_material = child.materialID;

  if (child.textureID == 'clear' && new_texture != 'null')
      new_texture = this.textures[this.defaultMaterialID];

  else if (child.textureID != 'null')
      new_texture = child.textureID;

  if (typeof(child.picking_id) == 'number')
    new_picking = child.picking_id;

this.scene.registerForPick(new_picking, child);

this.scene.pushMatrix();
this.processNode(root_node.children[i], new_texture, new_material, new_shader, new_picking);
this.scene.popMatrix();
}

  // Resets the active shader.
  //this.scene.setActiveShader(this.scene.defaultShader);
}

MySceneGraph.prototype.fill_seat_matrix = function() {
    let pos = [

    //  NORTHWEST TABLE  \\
    {id: 'tiny_plate_1', x: 14.8, y: 15, z: 20.9}, {id: 'tiny_plate_2', x: 14.8, y: 15, z: 19.3}, 
    {id: 'tiny_plate_3', x: 13.6, y: 15, z: 19.7}, {id: 'tiny_plate_4', x: 16.0, y: 15, z: 19.7}, 
    {id: 'tiny_plate_5', x: 13.2, y: 15, z: 20.9}, {id: 'tiny_plate_6', x: 16.4, y: 15, z: 20.9}, 
    {id: 'tiny_plate_7', x: 13.6, y: 15, z: 22.1}, {id: 'tiny_plate_8', x: 16.0, y: 15, z: 22.1},
    {id: 'tiny_plate_9', x: 14.8, y: 15, z: 22.5},

    //    NORTH TABLE    \\
    {id: 'tiny_plate_10', x: 20.0, y: 15, z: 18.1}, {id: 'tiny_plate_11', x: 20.0, y: 15, z: 16.5},
    {id: 'tiny_plate_12', x: 18.8, y: 15, z: 16.9}, {id: 'tiny_plate_13', x: 21.2, y: 15, z: 16.9},
    {id: 'tiny_plate_14', x: 18.4, y: 15, z: 18.1}, {id: 'tiny_plate_15', x: 21.6, y: 15, z: 18.1},
    {id: 'tiny_plate_16', x: 18.8, y: 15, z: 19.3}, {id: 'tiny_plate_17', x: 21.2, y: 15, z: 19.3},
    {id: 'tiny_plate_18', x: 20.0, y: 15, z: 19.7},

    //  NORTHEAST TABLE  \\
    {id: 'tiny_plate_19', x: 25.2, y: 15, z: 20.9}, {id: 'tiny_plate_20', x: 25.2, y: 15, z: 19.3}, 
    {id: 'tiny_plate_21', x: 24.0, y: 15, z: 19.7}, {id: 'tiny_plate_22', x: 26.4, y: 15, z: 19.7}, 
    {id: 'tiny_plate_23', x: 23.6, y: 15, z: 20.9}, {id: 'tiny_plate_24', x: 26.8, y: 15, z: 20.9}, 
    {id: 'tiny_plate_25', x: 24.0, y: 15, z: 22.1}, {id: 'tiny_plate_26', x: 26.4, y: 15, z: 22.1},
    {id: 'tiny_plate_27', x: 25.2, y: 15, z: 22.5},

    //     WEST TABLE    \\
    {id: 'tiny_plate_28', x: 12.0, y: 15, z: 26.1}, {id: 'tiny_plate_29', x: 12.0, y: 15, z: 24.5},
    {id: 'tiny_plate_30', x: 10.8, y: 15, z: 24.9}, {id: 'tiny_plate_31', x: 13.2, y: 15, z: 24.9},
    {id: 'tiny_plate_32', x: 10.4, y: 15, z: 26.1}, {id: 'tiny_plate_33', x: 13.6, y: 15, z: 26.1},
    {id: 'tiny_plate_34', x: 10.8, y: 15, z: 27.3}, {id: 'tiny_plate_35', x: 13.2, y: 15, z: 27.3},
    {id: 'tiny_plate_36', x: 12.0, y: 15, z: 27.7},

    //     EAST TABLE    \\
    {id: 'tiny_plate_37', x: 28.0, y: 15, z: 26.1}, {id: 'tiny_plate_38', x: 28.0, y: 15, z: 24.5},
    {id: 'tiny_plate_39', x: 26.8, y: 15, z: 24.9}, {id: 'tiny_plate_40', x: 29.2, y: 15, z: 24.9},
    {id: 'tiny_plate_41', x: 26.4, y: 15, z: 26.1}, {id: 'tiny_plate_42', x: 29.6, y: 15, z: 26.1},
    {id: 'tiny_plate_43', x: 26.8, y: 15, z: 27.3}, {id: 'tiny_plate_44', x: 29.2, y: 15, z: 27.3},
    {id: 'tiny_plate_45', x: 28.0, y: 15, z: 27.7},

    //  SOUTHWEST TABLE  \\
    {id: 'tiny_plate_46', x: 14.8, y: 15, z: 31.3}, {id: 'tiny_plate_47', x: 14.8, y: 15, z: 29.7},
    {id: 'tiny_plate_48', x: 13.6, y: 15, z: 30.1}, {id: 'tiny_plate_49', x: 16.0, y: 15, z: 30.1}, 
    {id: 'tiny_plate_50', x: 13.2, y: 15, z: 31.3}, {id: 'tiny_plate_51', x: 16.4, y: 15, z: 31.3}, 
    {id: 'tiny_plate_52', x: 13.6, y: 15, z: 32.5}, {id: 'tiny_plate_53', x: 16.0, y: 15, z: 32.5},
    {id: 'tiny_plate_54', x: 14.8, y: 15, z: 32.9},

    //  SOUTHEAST TABLE  \\
    {id: 'tiny_plate_55', x: 25.2, y: 15, z: 31.3}, {id: 'tiny_plate_56', x: 25.2, y: 15, z: 29.7},
    {id: 'tiny_plate_57', x: 24.0, y: 15, z: 30.1}, {id: 'tiny_plate_58', x: 26.4, y: 15, z: 30.1}, 
    {id: 'tiny_plate_59', x: 23.6, y: 15, z: 31.3}, {id: 'tiny_plate_60', x: 26.8, y: 15, z: 31.3}, 
    {id: 'tiny_plate_61', x: 24.0, y: 15, z: 32.5}, {id: 'tiny_plate_62', x: 26.4, y: 15, z: 32.5},
    {id: 'tiny_plate_63', x: 25.2, y: 15, z: 32.9},

    //    SOUTH TABLE   \\
    {id: 'tiny_plate_64', x: 20.0, y: 15, z: 34.1}, {id: 'tiny_plate_65', x: 20.0, y: 15, z: 32.5},
    {id: 'tiny_plate_66', x: 18.8, y: 15, z: 32.9}, {id: 'tiny_plate_67', x: 21.2, y: 15, z: 32.9},
    {id: 'tiny_plate_68', x: 18.4, y: 15, z: 34.1}, {id: 'tiny_plate_69', x: 21.6, y: 15, z: 34.1},
    {id: 'tiny_plate_70', x: 18.8, y: 15, z: 35.3}, {id: 'tiny_plate_71', x: 21.2, y: 15, z: 35.3},
    {id: 'tiny_plate_72', x: 20.0, y: 15, z: 35.7},

    //    CENTER TABLE   \\
    {id: 'tiny_plate_73', x: 20.0, y: 15, z: 26.1}, {id: 'tiny_plate_74', x: 20.0, y: 15, z: 24.5},
    {id: 'tiny_plate_75', x: 18.8, y: 15, z: 24.9}, {id: 'tiny_plate_76', x: 21.2, y: 15, z: 24.9},
    {id: 'tiny_plate_77', x: 18.4, y: 15, z: 26.1}, {id: 'tiny_plate_78', x: 21.6, y: 15, z: 26.1},
    {id: 'tiny_plate_79', x: 18.8, y: 15, z: 27.3}, {id: 'tiny_plate_80', x: 21.2, y: 15, z: 27.3},
    {id: 'tiny_plate_81', x: 20.0, y: 15, z: 27.7}

    ];

    return pos;
};

MySceneGraph.prototype.fill_teacup_matrix = function() {
    let pos = [

     //\/\/\/\  BLACK PIECES  /\/\/\/\\

    //   FIRST ROW  \\
    {id: 'teacup_black_1', x: 38.2, y: 7.0, z: 15.0, index: 1}, {id: 'teacup_black_2', x: 39.4, y: 6.9, z: 15.0, index: 2},
    {id: 'teacup_black_3', x: 40.6, y: 7.0, z: 15.0, index: 3}, {id: 'teacup_black_4', x: 41.8, y: 7.0, z: 15.0, index: 4},
    {id: 'teacup_black_5', x: 43.0, y: 7.0, z: 15.0, index: 5}, {id: 'teacup_black_6', x: 44.2, y: 7.0, z: 15.0, index: 6},
    {id: 'teacup_black_7', x: 45.4, y: 7.0, z: 15.0, index: 7}, {id: 'teacup_black_8', x: 46.6, y: 7.0, z: 15.0, index: 8},

    //  SECOND ROW  \\
    {id: 'teacup_black_9', x: 38.2, y: 7.0, z: 16.4, index: 9}, {id: 'teacup_black_10', x: 39.4, y: 6.9, z: 16.4, index: 10},
    {id: 'teacup_black_11', x: 40.6, y: 7.0, z: 16.4, index: 11}, {id: 'teacup_black_12', x: 41.8, y: 7.0, z: 16.4, index: 12},
    {id: 'teacup_black_13', x: 43.0, y: 7.0, z: 16.4, index: 13}, {id: 'teacup_black_14', x: 44.2, y: 7.0, z: 16.4, index: 14},
    {id: 'teacup_black_15', x: 45.4, y: 7.0, z: 16.4, index: 15}, {id: 'teacup_black_16', x: 46.6, y: 7.0, z: 16.4, index: 16},

    //   THIRD ROW  \\
    {id: 'teacup_black_17', x: 38.2, y: 7.0, z: 17.8, index: 17}, {id: 'teacup_black_18', x: 39.4, y: 6.9, z: 17.8, index: 18},
    {id: 'teacup_black_19', x: 40.6, y: 7.0, z: 17.8, index: 19}, {id: 'teacup_black_20', x: 41.8, y: 7.0, z: 17.8, index: 20},
    {id: 'teacup_black_21', x: 43.0, y: 7.0, z: 17.8, index: 21}, {id: 'teacup_black_22', x: 44.2, y: 7.0, z: 17.8, index: 22},
    {id: 'teacup_black_23', x: 45.4, y: 7.0, z: 17.8, index: 23}, {id: 'teacup_black_24', x: 46.6, y: 7.0, z: 17.8, index: 24},

    //  FOURTH ROW  \\
    {id: 'teacup_black_25', x: 38.2, y: 7.0, z: 19.2, index: 25}, {id: 'teacup_black_26', x: 39.4, y: 6.9, z: 19.2, index: 26},
    {id: 'teacup_black_27', x: 40.6, y: 7.0, z: 19.2, index: 27}, {id: 'teacup_black_28', x: 41.8, y: 7.0, z: 19.2, index: 28},
    {id: 'teacup_black_29', x: 43.0, y: 7.0, z: 19.2, index: 29}, {id: 'teacup_black_30', x: 44.2, y: 7.0, z: 19.2, index: 30},
    {id: 'teacup_black_31', x: 45.4, y: 7.0, z: 19.2, index: 31}, {id: 'teacup_black_32', x: 46.6, y: 7.0, z: 19.2, index: 32},

    //  FIFTH ROW   \\
    {id: 'teacup_black_33', x: 38.2, y: 7.0, z: 20.6, index: 33}, {id: 'teacup_black_34', x: 39.4, y: 6.9, z: 20.6, index: 34},
    {id: 'teacup_black_35', x: 40.6, y: 7.0, z: 20.6, index: 35}, {id: 'teacup_black_36', x: 41.8, y: 7.0, z: 20.6, index: 36},
    {id: 'teacup_black_37', x: 43.0, y: 7.0, z: 20.6, index: 37}, {id: 'teacup_black_38', x: 44.2, y: 7.0, z: 20.6, index: 38},
    {id: 'teacup_black_39', x: 45.4, y: 7.0, z: 20.6, index: 39}, {id: 'teacup_black_40', x: 46.6, y: 7.0, z: 20.6, index: 40},

    //\/\/\/\  GREEN PIECES  /\/\/\/\\

    //   FIRST ROW  \\
    {id: 'teacup_green_1', x: 38.2, y: 7.0, z: 34.0, index: 1}, {id: 'teacup_green_2', x: 39.4, y: 6.9, z: 34.0, index: 2},
    {id: 'teacup_green_3', x: 40.6, y: 7.0, z: 34.0, index: 3}, {id: 'teacup_green_4', x: 41.8, y: 7.0, z: 34.0, index: 4},
    {id: 'teacup_green_5', x: 43.0, y: 7.0, z: 34.0, index: 5}, {id: 'teacup_green_6', x: 44.2, y: 7.0, z: 34.0, index: 6},
    {id: 'teacup_green_7', x: 45.4, y: 7.0, z: 34.0, index: 7}, {id: 'teacup_green_8', x: 46.6, y: 7.0, z: 34.0, index: 8},

    //  SECOND ROW  \\
    {id: 'teacup_green_9', x: 38.2, y: 7.0, z: 35.4, index: 9}, {id: 'teacup_green_10', x: 39.4, y: 6.9, z: 35.4, index: 10},
    {id: 'teacup_green_11', x: 40.6, y: 7.0, z: 35.4, index: 11}, {id: 'teacup_green_12', x: 41.8, y: 7.0, z: 35.4, index: 12},
    {id: 'teacup_green_13', x: 43.0, y: 7.0, z: 35.4, index: 13}, {id: 'teacup_green_14', x: 44.2, y: 7.0, z: 35.4, index: 14},
    {id: 'teacup_green_15', x: 45.4, y: 7.0, z: 35.4, index: 15}, {id: 'teacup_green_16', x: 46.6, y: 7.0, z: 35.4, index: 16},

    //   THIRD ROW  \\
    {id: 'teacup_green_17', x: 38.2, y: 7.0, z: 36.8, index: 17}, {id: 'teacup_green_18', x: 39.4, y: 6.9, z: 36.8, index: 18},
    {id: 'teacup_green_19', x: 40.6, y: 7.0, z: 36.8, index: 19}, {id: 'teacup_green_20', x: 41.8, y: 7.0, z: 36.8, index: 20},
    {id: 'teacup_green_21', x: 43.0, y: 7.0, z: 36.8, index: 21}, {id: 'teacup_green_22', x: 44.2, y: 7.0, z: 36.8, index: 22},
    {id: 'teacup_green_23', x: 45.4, y: 7.0, z: 36.8, index: 23}, {id: 'teacup_green_24', x: 46.6, y: 7.0, z: 36.8, index: 24},

    //  FOURTH ROW  \\
    {id: 'teacup_green_25', x: 38.2, y: 7.0, z: 38.2, index: 25}, {id: 'teacup_green_26', x: 39.4, y: 6.9, z: 38.2, index: 26},
    {id: 'teacup_green_27', x: 40.6, y: 7.0, z: 38.2, index: 27}, {id: 'teacup_green_28', x: 41.8, y: 7.0, z: 38.2, index: 28},
    {id: 'teacup_green_29', x: 43.0, y: 7.0, z: 38.2, index: 29}, {id: 'teacup_green_30', x: 44.2, y: 7.0, z: 38.2, index: 30},
    {id: 'teacup_green_31', x: 45.4, y: 7.0, z: 38.2, index: 31}, {id: 'teacup_green_32', x: 46.6, y: 7.0, z: 38.2, index: 32},

    //  FIFTH ROW   \\
    {id: 'teacup_green_33', x: 38.2, y: 7.0, z: 39.6, index: 33}, {id: 'teacup_green_34', x: 39.4, y: 6.9, z: 39.6, index: 34},
    {id: 'teacup_green_35', x: 40.6, y: 7.0, z: 39.6, index: 35}, {id: 'teacup_green_36', x: 41.8, y: 7.0, z: 39.6, index: 36},
    {id: 'teacup_green_37', x: 43.0, y: 7.0, z: 39.6, index: 37}, {id: 'teacup_green_38', x: 44.2, y: 7.0, z: 39.6, index: 38},
    {id: 'teacup_green_39', x: 45.4, y: 7.0, z: 39.6, index: 39}, {id: 'teacup_green_40', x: 46.6, y: 7.0, z: 39.6, index: 40}

    ]

    return pos;
};

MySceneGraph.prototype.move_teacup = function(pick_info, player, id) {

    if (player == 'g'){

        for (let i = 0; i < this.all_seats.length; i++) {

            if (this.nodes[this.all_seats[i].id].picking_id == pick_info.seat_pick) {
                console.log(this.teacups_black);

                this.nodes[this.nodes[this.teacups_black[id-1]].nodeID].transformMatrix[12] = this.all_seats[i].x;
                this.nodes[this.nodes[this.teacups_black[id-1]].nodeID].transformMatrix[13] = this.all_seats[i].y;
                this.nodes[this.nodes[this.teacups_black[id-1]].nodeID].transformMatrix[14] = this.all_seats[i].z;
            }
        }
    }

    if (player == 'b') {
        for (let i = 0; i < this.all_seats.length; i++) {

            if (this.nodes[this.all_seats[i].id].picking_id == pick_info.seat_pick) {

                this.nodes[this.nodes[this.teacups_green[id-1]].nodeID].transformMatrix[12] = this.all_seats[i].x;
                this.nodes[this.nodes[this.teacups_green[id-1]].nodeID].transformMatrix[13] = this.all_seats[i].y;
                this.nodes[this.nodes[this.teacups_green[id-1]].nodeID].transformMatrix[14] = this.all_seats[i].z;
            }
        }
    }
}

MySceneGraph.prototype.move_bot_teacup = function(pick_info) {

    for (let i = 0; i < this.all_seats.length; i++) {

        if (this.nodes[this.all_seats[i].id].picking_id == pick_info.seat) {


            this.nodes[this.nodes[this.teacups_green[this.green_index]].nodeID].transformMatrix[12] = this.all_seats[i].x;
            this.nodes[this.nodes[this.teacups_green[this.green_index]].nodeID].transformMatrix[13] = this.all_seats[i].y;
            this.nodes[this.nodes[this.teacups_green[this.green_index]].nodeID].transformMatrix[14] = this.all_seats[i].z;
            this.green_index++;
        }
    }
}

MySceneGraph.prototype.flip_camera_player = function() {

    if (this.scene.timer < 9){
        this.scene.camera.orbit(vec3.fromValues(1, 0, 0), Math.PI/18);
        this.scene.timer++;
    }
    
    else {
        this.scene.change_camera = 0;
        this.scene.timer = 0;
    }

};

MySceneGraph.prototype.reverse_flip_camera = function () {

    if (this.scene.timer < 9){
        this.scene.camera.orbit(vec3.fromValues(1, 0, 0), -Math.PI/18);
        this.scene.timer++;
    }
    
    else {
        this.scene.change_camera = 0;
        this.scene.timer = 0;
    }
};

MySceneGraph.prototype.reset_teacups = function() {

console.log(this.teacups_green);

    for (let i = 0; i < this.all_teacups.length; i++) {

        for (let j = 0; j  < this.teacups_green.length; j++) {

            if (this.teacups_green[j] == this.all_teacups[i].id){
                
                this.nodes[this.nodes[this.teacups_green[j]].nodeID].transformMatrix[12] = this.all_teacups[i].x;
                this.nodes[this.nodes[this.teacups_green[j]].nodeID].transformMatrix[13] = this.all_teacups[i].y;
                this.nodes[this.nodes[this.teacups_green[j]].nodeID].transformMatrix[14] = this.all_teacups[i].z;

            }
        }

        for (let k = 0; k  < this.teacups_black.length; k++) {

            if (this.teacups_black[k] == this.all_teacups[i].id){
                
                this.nodes[this.nodes[this.teacups_black[k]].nodeID].transformMatrix[12] = this.all_teacups[i].x;
                this.nodes[this.nodes[this.teacups_black[k]].nodeID].transformMatrix[13] = this.all_teacups[i].y;
                this.nodes[this.nodes[this.teacups_black[k]].nodeID].transformMatrix[14] = this.all_teacups[i].z;

            }
        }
    }
};


