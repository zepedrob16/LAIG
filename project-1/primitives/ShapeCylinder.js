function ShapeCylinder(scene, height, radiusBottom, radiusTop, stacks, slices) {
  CGFobject.call(this, scene);

  this.height = height;
	this.radiusBottom = radiusBottom;
	this.radiusTop = radiusTop;
  this.stacks = stacks;
	this.slices = slices;

	this.initBuffers();
}

ShapeCylinder.prototype = Object.create(CGFobject.prototype);
ShapeCylinder.prototype.constructor = ShapeCylinder;

ShapeCylinder.prototype.initBuffers = function() {

  var radiusIncrement = (this.radiusTop - this.radiusBottom) / this.stacks;
	var stackIncrement = this.height / this.stacks;
	var thetaIncrement = (2 * Math.PI) / this.slices;
	var texelIncrementS = 1.0 / this.slices;
	var texelIncrementT = 1.0 / this.stacks;
	var vertexNumber = 1;
	var coord_s = 0.0;
	var theta = 0;

  this.indices = [];
	this.normals = [];
	this.texCoords = [];
	this.vertices = [];

  for (var i = 0; i <= this.slices; i++) {

		var coord_t = 1.0;
		var nRadius = this.radiusBottom;
		var x = Math.cos(theta);
		var y = Math.sin(theta);
		var z = 0;

		for (var j = 0; j <= this.stacks; j++) {

			this.normals.push(x * nRadius, y * nRadius, 0);
      this.vertices.push(x * nRadius, y * nRadius, z) ;

			this.texCoords.push(coord_s, coord_t);

			if (i > 0 && j > 0) {

				this.indices.push(vertexNumber, vertexNumber + this.stacks, vertexNumber + this.stacks + 1);
				this.indices.push(vertexNumber + this.stacks, vertexNumber, vertexNumber - 1);

				vertexNumber++;
			}

			coord_t -= texelIncrementT;
			nRadius += radiusIncrement;
      z += stackIncrement;
		}

		if (i > 0)
			vertexNumber++;

		theta += thetaIncrement;
		coord_s += texelIncrementS;
	}

  this.primitiveType = this.scene.gl.TRIANGLES;
  this.initGLBuffers();
};

ShapeCylinder.prototype.updateTexture = function(texture) {

}
