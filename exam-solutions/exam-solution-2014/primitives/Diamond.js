function Diamond(scene, slices) {
  CGFobject.call(this, scene);

  this.top_pyramid = new ShapeClosedCylinder(this.scene, 2, 0.5, 0, slices, slices, 1, 1);
  this.bottom_pyramid = new ShapeClosedCylinder(this.scene, 2, 0.5, 0, slices, slices, 1, 1);

 	this.initBuffers();
}

Diamond.prototype = Object.create(CGFobject.prototype);
Diamond.prototype.constructor = Diamond;

Diamond.prototype.display = function() {

  this.scene.pushMatrix();
    this.scene.rotate(DEGREE_TO_RAD * -90, 1, 0, 0);
    this.top_pyramid.display();
  this.scene.popMatrix();

  this.scene.pushMatrix();
    this.scene.rotate(DEGREE_TO_RAD * 90, 1, 0, 0);
    this.bottom_pyramid.display();
  this.scene.popMatrix();

}

Diamond.prototype.updateTexture = function() {
}
