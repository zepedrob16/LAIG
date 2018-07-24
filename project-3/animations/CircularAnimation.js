class CircularAnimation {

	/* CircularAnimation class constructor. */
	constructor(center, radius, init_angle, angle, speed) {
		this.center = center;
		this.radius = radius;
		this.init_angle = init_angle * DEGREE_TO_RAD;
		this.angle = angle;
		this.speed = speed;
		this.goal_angle = angle * DEGREE_TO_RAD;

		this.mat = this.init_rotation_matrix(center, radius);

		this.current_angle = 0;
		this.w = speed / radius;

		this.completed = false;
	}

	/* Places the object on the correct initial position. */
	init_rotation_matrix(center, radius) {
		let matrix = mat4.create();

		//mat4.rotateY(matrix, matrix, 90 * DEGREE_TO_RAD);
		mat4.translate(matrix, matrix, [radius, 0, 0]); // Translates the object to the circumference.
		mat4.translate(matrix, matrix, center); // Translates the object to the center.

		return matrix;
	}

	/* Calculates the next distance to translate given the difference between two frames. */
	play(delta) {
		let delta_angle = this.init_angle + this.w * delta;

		mat4.rotateY(this.mat, this.mat, delta_angle); // Rotates the object.
		this.current_angle += delta_angle;

		// Checks whether the next rotation would exceed the max rotation bound to the object.
		if (this.current_angle >= this.goal_angle) {
			this.completed = true;
			return mat4.identity(this.mat);
		}

		return this.mat;
	}

	/* Clones object to create a unique animation copy for each node. */
	clone() {
		return new CircularAnimation(this.center, this.radius, this.init_angle, this.angle, this.speed);
	}

}