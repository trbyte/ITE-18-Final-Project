import * as THREE from 'three';

export class SceneManager {
  constructor(canvas) {
    this.scene = new THREE.Scene();
    this.setupSkybox();
    
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);

    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.setupLighting();
  }

  setupSkybox() {
    const skyTexture = this.createProceduralSkyTexture();
    const skyGeometry = new THREE.SphereGeometry(450, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide
    });
    this.skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.skyMesh);
  }
  
  updateSkybox() {
    // Make sky follow camera position so it's always around the player
    if (this.skyMesh && this.camera) {
      this.skyMesh.position.copy(this.camera.position);
    }
  }

  createProceduralSkyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e3c72');
    gradient.addColorStop(0.4, '#2e5c9a');
    gradient.addColorStop(0.7, '#87ceeb');
    gradient.addColorStop(1, '#e8f4f8');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.drawCloud(ctx, 150, 120, 80, 40);
    this.drawCloud(ctx, 500, 150, 100, 50);
    this.drawCloud(ctx, 850, 100, 70, 35);
    this.drawCloud(ctx, 300, 250, 90, 45);
    this.drawCloud(ctx, 700, 200, 85, 42);

    return new THREE.CanvasTexture(canvas);
  }

  drawCloud(ctx, x, y, width, height) {
    ctx.beginPath();
    ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - width * 0.4, y, width * 0.6, height * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + width * 0.4, y, width * 0.6, height * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
  }

  setupMouseControls() {
    const canvas = this.renderer.domElement;
    let isPanning = false;
    let panStart = new THREE.Vector2();
    let zoomLevel = this.camera.fov;

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      zoomLevel += e.deltaY * 0.01;
      zoomLevel = Math.max(10, Math.min(120, zoomLevel));
      this.camera.fov = zoomLevel;
      this.camera.updateProjectionMatrix();
    });

    canvas.addEventListener("mousedown", (e) => {
      // Only handle right/middle mouse for camera panning
      if (e.button === 1 || e.button === 2) {
        isPanning = true;
        panStart.set(e.clientX, e.clientY);
        e.preventDefault();
      }
    });

    canvas.addEventListener("mousemove", (e) => {
      if (isPanning) {
        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;
        const panSpeed = 0.01;
        const right = new THREE.Vector3();
        this.camera.getWorldDirection(new THREE.Vector3());
        right.setFromMatrixColumn(this.camera.matrix, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 1);

        this.camera.position.add(right.multiplyScalar(-deltaX * panSpeed));
        this.camera.position.add(up.multiplyScalar(deltaY * panSpeed));

        panStart.set(e.clientX, e.clientY);
      }
    });

    canvas.addEventListener("mouseup", (e) => {
      if (e.button === 1 || e.button === 2) {
        isPanning = false;
      }
    });

    canvas.addEventListener("mouseleave", () => {
      isPanning = false;
    });

    canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  getRenderer() {
    return this.renderer;
  }
}
