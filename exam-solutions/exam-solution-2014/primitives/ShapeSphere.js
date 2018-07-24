function ShapeSphere(scene, radius, slices, stacks) {
  CGFobject.call(this, scene);

	this.radius = radius;
	this.slices = slices;
	this.stacks = stacks;

 	this.initBuffers();
};

ShapeSphere.prototype = Object.create(CGFobject.prototype);
ShapeSphere.prototype.constructor = ShapeSphere;

ShapeSphere.prototype.initBuffers = function() {

  this.indices = [];
 	this.vertices = [];
 	this.normals = [];
 	this.originalTexCoords = [];

 	var theta = Math.PI / this.stacks;
 	var phi = 2 * Math.PI / this.slices;

  for (var i = 0; i < this.stacks + 1; i++) {
    for (var j = 0; j < this.slices + 1; j++) {
			this.vertices.push(this.radius * Math.sin(i * theta) * Math.cos(j * phi), this.radius * Math.sin(i * theta) * Math.sin(j * phi), this.radius * Math.cos(i * theta));
			this.normals.push(Math.sin(i * theta) * Math.cos(j * phi), Math.sin(i * theta) * Math.sin(j * phi), Math.cos(i * theta));
			this.originalTexCoords.push(j/this.slices, 1-i/this.stacks);
		}
	}

	for (var i = 0; i < this.stacks; i++) {
		for (var j = 0; j < this.slices; j++) {
			this.indices.push(i * (this.slices + 1) + j, (i + 1) * (this.slices + 1) + j, (i + 1) * (this.slices + 1) + j + 1);
			this.indices.push(i * (this.slices + 1) + j, (i + 1) * (this.slices + 1) + j + 1, i * (this.slices + 1) + j + 1);
		}
	}

	this.texCoords = this.originalTexCoords.slice();

 	this.primitiveType = this.scene.gl.TRIANGLES;
 	this.initGLBuffers();
};

ShapeSphere.prototype.updateTexture = function(texture) {
}
