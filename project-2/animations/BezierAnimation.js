class BezierAnimation {

	/* The CircularAnimation constructor. */
	constructor(control_points, speed) {
		this.control_points = control_points;
		this.speed = speed;

		this.curr_pos = {x: 0, y: 0, z: 0};

		this.distance = this.calculate_casteljau(control_points);
		this.total_time = this.distance / this.speed;
		this.elapsed_time = 0;

		this.t = 0;

		this.mat = mat4.create();
		this.completed = false;
	}

	/* Computes the new point on the bezier position, based on the current tick. */
	get_new_point() {
		let new_x = Math.pow(1 - this.t, 3) * this.control_points[0].x + 3 * this.t * Math.pow(1 - this.t, 2) * this.control_points[1].x + 3 * Math.pow(this.t, 2) * (1 - this.t) * this.control_points[2].x + Math.pow(this.t, 3) * this.control_points[3].x;
		let new_y = Math.pow(1 - this.t, 3) * this.control_points[0].y + 3 * this.t * Math.pow(1 - this.t, 2) * this.control_points[1].y + 3 * Math.pow(this.t, 2) * (1 - this.t) * this.control_points[2].y + Math.pow(this.t, 3) * this.control_points[3].y;
		let new_z = Math.pow(1 - this.t, 3) * this.control_points[0].z + 3 * this.t * Math.pow(1 - this.t, 2) * this.control_points[1].z + 3 * Math.pow(this.t, 2) * (1 - this.t) * this.control_points[2].z + Math.pow(this.t, 3) * this.control_points[3].z;

		return {x: new_x, y: new_y, z: new_z};
	}

	/* Calculates length of curve according to De Casteljau's algorithm. */
	calculate_casteljau(points) {

		var l1 = vec3.fromValues(points[0].x, points[0].y, points[0].z);
        var auxp2 = vec3.fromValues(points[0].x, points[1].y, points[2].z);
        var auxp3 = vec3.fromValues(points[2].x, points[2].y, points[2].z);
        var r4 = vec3.fromValues(points[3].x, points[3].y, points[3].z);
        var divide_aux = vec3.fromValues(2,2,2);

        var l2 = vec3.create();
        vec3.add(l2, l1, auxp2);
        vec3.divide(l2, l2, divide_aux);

        var h = vec3.create();
        vec3.add(h, auxp2, auxp3);
        vec3.divide(h, h, divide_aux);

        var l3 = vec3.create();
        vec3.add(l3, l2, h);
        vec3.divide(l3, l3, divide_aux);

        var r3 = vec3.create();
        vec3.add(r3, auxp3, r4);
        vec3.divide(r3, r3, divide_aux);

        var r2 = vec3.create();
        vec3.add(r2, h, r3);
        vec3.divide(r2, r2, divide_aux);

        return vec3.distance(l1,l2) + vec3.distance(l2,l3) + vec3.distance(l3,r2) + vec3.distance(r2,r3) + vec3.distance(r3,r4);
	}

	/* Gets the transformation matrix for the bezier animation on the current tick. */
	play(delta) {
		let delta_time = delta / 1000;
		let increment = delta_time / this.distance;
		this.t = this.elapsed_time / this.total_time;

		// The animation has been completed.
		if (this.t > 1) {
			this.completed = true;
			return this.mat;
		} 
			

		let new_point = this.get_new_point();
		let instant_point = vec3.create();

		vec3.subtract(instant_point, Object.values(new_point), this.mat.slice(12, 16));

		let a = Math.abs(this.curr_pos.x - new_point.x);
		let b = this.curr_pos.y - new_point.y;
		let c = this.curr_pos.z - new_point.z;

		let radius = Math.sqrt(a * a + b * b + c * c);
		this.angle = {x: Math.atan(b / a), y: Math.acos(c / this.radius)};
		this.elapsed_time += delta;

		mat4.translate(this.mat, this.mat, instant_point);
		return this.mat;
	}

	/* Clones object to create a unique animation copy for each node. */
	clone() {
		return new BezierAnimation(this.control_points, this.speed);
	}

}