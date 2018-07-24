class LinearAnimation {

	/* CircularAnimation class constructor. */
	constructor(control_points, speed) {
		this.control_points = control_points;
		this.speed = speed;
		this.lines = new Array();
		this.init_vectors(control_points);

		this.obj_pos_vec = new vec3.create(); // The object's original matrix.
		this.mat = new mat4.create(); // The returned animation matrix.

		this.completed = false;
	}

	/**
		Initializes the vectors calculated with the provided control points.
		The lines list contains objects with a normalized vector, its full length and current processed length.
	**/
	init_vectors(points) {

		for (let i = 0; i < points.length - 1; i++) {
			let vector = vec3.fromValues(points[i+1].x - points[i].x, points[i+1].y - points[i].y, points[i+1].z - points[i].z);
			let distance = vec3.length(vector);

			vec3.normalize(vector, vector);
			this.lines.push({vec: vector, goal: distance, current: 0});
		}
	}

	/**
		Calculates the next distance to translate given the difference between two frames.
		Returns an array with the required translation on each axis.
	**/
	play(delta) {

		if (!this.lines.length) {
			this.completed = true;
			return this.mat;
		}

		let position = this.speed * delta;

		// Checks whether the new distance interval would exceed the current vector.
		if (this.lines[0]['current'] + position >= this.lines[0]['goal']) {

			// Can't calculate a rotation angle when it's the last vector.
			if (this.lines[1] == undefined) {
				this.lines.shift();
				return this.mat;
			}

			let vec_1 = this.lines[0]['vec'], vec_2 = this.lines[1]['vec'];

			// Determines the rotation angle for the vector switch this way, because vec3.angle() isn't defined.
			let dot_product = vec3.dot(vec_1, vec_2);
			let length_product = vec3.length(vec_1) * vec3.length(vec_2);
			let rotation_angle = Math.acos(dot_product / length_product);

			// Joins both the object and animation vectors so rotation on the origin is possible.
			let to_origin_vec = vec4.create();
			
			let inv_anim = this.mat.slice(12, 16).map(x => -x);
			let inv_obj = this.obj_pos_vec.map(x => -x);
			vec4.add(to_origin_vec, inv_obj, inv_anim);

			mat4.translate(this.mat, this.mat, to_origin_vec);
			//mat4.rotateY(this.mat, this.mat, rotation_angle);
			mat4.translate(this.mat, this.mat, to_origin_vec.map(x => -x));

			this.lines.shift();
			return this.mat;
		}

		// Gets an array with the correct coordinates to translate to.
		let translation_coords = this.lines[0]['vec'].map(x => (x * position));
		this.lines[0]['current'] += position;

		this.update_transform_matrix(translation_coords);
		return this.mat;
	}

	/**
		Receives an array containing the desired translation on each axis.
		Calculates a transformation matrix for each update tick.
	**/
	update_transform_matrix(translation_coords) {
		mat4.translate(this.mat, this.mat, translation_coords);
	}

	/* Clones object to create a unique animation copy for each node. */
	clone() {
		return new LinearAnimation(this.control_points, this.speed);
	}


}