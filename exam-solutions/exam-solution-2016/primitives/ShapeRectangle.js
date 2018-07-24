function ShapeRectangle(scene, x1, y1, x2, y2){
  CGFobject.call(this, scene);

  this.x1 = x1;
  this.y1 = y1;
  this.x2 = x2;
  this.y2 = y2;

  this.length_s = 1, this.length_t = 1; // Default texture coordinates.

  this.initBuffers();
}

ShapeRectangle.prototype = Object.create(CGFobject.prototype);
ShapeRectangle.prototype.constructor = ShapeRectangle;

ShapeRectangle.prototype.initBuffers = function() {

    this.vertices = [this.x1, this.y2, 0, this.x2, this.y2, 0, this.x1, this.y1, 0, this.x2, this.y1, 0];
    this.indices = [0, 1, 2, 3, 2, 1];
    this.indices.push(1, 2, 3, 2, 1, 0); // Double-sided rectangle.
    this.normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];

    this.height = this.y1 - this.y2;
    this.width = this.x2 - this.x1;

    this.texCoords = [0, this.height / this.length_t, this.width / this.length_s, this.height / this.length_t, 0, 0, this.width / this.length_s, 0];

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
};

ShapeRectangle.prototype.updateTexture = function(texture) {
  this.length_s = texture[1]; // S texture coordinate.
  this.length_t = texture[2]; // T texture coordinate.

  this.initBuffers();
};
