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

    const moveSpeed = this.maxSpeed;
    const wheelSpinSpeed = 0.1;
    const steerAngle = 0.4;

    // 1. Calculate forward movement for scoring
    const currentZ = this.mesh.position.z;
    const forwardMovement = this.lastZPosition - currentZ; // Negative = forward
    
    // Only award points for forward movement (negative forwardMovement)
    if (forwardMovement < 0) {
      this.distanceTraveled += Math.abs(forwardMovement);
      
      // Award 5 points per unit of forward travel
      const unitsTraveled = Math.floor(this.distanceTraveled);
      this.score = unitsTraveled * this.scorePerUnit;
      
      // Update score display
      this.updateScoreDisplay();
    }
    
    // Update last position for next frame
    this.lastZPosition = currentZ;

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

    // 5. Collision Detection with Barriers (FIXED: Use this.barriers not barriers)
    if (this.barriers && this.barriers.length > 0) {  
      let collisionDetected = false;
      this.barriers.forEach((barrier, index) => {  
        if (!barrier || !barrier.position) return;
        
        const distance = this.mesh.position.distanceTo(barrier.position);
        
        // Debug: Log when getting close to a barrier
        if (distance < 5.0 && Math.random() < 0.1) {
          console.log(`Getting close to barrier ${index}: ${distance.toFixed(2)} units`);
        }
        
        if (distance < 1.5) { 
          console.log(`COLLISION DETECTED! Barrier ${index}, Distance: ${distance.toFixed(2)}`);
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

 triggerGameOver() {
  if (this.isGameOver) return;
  this.isGameOver = true;
  
  // Make sure we get the current score, not a cached one
  const finalScore = Math.floor(this.mesh ? Math.max(0, this.mesh.position.z) : this.score);
  
  console.log('Game Over! Final Score:', finalScore); // Debug log
  
  // Show game over modal
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
  
  // Save score to database and check for highscore
  this.saveScoreToDB(finalScore).then(result => {
    // If it was a new highscore, show celebration
    if (result && result.isNewHighscore) {
      this.showHighscoreCelebration(finalScore);
    }
  }).catch(error => {
    console.error('Error saving score:', error);
    // Fallback to localStorage check
    this.checkLocalHighscore(finalScore);
  });
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
      🎉 NEW HIGHSCORE! 🎉<br>
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
      console.warn("Not logged in - score won't be saved");
      return;
    }
    
    console.log(`Saving score ${score} for ${username}`);
    
    const response = await fetch('http://localhost:5000/api/save-score', {
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
      console.log("Score saved to database:", result.message);
      
      // Update final score display
      const finalScoreElement = document.getElementById('final-score');
      if (finalScoreElement) {
        finalScoreElement.textContent = score;
      }
    } else {
      const errorData = await response.json();
      console.error("Failed to save score:", errorData.error);
      
      // Show error in game over modal
      const finalScoreElement = document.getElementById('final-score');
      if (finalScoreElement) {
        finalScoreElement.innerHTML = `${score}<br><small style="color: #ff6b6b; font-size: 0.8em;">(Save failed: ${errorData.error || 'Server error'})</small>`;
      }
    }
  } catch (err) {
    console.error("Network error saving score:", err);
    
    // Show network error in game over modal
    const finalScoreElement = document.getElementById('final-score');
    if (finalScoreElement) {
      finalScoreElement.innerHTML = `${score}<br><small style="color: #ff6b6b; font-size: 0.8em;">(Network error - score not saved)</small>`;
    }
  }
  }
}