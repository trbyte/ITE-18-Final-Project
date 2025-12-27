import * as THREE from 'three';

export class CarController {
  constructor(scene, loader, onLoaded) {
    this.scene = scene;
    this.loader = loader;

    this.mesh = null;
    this.wheels = [];
    this.frontWheels = [];

    this.speed = 0;
    this.initialSpeed = 0.07;
    this.maxSpeed = 0.70;
    this.speedIncreaseDistance = 300.0;
    this.currentSpeed = this.initialSpeed;
    this.acceleration = 0.01;
    this.brake = 0.02;
    this.turnSpeed = 0.03;
    this.lateralMoveSpeed = 0.08;

    this.roadLimit = 1.5;
    this.bounceStrength = 0.04;
    this.shakeIntensity = 0;
    this.barriers = [];
    this.isGameOver = false;

    this.score = 0;
    this.lastZPosition = 0;
    this.distanceTraveled = 0;
    this.scorePerUnit = 5;

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
        console.error('CRITICAL: Car model not found. Check your folder structure!');
        if (onLoaded) onLoaded(this);
        return;
      }

      const currentPath = possiblePaths[pathIndex];
      this.loader.setPath('');

      this.loader.load(currentPath, (gltf) => {
        this.mesh = gltf.scene;
        
        this.mesh.rotation.y = 0;
        this.mesh.position.set(0, 0, 80);
        this.mesh.scale.set(0.95, 0.95, 0.95);
        this.lastZPosition = this.mesh.position.z;

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

  update(camera = null, barriers = null) {
    if (!this.mesh || this.isGameOver) return;

    if (barriers && Array.isArray(barriers)) {
      this.barriers = barriers;
    }

    const wheelSpinSpeed = 0.1;
    const steerAngle = 0.4;
    const currentZ = this.mesh.position.z;
    const forwardMovement = this.lastZPosition - currentZ;
    
    if (forwardMovement < 0) {
      this.distanceTraveled += Math.abs(forwardMovement);
      this.score = Math.floor(this.distanceTraveled) * this.scorePerUnit;
      this.updateScoreDisplay();
    }
    
    this.lastZPosition = currentZ;

    if (this.distanceTraveled >= this.speedIncreaseDistance) {
      this.currentSpeed = this.maxSpeed;
    } else {
      const speedProgress = this.distanceTraveled / this.speedIncreaseDistance;
      this.currentSpeed = this.initialSpeed + (this.maxSpeed - this.initialSpeed) * speedProgress;
    }

    if (this.keys.w) {
      this.mesh.position.z += this.currentSpeed;
      this.wheels.forEach(w => w.rotation.x += wheelSpinSpeed);
    }

    if (this.keys.a) {
      this.mesh.position.x += this.lateralMoveSpeed;
      this.frontWheels.forEach(w => w.rotation.y = steerAngle);
    } else if (this.keys.d) {
      this.mesh.position.x -= this.lateralMoveSpeed;
      this.frontWheels.forEach(w => w.rotation.y = -steerAngle);
    } else {
      this.frontWheels.forEach(w => w.rotation.y = 0);
    }

    if (this.mesh.position.x > this.roadLimit) {
      this.mesh.position.x = this.roadLimit - this.bounceStrength;
      this.mesh.rotation.z = 0.08;
      this.shakeIntensity = 0.15;
    } else if (this.mesh.position.x < -this.roadLimit) {
      this.mesh.position.x = -this.roadLimit + this.bounceStrength;
      this.mesh.rotation.z = -0.08;
      this.shakeIntensity = 0.15;
    } else {
      this.mesh.rotation.z *= 0.9;
    }

    if (camera && this.shakeIntensity > 0) {
      camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.90;
    }

    if (this.barriers && this.barriers.length > 0) {
      for (const barrier of this.barriers) {
        if (!barrier?.position) continue;
        if (this.mesh.position.distanceTo(barrier.position) < 1.5) {
          this.triggerGameOver();
          break;
        }
      }
    }
  }

  updateScoreDisplay() {
    const scoreElement = document.getElementById('score-value');
    if (scoreElement) {
      scoreElement.innerText = this.score;
    }
  }

  triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    
    const finalScore = this.score;
    const modal = document.getElementById('game-over-modal');
    const finalScoreElement = document.getElementById('final-score');
    
    if (modal) modal.style.display = 'flex';
    if (finalScoreElement) finalScoreElement.textContent = finalScore;
    
    this.saveScoreToDB(finalScore);
  }

  async saveScoreToDB(score) {
    try {
      const token = localStorage.getItem('gameToken');
      const username = localStorage.getItem('gameUsername');
      
      if (!token || !username) return;
      
      const response = await fetch('http://localhost:5000/api/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score: parseInt(score) })
      });
      
      const finalScoreElement = document.getElementById('final-score');
      if (response.ok) {
        if (finalScoreElement) finalScoreElement.textContent = score;
      } else {
        const errorData = await response.json();
        if (finalScoreElement) {
          finalScoreElement.innerHTML = `${score}<br><small style="color: #ff6b6b; font-size: 0.8em;">(Save failed: ${errorData.error || 'Server error'})</small>`;
        }
      }
    } catch (err) {
      const finalScoreElement = document.getElementById('final-score');
      if (finalScoreElement) {
        finalScoreElement.innerHTML = `${score}<br><small style="color: #ff6b6b; font-size: 0.8em;">(Network error - score not saved)</small>`;
      }
    }
  }
}