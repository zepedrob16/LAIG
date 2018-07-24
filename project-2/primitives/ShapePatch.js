function ShapePatch(scene, division_u, division_v, cpoints) {

  this.scene = scene;

  this.division_u = division_u;
  this.division_v = division_v;

  var degree_1 = cpoints.length - 1;
  var degree_2 = cpoints[0].length - 1;

  this.makeSurface(degree_1, degree_2, cpoints);
}

ShapePatch.prototype = Object.create(CGFnurbsObject.prototype);
ShapePatch.prototype.constructor = ShapePatch;

ShapePatch.prototype.getKnotsVector = function(degree){
  var v = new Array();

  for (let i = 0; i <= degree; i++) {
    v.push(0);
  }
  for (let i = 0; i <= degree; i++) {
    v.push(1);
  }
  return v;
}

ShapePatch.prototype.makeSurface = function(degree_1, degree_2, cpoints) {
  var knots_1 = this.getKnotsVector(degree_1);
  var knots_2 = this.getKnotsVector(degree_2);

  var nurbs_surface = new CGFnurbsSurface(degree_1, degree_2, knots_1, knots_2, cpoints);

  getSurfacePoint = function(u, v) {
    return nurbs_surface.getPoint(u, v);
  };

  this.nurbs_object = new CGFnurbsObject(this.scene, getSurfacePoint, this.division_u, this.division_v);
}

ShapePatch.prototype.display = function() {
  this.nurbs_object.display();
}

ShapePatch.prototype.updateTexture = function(texture) {
}
