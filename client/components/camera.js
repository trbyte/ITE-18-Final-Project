import * as THREE from 'three';

export class CameraController {
  constructor(camera, roadManager, streetlightManager, barrierManager = null) {
    this.camera = camera;
    this.roadManager = roadManager;
    this.streetlightManager = streetlightManager;
    this.barrierManager = barrierManager;
    this.keys = {};
    this.moveSpeed = 0.1;
    this.eyeLevel = 1.7;
    this.car = null;
    this.lastForwardDirection = new THREE.Vector3(0, 0, 1);

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
      const car = this.car.mesh;
      const carKeys = this.car.keys || {};
      
      if (carKeys.w) {
        this.lastForwardDirection.set(0, 0, 1);
      }

      const desiredPos = car.position.clone();
      desiredPos.sub(this.lastForwardDirection.clone().multiplyScalar(5));
      desiredPos.y = car.position.y + 3;

      this.camera.position.lerp(desiredPos, 0.3);

      const lookAtPos = car.position.clone();
      lookAtPos.add(this.lastForwardDirection.clone().multiplyScalar(5));
      lookAtPos.y = car.position.y + 1;
      
      this.camera.lookAt(lookAtPos);
    } else {
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
    this.roadManager.recycleRoadSegments(cameraZ);
    this.recycleStreetlights(cameraZ);
    if (this.barrierManager) {
      this.barrierManager.recycleBarriers(cameraZ);
    }
  }
  recycleStreetlights(cameraZ) {
    const recycleStreetlights = (streetlights, xPosition, offset = 0) => {
      if (streetlights.length === 0) return;

      for (let i = 0; i < streetlights.length; i++) {
        const streetlight = streetlights[i];
        const streetlightZ = streetlight.position.z;

        if (streetlightZ < cameraZ - this.RECYCLE_THRESHOLD) {
          let frontmostZ = -Infinity;
          for (let j = 0; j < streetlights.length; j++) {
            if (j !== i) {
              const otherZ = streetlights[j].position.z;
              if (otherZ > frontmostZ) {
                frontmostZ = otherZ;
              }
            }
          }

          let newZ;
          if (frontmostZ === -Infinity) {
            const baseZ = Math.ceil((cameraZ + 10) / this.STREETLIGHT_SPACING) * this.STREETLIGHT_SPACING;
            newZ = baseZ + offset;
          } else {
            const frontmostBase = frontmostZ - offset;
            const frontmostGrid = Math.round(frontmostBase / this.STREETLIGHT_SPACING) * this.STREETLIGHT_SPACING;
            newZ = frontmostGrid + this.STREETLIGHT_SPACING + offset;
          }

          streetlight.position.set(xPosition, this.STREETLIGHT_Y, newZ);
        }
      }
    };

    const streetlights = this.streetlightManager.getStreetlights();
    recycleStreetlights(streetlights, this.STREETLIGHT_X_REGULAR, 0);
    streetlights.forEach(s => s.position.set(this.STREETLIGHT_X_REGULAR, this.STREETLIGHT_Y, s.position.z));

    const mirrorStreetlights = this.streetlightManager.getMirrorStreetlights();
    recycleStreetlights(mirrorStreetlights, this.STREETLIGHT_X_MIRROR, 4);
    mirrorStreetlights.forEach(s => s.position.set(this.STREETLIGHT_X_MIRROR, this.STREETLIGHT_Y, s.position.z));
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

