// Camera Component - Handles camera controls and recycling logic
import * as THREE from 'three';
import * as Editor from '../editor.js';

export class CameraController {
  constructor(camera, roadManager, streetlightManager) {
    this.camera = camera;
    this.roadManager = roadManager;
    this.streetlightManager = streetlightManager;
    this.keys = {};
    this.moveSpeed = 0.1;
    this.eyeLevel = 1.7;
    this.car = null;
    this.followOffset = new THREE.Vector3(0, 5, -10);
    this.followLerp = 0.1;

    
    // Get position constants from streetlight manager
    const constants = streetlightManager.getPositionConstants();
    this.STREETLIGHT_X_REGULAR = constants.X_REGULAR;
    this.STREETLIGHT_X_MIRROR = constants.X_MIRROR;
    this.STREETLIGHT_Y = constants.Y;
    this.STREETLIGHT_SPACING = constants.SPACING;
    this.RECYCLE_THRESHOLD = 5;
  }

  setupKeyboardControls() {
    window.addEventListener("keydown", e => {
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener("keyup", e => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  setCar(carController) {
  this.car = carController;
}

  update() {
  if (this.car?.mesh) {
    // --- CAR FOLLOW MODE ---
    const car = this.car.mesh;

    // Car forward vector
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(car.quaternion);

    // Camera behind car
    const desiredPos = car.position.clone().sub(forward.clone().multiplyScalar(this.followOffset.z));
    desiredPos.y = car.position.y + this.followOffset.y;

    this.camera.position.lerp(desiredPos, this.followLerp);

    // Camera looks ahead of the car
    const lookAtPos = car.position.clone().add(forward.clone().multiplyScalar(10));
    this.camera.lookAt(lookAtPos);

    // --- CAR MOVEMENT CONTROLS ---
    const moveSpeed = 0.2; // adjust as needed
    if (this.keys['w'] || this.keys['arrowup']) {
      car.position.add(forward.clone().multiplyScalar(moveSpeed));
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      car.position.add(forward.clone().multiplyScalar(-moveSpeed));
    }
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(car.quaternion);
    if (this.keys['a'] || this.keys['arrowleft']) {
      car.position.add(right.clone().multiplyScalar(-moveSpeed));
    }
    if (this.keys['d'] || this.keys['arrowright']) {
      car.position.add(right.clone().multiplyScalar(moveSpeed));
    }

  } else {
    // --- FREE CAMERA MODE ---
    const forward = new THREE.Vector3(0, 0, 1);
    const right = new THREE.Vector3(1, 0, 0);

    if (this.keys['w'] || this.keys['arrowup']) {
      this.camera.position.add(forward.clone().multiplyScalar(this.moveSpeed));
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      this.camera.position.add(forward.clone().multiplyScalar(-this.moveSpeed));
    }
    if (this.keys['a'] || this.keys['arrowleft']) {
      this.camera.position.add(right.clone().multiplyScalar(this.moveSpeed));
    }
    if (this.keys['d'] || this.keys['arrowright']) {
      this.camera.position.add(right.clone().multiplyScalar(-this.moveSpeed));
    }

    this.camera.position.y = this.eyeLevel;
    this.camera.rotation.x = 0;
    this.camera.rotation.z = 0;
  }

  const cameraZ = this.camera.position.z;

  // Recycle road segments
  this.roadManager.recycleRoadSegments(cameraZ);

  // Recycle streetlights
  this.recycleStreetlights(cameraZ);
}
  recycleStreetlights(cameraZ) {
    // Helper function to recycle streetlights
    const recycleStreetlights = (streetlights, xPosition) => {
      if (streetlights.length === 0) return;

      for (let i = 0; i < streetlights.length; i++) {
        const streetlight = streetlights[i];
        const streetlightBox = new THREE.Box3().setFromObject(streetlight);
        const streetlightMaxZ = streetlightBox.max.z;

        // If streetlight is behind the camera
        if (streetlightMaxZ < cameraZ - this.RECYCLE_THRESHOLD) {
          // Find the frontmost Z position of all other streetlights
          let frontmostZ = -Infinity;
          for (let j = 0; j < streetlights.length; j++) {
            if (j !== i) {
              const otherBox = new THREE.Box3().setFromObject(streetlights[j]);
              if (otherBox.max.z > frontmostZ) {
                frontmostZ = otherBox.max.z;
              }
            }
          }

          // If no other streetlights found, use a default position
          if (frontmostZ === -Infinity) {
            frontmostZ = cameraZ + 10; // Place ahead of camera
          }

          // Move streetlight to front, maintaining spacing
          streetlight.position.z = frontmostZ + this.STREETLIGHT_SPACING;
          // Enforce correct x and y positions
          streetlight.position.x = xPosition;
          streetlight.position.y = this.STREETLIGHT_Y;
        }
      }
    };

    // Helper function to enforce positions for all streetlights
    const enforceStreetlightPositions = (streetlights, xPosition) => {
      streetlights.forEach(streetlight => {
        streetlight.position.x = xPosition;
        streetlight.position.y = this.STREETLIGHT_Y;
      });
    };

    // Recycle regular streetlights
    const streetlights = Editor.getStreetlights();
    recycleStreetlights(streetlights, this.STREETLIGHT_X_REGULAR);
    enforceStreetlightPositions(streetlights, this.STREETLIGHT_X_REGULAR);

    // Recycle mirror streetlights
    const mirrorStreetlights = Editor.getMirrorStreetlights();
    recycleStreetlights(mirrorStreetlights, this.STREETLIGHT_X_MIRROR);
    enforceStreetlightPositions(mirrorStreetlights, this.STREETLIGHT_X_MIRROR);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  setInitialPosition(roadLength) {
    const eyeLevel = 1.7;
    const startZ = Math.min(0, -roadLength * 0.3);
    this.camera.position.set(0, eyeLevel, startZ);
    this.camera.rotation.set(0, Math.PI, 0);
  }
}
