// Scene Component - Handles scene setup, lighting, and renderer
import * as THREE from 'three';

export class SceneManager {
  constructor(canvas) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    
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
      // Editor Mode: Check if object is being dragged
      if (window.EDITOR_MODE && window.Editor) {
        const draggableObjects = window.Editor.getDraggableObjects();
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, this.camera);

        const intersects = raycaster.intersectObjects(draggableObjects);
        if (intersects.length > 0) {
          // User clicked on a draggable object, let DragControls handle it
          return;
        }
      }

      // Only handle right/middle mouse for camera panning
      if (e.button === 1 || e.button === 2) {
        isPanning = true;
        panStart.set(e.clientX, e.clientY);
        e.preventDefault();
      }
    });

    canvas.addEventListener("mousemove", (e) => {
      // Editor Mode: Don't pan camera while dragging objects
      if (window.EDITOR_MODE && window.Editor) {
        const draggableObjects = window.Editor.getDraggableObjects();
        const isDragging = draggableObjects.some(obj => obj.userData?.isDragging);
        if (isDragging) {
          return; // Let DragControls handle the drag
        }
      }

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
