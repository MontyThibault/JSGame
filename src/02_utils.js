// Little shim so that functions that will always be called in a given context
g.context = function(func, context) {
	return function() {
		func.apply(context, arguments);
	};
};

g.flatten = function(arr) {
	return arr.concat.apply([], arr);
};

// Converts from normal screen space coordinates to relative coordinates, where
// x's and y's range from -1 to 1 with (0, 0) being the exact center of the screen
g.relativeCoord = function(vec) {
	vec.x = (vec.x / window.innerWidth) * 2 - 1;
	vec.y = -(vec.y / window.innerHeight) * 2 + 1;

	return vec;
};

g.absoluteCoord = function(vec) {
	vec.x = (vec.x + 1) / 2 * window.innerWidth;
	vec.y = (vec.y - 1) / 2 * -window.innerHeight;

	return vec;
};

g.intersect = (function() {
	var vec = new THREE.Vector3(),
		raycaster = new THREE.Raycaster();

	return function(v1, v2, objects) {
		raycaster.set(v1, vec.copy(v2).sub(v1).normalize());
		return raycaster.intersectObjects(objects);
	};
})();



// g.project and g.unproject are now methods of the vector prototype
// Thanks to THREE.js update


// Given a set of mouse coordinates in absolute screen space, this will project
// a ray and return any intersections in the provided list of objects. If no 
// objects are given, it will default to giant plane. Useful for seeing which
// 3d objects the mouse is currently hovering over/clicking on.
g.raycastMouse = (function() {
	var plane = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000, 1, 1));
	plane.rotation.x = -Math.PI / 2; // Flat
	plane.updateMatrixWorld(); // Or else raycasting doesn't work properly

	return function(clientX, clientY, cam, objects) {
		var cameraPosition = 
				new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);

		// if(!g.userInput.pressed.l) return false;

		var mouse = new THREE.Vector3(
			clientX, 
			clientY, 
			0.5);
		mouse = g.relativeCoord(mouse);
		mouse.unproject(cam);

		return g.intersect(
			cameraPosition, 
			mouse, 
			objects || [plane]);
	};
})();

g.addPoint = function(vector, scale) {
	var cube = new THREE.Mesh(
		new THREE.BoxGeometry(1, 1, 1),
		new THREE.MeshBasicMaterial({ color: 0x00FF00 }));
	cube.position.copy(vector);
	cube.scale.multiplyScalar(scale || 1);
	
	window.scene.add(cube);

	return cube;
};




// Only add setZeroTimeout to the window object, and hide everything
// else in a closure.
(function() {
    var timeouts = [];
    var messageName = "zero-timeout-message";

    // Like setTimeout, but only takes a function argument.  There's
    // no time argument (always zero) and no arguments (you have to
    // use a closure).
    function setZeroTimeout(fn) {
        timeouts.push(fn);
        window.postMessage(messageName, "*");
    }

    function handleMessage(event) {
        if (event.source == window && event.data == messageName) {
            event.stopPropagation();
            if (timeouts.length > 0) {
                var fn = timeouts.shift();
                fn();
            }
        }
    }

    window.addEventListener("message", handleMessage, true);

    // Add the one thing we want added to the window object.
    window.setZeroTimeout = setZeroTimeout;
})();