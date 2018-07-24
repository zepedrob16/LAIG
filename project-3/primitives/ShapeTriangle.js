function ShapeTriangle(scene, x1, y1, z1, x2, y2, z2, x3, y3, z3){
  CGFobject.call(this, scene);

  this.x1 = x1, this.y1 = y1, this.z1 = z1;
  this.x2 = x2, this.y2 = y2, this.z2 = z2;
  this.x3 = x3, this.y3 = y3, this.z3 = z3;

  this.length_s = 1, this.length_t = 1; // Default texture coordinates.

  this.initBuffers();
}

ShapeTriangle.prototype = Object.create(CGFobject.prototype);
ShapeTriangle.prototype.constructor = ShapeTriangle;

ShapeTriangle.prototype.initBuffers = function() {

    this.vertices = [this.x1, this.y1, this.z1, this.x2, this.y2, this.z2, this.x3, this.y3, this.z3];
    this.indices = [0, 1, 2, 1, 0, 2];
    this.normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];

    // Edges length.
    this.a_length = Math.sqrt(Math.pow(this.x2 - this.x3, 2) + Math.pow(this.y2 - this.y3, 2) + Math.pow(this.z2 - this.z3, 2));
    this.b_length = Math.sqrt(Math.pow(this.x1 - this.x3, 2) + Math.pow(this.y1 - this.y3, 2) + Math.pow(this.z1 - this.z3, 2));
    this.c_length = Math.sqrt(Math.pow(this.x1 - this.x2, 2) + Math.pow(this.y1 - this.y2, 2) + Math.pow(this.z1 - this.z2, 2));

    this.beta = Math.acos((Math.pow(this.a_length, 2) - Math.pow(this.b_length, 2) + Math.pow(this.c_length, 2)) / (2 * this.a_length * this.c_length));

    this.height = this.a_length * Math.sin(this.beta);

    this.texCoords= [0,1, 1,1, 1,0]

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
};

ShapeTriangle.prototype.updateTexture = function(texture) {
  var length_s = texture[1];
  var length_t = texture[2];

  var tex_p1 = [0, this.height];
  var tex_p2 = [this.c_length, this.height];
  var tex_p3 = [this.c_length - this.a_length * this.beta, this.height - this.a_length * Math.sin(this.beta)];

  this.texCoords = [tex_p1[0], tex_p1[1], tex_p2[0], tex_p2[1], tex_p3[0], tex_p3[1]];
  
  for (let i = 0; i < this.texCoords.length; i++) {
    if (i & 0)
      this.texCoords[i] = this.texCoords[i] / length_s;
    else
      this.texCoords[i] = this.texCoords[i] / length_t;
  }

  this.updateTexCoordsGLBuffers();
};
