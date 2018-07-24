class ComboAnimation {

	/* The ComboAnimation constructor. */
	constructor(animations) {
		this.animations = animations;
		this.completed = false;

		this.mat = mat4.create();
	}

	play(tick) {

		// When every animation has finished, this animation finishes as well.
		if (this.animations.every(animation => animation.completed)) {
			this.completed = true;
			return this.mat;
		}

		for (let i = 0; i < this.animations.length; i++) {
			
			// If the current animation hasn't finished, it gets played.
			if (!this.animations[i].completed) {
				this.mat = this.animations[i].play(tick);
				break;
			}
		}
		return this.mat;
	}

	/* Clones object to create a unique animation copy for each node. */
	clone() { 
		return new ComboAnimation(this.animations); 
	}

}