import * as THREE from 'three';

export class CarController {
  constructor(scene, loader, onLoaded) {
    this.scene = scene;
    this.loader = loader;

    this.mesh = null;
    this.wheels = [];       
    this.frontWheels = [];  

    // Driving Properties
    this.baseSpeed = 0.08;  // Starting speed (slow)
    this.maxSpeed = 0.08;    // Current max speed (will increase with score)
    this.absoluteMaxSpeed = 0.5;  // Maximum speed limit (never exceed this)
    this.scoreForMaxSpeed = 1400;  // Score needed to reach max speed (gradual progression)
    this.baseLateralSpeed = 0.08;  // Base speed for left/right movement (stays relatively constant)
    this.maxLateralSpeed = 0.12;  // Maximum lateral speed (doesn't increase as much as forward speed)

    // Collision & Feedback Properties
    this.roadLimit = 1.5; 
    this.bounceStrength = 0.04; 
    this.shakeIntensity = 0;
    this.barriers = []; 
    this.isGameOver = false; 

    // Scoring Properties
    this.score = 0;
    this.lastZPosition = 0; // Track last position for distance calculation
    this.distanceTraveled = 0; // Total forward distance
    this.scorePerUnit = 5; // Points per unit of forward travel

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

      console.log(`Attempting to load: ${currentPath}`);

      this.loader.load(currentPath, (gltf) => {
        console.log('SUCCESS: Car loaded from:', currentPath);
        this.mesh = gltf.scene;
        
        // Setup
        this.mesh.rotation.y = 0; 
        this.mesh.position.set(0, 0, 0);
        this.mesh.scale.set(0.95, 0.95, 0.95);
        
        // Initialize tracking variables
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

    // Update barriers if provided
    if (barriers && Array.isArray(barriers)) {
      this.barriers = barriers;
    }

    // 1. Calculate forward movement for scoring
    const currentZ = this.mesh.position.z;
    const forwardMovement = this.lastZPosition - currentZ; // Negative = forward
    
    // Only award points for forward movement (negative forwardMovement)
    if (forwardMovement < 0) {
      this.distanceTraveled += Math.abs(forwardMovement);
      
      // Award 5 points per unit of forward travel
      const unitsTraveled = Math.floor(this.distanceTraveled);
      this.score = unitsTraveled * this.scorePerUnit;
      
      // Update speed based on score (gradually increases from slow start to max speed)
      const speedProgress = Math.min(this.score / this.scoreForMaxSpeed, 1.0);
      this.maxSpeed = this.baseSpeed + (speedProgress * (this.absoluteMaxSpeed - this.baseSpeed));
      
      // Update score display
      this.updateScoreDisplay();
    }
    
    // Update last position for next frame
    this.lastZPosition = currentZ;

    const moveSpeed = this.maxSpeed;
    // Lateral speed increases slightly with score but much slower than forward speed
    const speedProgress = Math.min(this.score / this.scoreForMaxSpeed, 1.0);
    const lateralSpeed = this.baseLateralSpeed + (speedProgress * (this.maxLateralSpeed - this.baseLateralSpeed));
    const wheelSpinSpeed = 0.1;
    const steerAngle = 0.4;

    // 2. Movement Logic
    if (this.keys.w) {
      this.mesh.position.z += moveSpeed;
      this.wheels.forEach(w => w.rotation.x += wheelSpinSpeed);
    }
    if (this.keys.s) {
      this.mesh.position.z -= moveSpeed;
      this.wheels.forEach(w => w.rotation.x -= wheelSpinSpeed);
    }

    if (this.keys.a) {
      this.mesh.position.x += lateralSpeed;
      this.frontWheels.forEach(w => w.rotation.y = steerAngle);
    } else if (this.keys.d) {
      this.mesh.position.x -= lateralSpeed;
      this.frontWheels.forEach(w => w.rotation.y = -steerAngle);
    } else {
      this.frontWheels.forEach(w => w.rotation.y = 0);
    }

    // 3. Collision with Road Edge
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

    // 4. Camera Shake
    if (camera && this.shakeIntensity > 0) {
      camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.90;
    }

    // 5. Collision Detection with Barriers
    if (this.barriers && this.barriers.length > 0) {  
      let collisionDetected = false;
      this.barriers.forEach((barrier) => {  
        if (!barrier || !barrier.position) return;
        
        const distance = this.mesh.position.distanceTo(barrier.position);
        
        if (distance < 1.5) { 
          collisionDetected = true;
        }
      });
      
      if (collisionDetected) {
        this.triggerGameOver();
      }
    }
  }

  updateScoreDisplay() {
    const scoreElement = document.getElementById('score-value');
    if (scoreElement) {
      scoreElement.innerText = this.score;
    }
  }

  saveToLocalStorage(score) {
    try {
      const scoreStr = score.toString();
      
      localStorage.setItem('lastSessionScore', scoreStr);
      localStorage.setItem('driveSmartLatestScore', scoreStr);
      localStorage.setItem('latestScore', scoreStr);
      localStorage.setItem('currentScore', scoreStr);
      
      const scoreData = {
        score: score,
        timestamp: Date.now(),
        date: new Date().toLocaleString()
      };
      localStorage.setItem('latestScoreData', JSON.stringify(scoreData));
      
      this.updateLocalHighScore(score);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  updateLocalHighScore(score) {
    try {
      const currentHighScore = parseInt(localStorage.getItem('driveSmartHighScore') || '0');
      const globalHighScore = parseInt(localStorage.getItem('gameHighscore') || '0');
      
      if (score > currentHighScore) {
        localStorage.setItem('driveSmartHighScore', score.toString());
      }
      
      if (score > globalHighScore) {
        localStorage.setItem('gameHighscore', score.toString());
      }
      
      return score > currentHighScore || score > globalHighScore;
    } catch (error) {
      console.error('Error updating local high score:', error);
      return false;
    }
  }

  triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    
    const finalScore = Math.floor(this.score);
    
    this.saveToLocalStorage(finalScore);
    this.showGameOverModal(finalScore);
    
    // Save score to database and check for highscore
    this.saveScoreToDB(finalScore).then(result => {
      if (result && result.isNewHighscore) {
        this.showHighscoreCelebration(finalScore);
      }
    }).catch(() => {
      this.checkLocalHighscore(finalScore);
    });
  }

  showGameOverModal(finalScore) {
    const modal = document.getElementById('game-over-modal');
    const finalScoreElement = document.getElementById('final-score');
    
    if (modal) {
      // Make sure modal is properly positioned
      modal.style.display = 'flex';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';
      modal.style.zIndex = '9999'; // Very high z-index
      
      // Remove any existing celebration messages
      const existingCelebration = modal.querySelector('.celebration-message');
      if (existingCelebration) {
        existingCelebration.remove();
      }
    }
    
    if (finalScoreElement) {
      finalScoreElement.textContent = finalScore;
    }
  }

  checkLocalHighscore(finalScore) {
    // Get current highscore from localStorage
    const currentHighscore = parseInt(localStorage.getItem('gameHighscore')) || 0;
    
    // Check if this is a new highscore
    if (finalScore > currentHighscore) {
      // Update localStorage
      localStorage.setItem('gameHighscore', finalScore.toString());
      
      // Show celebration
      this.showHighscoreCelebration(finalScore);
    }
  }

  showHighscoreCelebration(score) {
    const modal = document.getElementById('game-over-modal');
    if (!modal) return;
    
    // Create celebration message
    const message = document.createElement('div');
    message.className = 'celebration-message';
    message.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #FFD700, #FFA500);
        color: #000;
        padding: 15px;
        border-radius: 10px;
        margin: 15px 0;
        text-align: center;
        font-size: 1.2em;
        border: 2px solid #000;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
      ">
        NEW HIGHSCORE! <br>
        <strong style="font-size: 1.5em;">${score} points!</strong>
      </div>
    `;
    
    // Add to modal content
    const modalContent = modal.querySelector('div');
    if (modalContent) {
      // Insert after the final score paragraph
      const scoreParagraph = modalContent.querySelector('p:nth-child(3)'); // The paragraph with final score
      if (scoreParagraph) {
        modalContent.insertBefore(message, scoreParagraph.nextSibling);
      } else {
        // Fallback: insert before buttons
        const buttons = modalContent.querySelector('button');
        if (buttons) {
          modalContent.insertBefore(message, buttons);
        }
      }
    }
  }

  async saveScoreToDB(score) {
    try {
      const token = localStorage.getItem('gameToken');
      const username = localStorage.getItem('gameUsername');
      
      if (!token || !username) {
        console.warn("Not logged in - score won't be saved to database");
        return { isNewHighscore: false };
      }
      
      const apiBase = window.API_BASE || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/save-score`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          score: parseInt(score)
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const finalScoreElement = document.getElementById('final-score');
        if (finalScoreElement) {
          finalScoreElement.textContent = score;
        }
        return result;
      } else {
        const errorData = await response.json();
        console.error("Failed to save score to database:", errorData.error);
        return { isNewHighscore: false };
      }
    } catch (err) {
      console.error("Network error saving score to database:", err);
      return { isNewHighscore: false };
    }
  }
}