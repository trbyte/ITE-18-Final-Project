// Road Component - Handles road loading and recycling
import * as THREE from 'three';

export class RoadManager {
  constructor(scene, loader, onRoadLoaded) {
    this.scene = scene;
    this.loader = loader;
    this.onRoadLoaded = onRoadLoaded;
    this.roadSegments = [];
    this.localMinZOffset = 0;
    this.localMaxZOffset = 0;
    this.segmentOverlap = 0.9;
    this.streetRoad = null;
    this.ground = null;
  }

  loadStreetRoad() {
    const possiblePaths = [
      'scene.gltf',
      '../assets/models/street_road/scene.gltf',
      'assets/models/street_road/scene.gltf',
      './assets/models/street_road/scene.gltf'
    ];

    const tryLoadPath = (pathIndex) => {
      if (pathIndex >= possiblePaths.length) {
        document.getElementById('status').textContent = 'Error: Could not find model file';
        return;
      }

      const modelPath = possiblePaths[pathIndex];

      if (modelPath.includes('/')) {
        const pathParts = modelPath.split('/');
        pathParts.pop();
        this.loader.setPath(pathParts.join('/') + '/');
      } else {
        this.loader.setPath('../assets/models/street_road/');
      }

      this.loader.load(
        modelPath.includes('/') ? modelPath.split('/').pop() : modelPath,
        (gltf) => {
          this.streetRoad = gltf.scene;

          this.streetRoad.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(mat => {
                    if (mat) {
                      mat.needsUpdate = true;
                      if (mat.map) mat.map.needsUpdate = true;
                      if (mat.normalMap) mat.normalMap.needsUpdate = true;
                    }
                  });
                } else {
                  child.material.needsUpdate = true;
                  if (child.material.map) child.material.map.needsUpdate = true;
                  if (child.material.normalMap) child.material.normalMap.needsUpdate = true;
                }
              }
            }
          });

          let box = new THREE.Box3().setFromObject(this.streetRoad);
          let size = box.getSize(new THREE.Vector3());
          const maxDimension = Math.max(size.x, size.y, size.z);

          const scale = 80 / maxDimension;
          this.streetRoad.scale.multiplyScalar(scale);
          box.setFromObject(this.streetRoad);
          size = box.getSize(new THREE.Vector3());

          this.streetRoad.scale.x *= 3.0;
          box.setFromObject(this.streetRoad);
          size = box.getSize(new THREE.Vector3());

          const finalCenter = box.getCenter(new THREE.Vector3());
          const finalMin = box.min;

          this.streetRoad.position.x = -finalCenter.x;
          this.streetRoad.position.y = -finalMin.y;
          this.streetRoad.position.z = -finalCenter.z;

          this.scene.add(this.streetRoad);

          const positionedBox = new THREE.Box3().setFromObject(this.streetRoad);
          const positionedMax = positionedBox.max;

          const localBox = new THREE.Box3().setFromObject(this.streetRoad);
          this.localMinZOffset = localBox.min.z - this.streetRoad.position.z;
          this.localMaxZOffset = localBox.max.z - this.streetRoad.position.z;

          this.roadSegments = [this.streetRoad];
          const numberOfSegments = 30;
          let currentEndZ = positionedMax.z;

          for (let i = 1; i < numberOfSegments; i++) {
            const roadSegment = this.streetRoad.clone();
            roadSegment.position.x = this.streetRoad.position.x;
            roadSegment.position.y = this.streetRoad.position.y;
            roadSegment.position.z = currentEndZ - this.segmentOverlap - this.localMinZOffset;
            currentEndZ = roadSegment.position.z + this.localMaxZOffset;

            this.scene.add(roadSegment);
            this.roadSegments.push(roadSegment);
          }

          this.createGround();
          this.onRoadLoaded(this.streetRoad, size);
        },
        (progress) => {
          if (progress.lengthComputable) {
            const percent = (progress.loaded / progress.total * 100).toFixed(0);
            document.getElementById('status').textContent = `Loading: ${percent}%`;
          } else {
            document.getElementById('status').textContent = 'Loading model...';
          }
        },
        (error) => {
          tryLoadPath(pathIndex + 1);
        }
      );
    };

    tryLoadPath(0);
  }

  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(10000, 10000);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x90EE90 });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.1;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  recycleRoadSegments(cameraZ) {
    if (this.roadSegments.length === 0) return;

    const recycleThreshold = 5;

    for (let i = 0; i < this.roadSegments.length; i++) {
      const segment = this.roadSegments[i];
      const segmentBox = new THREE.Box3().setFromObject(segment);
      const segmentMaxZ = segmentBox.max.z;

      if (segmentMaxZ < cameraZ - recycleThreshold) {
        let frontmostZ = -Infinity;
        for (let j = 0; j < this.roadSegments.length; j++) {
          if (j !== i) {
            const otherBox = new THREE.Box3().setFromObject(this.roadSegments[j]);
            if (otherBox.max.z > frontmostZ) {
              frontmostZ = otherBox.max.z;
            }
          }
        }

        segment.position.z = frontmostZ - this.segmentOverlap - this.localMinZOffset;
        segment.position.x = this.roadSegments[0].position.x;
        segment.position.y = this.roadSegments[0].position.y;
      }
    }
  }

  getRoadSegments() {
    return this.roadSegments;
  }
}

