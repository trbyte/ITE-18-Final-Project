import * as THREE from 'three';

export class CarController {
  constructor(scene, loader, onLoaded) {
    this.scene = scene;
    this.loader = loader;

    this.mesh = null;

    // Driving
    this.speed = 0;
    this.maxSpeed = 0.4;
    this.acceleration = 0.01;
    this.brake = 0.02;
    this.turnSpeed = 0.03;

    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false
    };

    this.setupControls();

    loader.load('./models/car.glb', (gltf) => {
      this.mesh = gltf.scene;

      // GLTF car orientation fix (most cars face -Z)
      this.mesh.rotation.y = Math.PI;

      this.mesh.position.set(0, 0, 0);
      this.mesh.scale.set(1, 1, 1);

      this.scene.add(this.mesh);

      if (onLoaded) onLoaded(this);
    });
  }

  setupControls() {
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (k in this.keys) this.keys[k] = true;
    });

    window.addEventListener('keyup', e => {
      const k = e.key.toLowerCase();
      if (k in this.keys) this.keys[k] = false;
    });
  }

  update() {
    if (!this.mesh) return;

    // ACCEL / BRAKE
    if (this.keys.w) {
      this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
    } else if (this.keys.s) {
      this.speed = Math.max(this.speed - this.brake, -this.maxSpeed / 2);
    } else {
      this.speed *= 0.98; // friction
    }

    // STEERING
    if (this.keys.a) this.mesh.rotation.y += this.turnSpeed;
    if (this.keys.d) this.mesh.rotation.y -= this.turnSpeed;

    // MOVE FORWARD
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
    this.mesh.position.add(forward.multiplyScalar(this.speed));
  }
}
