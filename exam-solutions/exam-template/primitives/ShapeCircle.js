function ShapeCircle(scene, sides, radius) {
  CGFobject.call(this, scene);

	this.sides = sides;
  this.radius = radius;

 	this.initBuffers();
}

ShapeCircle.prototype = Object.create(CGFobject.prototype);
ShapeCircle.prototype.constructor = ShapeCircle;

ShapeCircle.prototype.initBuffers = function() {
  this.vertices = [];
	this.indices = [];
	this.normals = [];
	this.texCoords = [];

	// No such thing as a 3-sided polygon.
	if (this.sides < 3){
		return;
	}

	var angle = 2 * Math.PI / this.sides;

	for(i = 0; i < this.sides; i++) {
		this.vertices.push(Math.cos(angle * i) * this.radius, Math.sin(angle*i) * this.radius, 0);
		this.normals.push(0,0,1);
		this.texCoords.push(0.5 + Math.cos(angle*i)/2, 0.5 - Math.sin(angle*i)/2);
	}

	for(i = 0; i < this.sides; i++) {
    if (i == this.sides - 3){
      this.indices.push(i+1, i+2, 0);
      this.indices.push(0, i+2, i+1);
	    break;
	  } else {
	    this.indices.push(i+1, i+2, 0);
      this.indices.push(0, i+2, i+1);
	  }
	}

 	this.primitiveType = this.scene.gl.TRIANGLES;
 	this.initGLBuffers();
};

ShapeCircle.prototype.updateTexture = function() {
}
