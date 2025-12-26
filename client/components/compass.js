// Compass Component - Handles compass direction display
import * as THREE from 'three';

export class Compass {
  constructor(camera) {
    this.camera = camera;
    this.compassElement = null;
    this.compassInner = null;
    this.createCompass();
  }

  createCompass() {
    // Create compass container
    const compass = document.createElement('div');
    compass.id = 'compass';
    compass.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      width: 120px;
      height: 120px;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.8);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create inner compass
    const compassInner = document.createElement('div');
    compassInner.id = 'compass-inner';
    compassInner.style.cssText = `
      position: relative;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%);
    `;

    // Create direction labels
    const directions = [
      { id: 'compass-n', text: 'N', top: '5px', left: '50%', color: '#ff4444' },
      { id: 'compass-e', text: 'E', right: '5px', top: '50%', color: '#ffffff' },
      { id: 'compass-s', text: 'S', bottom: '5px', left: '50%', color: '#ffffff' },
      { id: 'compass-w', text: 'W', left: '5px', top: '50%', color: '#ffffff' }
    ];

    directions.forEach(dir => {
      const label = document.createElement('div');
      label.id = dir.id;
      label.className = 'compass-direction';
      label.textContent = dir.text;
      label.style.cssText = `
        position: absolute;
        font-weight: bold;
        font-size: 14px;
        color: ${dir.color};
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        ${dir.top ? `top: ${dir.top};` : ''}
        ${dir.bottom ? `bottom: ${dir.bottom};` : ''}
        ${dir.left ? `left: ${dir.left}; transform: translateX(-50%);` : ''}
        ${dir.right ? `right: ${dir.right}; transform: translateY(-50%);` : ''}
      `;
      compassInner.appendChild(label);
    });

    // Create compass needle
    const needle = document.createElement('div');
    needle.id = 'compass-needle';
    needle.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 2px;
      height: 40px;
      background: #ff4444;
      transform-origin: bottom center;
      transform: translate(-50%, -100%) rotate(0deg);
      box-shadow: 0 0 5px rgba(255, 68, 68, 0.5);
    `;
    
    // Add arrow tip to needle
    const arrowTip = document.createElement('div');
    arrowTip.style.cssText = `
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-bottom: 10px solid #ff4444;
    `;
    needle.appendChild(arrowTip);
    
    compassInner.appendChild(needle);
    compass.appendChild(compassInner);
    document.body.appendChild(compass);

    this.compassElement = compass;
    this.compassInner = compassInner;
  }

  update() {
    if (!this.compassInner || !this.camera) return;

    // Get camera's forward direction vector
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.camera.quaternion);
    
    // Calculate the angle from North (-Z axis)
    // In Three.js: -Z is forward/North, +X is East, +Z is South, -X is West
    // atan2(x, -z) gives us the angle where:
    // - North (-Z): angle = 0
    // - East (+X): angle = π/2 (90°)
    // - South (+Z): angle = π (180°)
    // - West (-X): angle = -π/2 (-90°)
    const angle = Math.atan2(forward.x, -forward.z);
    
    // Convert to degrees and rotate compass (negative because CSS rotation is clockwise)
    const degrees = -angle * (180 / Math.PI);
    
    this.compassInner.style.transform = `rotate(${degrees}deg)`;
  }

  remove() {
    if (this.compassElement && this.compassElement.parentNode) {
      this.compassElement.parentNode.removeChild(this.compassElement);
    }
  }
}

