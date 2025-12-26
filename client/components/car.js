import * as THREE from 'three';

export class CarController {
  constructor(scene, loader, onLoaded) {
    this.scene = scene;
    this.loader = loader;

    this.mesh = null;
    this.wheels = [];       
    this.frontWheels = [];  

    // Driving Properties
    this.speed = 0;
    this.maxSpeed = 0.15;
    this.acceleration = 0.01;
    this.brake = 0.02;
    this.turnSpeed = 0.03;

    // Collision & Feedback Properties
    this.roadLimit = 1.5; 
    this.bounceStrength = 0.04; 
    this.shakeIntensity = 0;

    this.keys = { w: false, a: false, s: false, d: false };

    this.setupControls();

    // These paths are checked one by one
    const possiblePaths = [
      '/assets/models/car/scene.gltf',         // Root level
      './assets/models/car/scene.gltf',        // Current level
      '../assets/models/car/scene.gltf',       // Up one level
      'client/assets/models/car/scene.gltf'    // Specific to your server structure
    ];

    const tryLoadPath = (pathIndex) => {
      if (pathIndex >= possiblePaths.length) {
        console.error('CRITICAL: Car model not found. Check your folder structure!');
        if (onLoaded) onLoaded(this);
        return;
      }

      const currentPath = possiblePaths[pathIndex];
      
      // IMPORTANT: Reset the loader path to empty so it doesn't prefix the URL
      this.loader.setPath(''); 

      console.log(`Attempting to load: ${currentPath}`);

      this.loader.load(currentPath, (gltf) => {
        console.log('SUCCESS: Car loaded from:', currentPath);
        this.mesh = gltf.scene;
        
        // Setup
        this.mesh.rotation.y = 0; 
        this.mesh.position.set(0, 0, 0);
        this.mesh.scale.set(0.20, 0.20, 0.20);

        this.mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const name = child.name.toLowerCase();
            if (name.includes('wheel')) {
              this.wheels.push(child);
              if (name.includes('front') || name.includes('f_')) {
                this.frontWheels.push(child);
              }
            }
          }
        });

        this.scene.add(this.mesh);
        if (onLoaded) onLoaded(this);
      }, 
      undefined, 
      () => {
        console.warn(`Failed: ${currentPath}`);
        tryLoadPath(pathIndex + 1);
      });
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
    if (!this.mesh) return; // Exit if model isn't loaded yet

    const moveSpeed = this.maxSpeed;
    const wheelSpinSpeed = 0.1;
    const steerAngle = 0.4;

    // 1. Driving & Wheel Spin
    if (this.keys.w) {
      this.mesh.position.z += moveSpeed;
      this.wheels.forEach(w => w.rotation.x += wheelSpinSpeed);
    }
    if (this.keys.s) {
      this.mesh.position.z -= moveSpeed;
      this.wheels.forEach(w => w.rotation.x -= wheelSpinSpeed);
    }

    // 2. Turning & Wheel Steering
    if (this.keys.a) {
      this.mesh.position.x += moveSpeed;
      this.frontWheels.forEach(w => w.rotation.y = steerAngle);
    } else if (this.keys.d) {
      this.mesh.position.x -= moveSpeed;
      this.frontWheels.forEach(w => w.rotation.y = -steerAngle);
    } else {
      this.frontWheels.forEach(w => w.rotation.y = 0);
    }

    // 3. Collision with Road Edge
    if (this.mesh.position.x > this.roadLimit) {
      this.mesh.position.x = this.roadLimit - this.bounceStrength;
      this.mesh.rotation.z = 0.08; // Tilt
      this.shakeIntensity = 0.15; // Set shake
    } else if (this.mesh.position.x < -this.roadLimit) {
      this.mesh.position.x = -this.roadLimit + this.bounceStrength;
      this.mesh.rotation.z = -0.08; // Tilt
      this.shakeIntensity = 0.15; // Set shake
    } else {
      this.mesh.rotation.z *= 0.9; // Smooth recovery
    }

    // 4. Camera Shake
    if (camera && this.shakeIntensity > 0) {
      camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.85; // Faster fade out
    }
  }
}