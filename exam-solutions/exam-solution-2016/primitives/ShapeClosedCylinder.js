function ShapeClosedCylinder(scene, height, radius_bottom, radius_top, stacks, slices, cover_top, cover_bottom) {
  CGFobject.call(this, scene);

  this.cylinder = new ShapeCylinder(scene, height, radius_bottom, radius_top, stacks, slices);

  this.height = height;

  this.cover_top = cover_top;
  this.cover_bottom = cover_bottom;

  this.circle_top = new ShapeCircle(scene, slices, radius_top);
  this.circle_bottom = new ShapeCircle(scene, slices, radius_bottom);

  this.initBuffers();
};

ShapeClosedCylinder.prototype = Object.create(CGFobject.prototype);
ShapeClosedCylinder.prototype.constructor = ShapeClosedCylinder;

ShapeClosedCylinder.prototype.display = function() {
  this.cylinder.display();

  if (this.cover_top == 1){
    this.scene.pushMatrix();
    this.scene.translate(0, 0, this.height);
    this.circle_top.display();
    this.scene.popMatrix();
  }

  if (this.cover_bottom == 1){
    this.scene.pushMatrix();
    this.circle_bottom.display();
    this.scene.popMatrix();
  }

}

ShapeClosedCylinder.prototype.updateTexture = function() {

}
