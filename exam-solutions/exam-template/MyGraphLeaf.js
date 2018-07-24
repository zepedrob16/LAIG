/**
 * MyGraphLeaf class, representing a leaf in the scene graph.
 * @constructor
**/

function MyGraphLeaf(graph, xmlelem) {
  this.graph = graph;

  var type = this.graph.reader.getItem(xmlelem, 'type', ['rectangle', 'cylinder', 'sphere', 'triangle', 'circle', 'patch']);
  var args = this.graph.reader.getString(xmlelem, 'args').split(' ').map(Number); // Converts array of strings to integers.

  if (type == 'rectangle') {
    this.primitive = new ShapeRectangle(this.graph.scene, args[0], args[1], args[2], args[3]);
  }
  else if (type == 'triangle') {
    this.primitive = new ShapeTriangle(this.graph.scene, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
  }
  else if (type == 'circle') {
    this.primitive = new ShapeCircle(this.graph.scene, args[0]); // No. of sides on the circle approximation.
  }
  else if (type == 'cylinder'){
    this.primitive = new ShapeClosedCylinder(this.graph.scene, args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
  }
  else if (type == 'sphere') {
    this.primitive = new ShapeSphere(this.graph.scene, args[0], args[1], args[2]);
  }
  else if (type == 'patch') {
    this.primitive = new ShapePatch(this.graph.scene, args[0], args[1], this.graph.cpoints);
  }
  return;

}
