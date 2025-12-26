import * as THREE from 'three';

export class CarController {
  constructor(scene, loader, onLoaded) {
    this.scene = scene;
    this.loader = loader;

    this.mesh = null;

    // Driving
    this.speed = 0;
    this.maxSpeed = 0.15;
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

    const possiblePaths = [
      'scene.gltf',
      '../assets/models/car/scene.gltf',
      'assets/models/car/scene.gltf',
      './assets/models/car/scene.gltf'
    ];

    const tryLoadPath = (pathIndex) => {
      if (pathIndex >= possiblePaths.length) {
        console.error('Error: Could not find car model file');
        if (onLoaded) onLoaded(this);
        return;
      }

      const modelPath = possiblePaths[pathIndex];

      if (modelPath.includes('/')) {
        const pathParts = modelPath.split('/');
        pathParts.pop();
        loader.setPath(pathParts.join('/') + '/');
      } else {
        loader.setPath('../assets/models/car/');
      }

      loader.load(
        modelPath.includes('/') ? modelPath.split('/').pop() : modelPath,
        (gltf) => {
          this.mesh = gltf.scene;

          // GLTF car orientation fix (most cars face -Z)
          this.mesh.rotation.y = Math.PI / 2; // Rotated to the right

          this.mesh.position.set(0, 0, 0);
          this.mesh.scale.set(0.009, 0.009, 0.009);

          // Setup shadows
          this.mesh.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          this.scene.add(this.mesh);

          if (onLoaded) onLoaded(this);
        },
        (progress) => {
          // Loading progress
        },
        (error) => {
          tryLoadPath(pathIndex + 1);
        }
      );
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

  update() {
    if (!this.mesh) return;

    // Movement directions (fixed world directions):
    // W → South (+Z)
    // A → East (+X)
    // D → West (-X)
    // S → North (-Z)
    
    const moveSpeed = this.maxSpeed;
    
    // W - Move South (positive Z)
    if (this.keys.w) {
      this.mesh.position.z += moveSpeed;
    }
    
    // S - Move North (negative Z)
    if (this.keys.s) {
      this.mesh.position.z -= moveSpeed;
    }
    
    // A - Move East (positive X)
    if (this.keys.a) {
      this.mesh.position.x += moveSpeed;
    }
    
    // D - Move West (negative X)
    if (this.keys.d) {
      this.mesh.position.x -= moveSpeed;
    }
  }
}
