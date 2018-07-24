function Square(scene, texangle){
  CGFobject.call(this, scene);

  this.texangle = texangle;

  this.initBuffers();
}

Square.prototype = Object.create(CGFobject.prototype);
Square.prototype.constructor = Square;

Square.prototype.initBuffers = function() {

    this.vertices = [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0];
    this.indices = [0, 1, 2, 1, 3, 2];
    this.normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];

    this.texCoords = [0, 0, Math.cos(this.texangle), Math.sin(this.texangle), -Math.sin(this.texangle), Math.cos(this.texangle), Math.cos(this.texangle) - Math.sin(this.texangle), Math.sin(this.texangle) + Math.cos(this.texangle)];

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
};

Square.prototype.updateTexture = function(texture) {

  this.initBuffers();
};
