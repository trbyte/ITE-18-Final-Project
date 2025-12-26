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
    this.lastForwardDirection = new THREE.Vector3(0, 0, 1); // Default to South

    
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
    // --- CAR FOLLOW MODE (3rd Person View) ---
    const car = this.car.mesh;

    // Access car's keys through the car controller
    const carKeys = this.car.keys || {};
    
    // Only update camera direction when moving forward/backward (W/S)
    // A/D (left/right) should not change the camera perspective
    // W → South (+Z), S → North (-Z)
    if (carKeys.w) {
      this.lastForwardDirection.set(0, 0, 1); // South
    } else if (carKeys.s) {
      this.lastForwardDirection.set(0, 0, -1); // North
    }
    // If neither W nor S is pressed, keep the last forward direction

    // Camera position: behind and above the car
    // Use the last forward direction (not affected by A/D)
    const cameraDistance = 5; // Distance behind car
    const cameraHeight = 3; // Height above car
    
    const desiredPos = car.position.clone();
    desiredPos.sub(this.lastForwardDirection.clone().multiplyScalar(cameraDistance));
    desiredPos.y = car.position.y + cameraHeight;

    // Smooth camera follow (higher lerp value for more responsive following)
    // This ensures camera moves at nearly the same speed as the car
    this.camera.position.lerp(desiredPos, 0.3);

    // Camera looks at a point ahead of the car in the forward direction
    // This maintains the same perspective regardless of left/right movement
    const lookAheadDistance = 5;
    const lookAtPos = car.position.clone();
    lookAtPos.add(this.lastForwardDirection.clone().multiplyScalar(lookAheadDistance));
    lookAtPos.y = car.position.y + 1; // Look slightly above ground
    
    this.camera.lookAt(lookAtPos);

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
