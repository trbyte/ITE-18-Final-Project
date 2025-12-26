import * as THREE from 'three';

export class CarController {
  constructor(scene, loader, onLoaded) {
    this.scene = scene;
    this.loader = loader;

    this.mesh = null;
    this.score = 0; // Keeping score property for your database logic

    // Driving Properties
    this.maxSpeed = 0.15;

    // Collision & Feedback Properties
    this.roadLimit = 1.5; 
    this.bounceStrength = 0.04; 
    this.shakeIntensity = 0;

    this.keys = { w: false, a: false, s: false, d: false };

    this.setupControls();

    const possiblePaths = [
      '/assets/models/car/scene.gltf',
      './assets/models/car/scene.gltf',
      '../assets/models/car/scene.gltf',
      'client/assets/models/car/scene.gltf'
    ];

    const tryLoadPath = (pathIndex) => {
      if (pathIndex >= possiblePaths.length) {
        console.error('CRITICAL: Car model not found.');
        if (onLoaded) onLoaded(this);
        return;
      }

      const currentPath = possiblePaths[pathIndex];
      this.loader.setPath(''); 

      this.loader.load(currentPath, (gltf) => {
        this.mesh = gltf.scene;
        this.mesh.rotation.y = 0; 
        this.mesh.position.set(0, 0, 0);
        this.mesh.scale.set(0.20, 0.20, 0.20);

        // OPTIMIZATION: Simple shadow setup to prevent lag
        this.mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.scene.add(this.mesh);
        if (onLoaded) onLoaded(this);
      }, 
      undefined, 
      () => tryLoadPath(pathIndex + 1));
    };

    tryLoadPath(0);
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

  update(camera = null) {
    if (!this.mesh) return; 

    const moveSpeed = this.maxSpeed;

    // 1. Simple WASD Movement (No wheel spin)
    if (this.keys.w) {
      this.mesh.position.z += moveSpeed;
      this.score += 0.1; // Accumulate score while moving forward
    }
    if (this.keys.s) {
      this.mesh.position.z -= moveSpeed;
    }
    if (this.keys.a) {
      this.mesh.position.x += moveSpeed;
    }
    if (this.keys.d) {
      this.mesh.position.x -= moveSpeed;
    }

    // 2. Collision with Road Edge
    if (this.mesh.position.x > this.roadLimit) {
      this.mesh.position.x = this.roadLimit - this.bounceStrength;
      this.mesh.rotation.z = 0.08; 
      this.shakeIntensity = 0.15; 
      this.score = Math.max(0, this.score - 0.5); // Collision penalty
    } else if (this.mesh.position.x < -this.roadLimit) {
      this.mesh.position.x = -this.roadLimit + this.bounceStrength;
      this.mesh.rotation.z = -0.08; 
      this.shakeIntensity = 0.15; 
      this.score = Math.max(0, this.score - 0.5); // Collision penalty
    } else {
      this.mesh.rotation.z *= 0.9; 
    }

    // 3. Camera Shake
    if (camera && this.shakeIntensity > 0) {
      camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.85; 
    }
  }
}