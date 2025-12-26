// Streetlight Component - Handles streetlight loading
import * as THREE from 'three';
import * as Editor from '../editor.js';

export class StreetlightManager {
  constructor(scene, loader) {
    this.scene = scene;
    this.loader = loader;
    
    // Streetlight position constants
    this.STREETLIGHT_X_REGULAR = 0.7659052966593223;
    this.STREETLIGHT_X_MIRROR = -0.8350271700107539;
    this.STREETLIGHT_Y = 0.08464134976573123;
    this.STREETLIGHT_SPACING = 15;
    
    // Model paths to try
    this.possiblePaths = [
      'scene.gltf',
      '../assets/models/bridge_street_light_3/scene.gltf',
      'assets/models/bridge_street_light_3/scene.gltf',
      './assets/models/bridge_street_light_3/scene.gltf'
    ];
  }

  loadStreetLight() {
    this.tryLoadModel((gltf) => {
      const streetLight = gltf.scene;
      this.setupStreetLightMesh(streetLight);
      streetLight.scale.multiplyScalar(0.01);

      // Create regular streetlights: z=0, 15, 30, 45, 60, 75
      const zPositions = [0, 15, 30, 45, 60, 75];
      zPositions.forEach((zPos, index) => {
        const streetlightIndex = index + 1;
        if (zPos === 0) {
          streetLight.position.set(this.STREETLIGHT_X_REGULAR, this.STREETLIGHT_Y, zPos);
          Editor.makeDraggable(streetLight, 'streetlight_1');
          this.scene.add(streetLight);
        } else {
          this.loadStreetLightAtZ(zPos, streetlightIndex);
        }
      });

      // Create mirror streetlights: z=4, 19, 34, 49, 64, 79
      const mirrorZPositions = [4, 19, 34, 49, 64, 79];
      mirrorZPositions.forEach((zPos, index) => {
        this.loadStreetLightAtZWithName(zPos, `streetlight_mirror_${index + 1}`);
      });

      if (!Editor.EDITOR_MODE) {
        Editor.loadLayout();
      }
    });
  }

  loadStreetLightAtZ(zPosition, index) {
    this.loadStreetLightAtZWithName(zPosition, `streetlight_${index}`);
  }

  loadStreetLightAtZWithName(zPosition, name) {
    this.tryLoadModel((gltf) => {
      const newStreetLight = gltf.scene;
      this.setupStreetLightMesh(newStreetLight);
      newStreetLight.scale.multiplyScalar(0.01);

      const isMirror = name.startsWith('streetlight_mirror_');
      newStreetLight.position.set(
        isMirror ? this.STREETLIGHT_X_MIRROR : this.STREETLIGHT_X_REGULAR,
        this.STREETLIGHT_Y,
        zPosition
      );

      if (isMirror) {
        newStreetLight.rotation.y = Math.PI;
      }

      Editor.makeDraggable(newStreetLight, name);
      this.scene.add(newStreetLight);
    });
  }

  tryLoadModel(onSuccess) {
    const tryLoadPath = (pathIndex) => {
      if (pathIndex >= this.possiblePaths.length) return;

      const modelPath = this.possiblePaths[pathIndex];
      
      if (modelPath.includes('/')) {
        const pathParts = modelPath.split('/');
        const fileName = pathParts.pop();
        this.loader.setPath(pathParts.join('/') + '/');
        this.loader.load(fileName, onSuccess, null, () => tryLoadPath(pathIndex + 1));
      } else {
        this.loader.setPath('../assets/models/bridge_street_light_3/');
        this.loader.load(modelPath, onSuccess, null, () => tryLoadPath(pathIndex + 1));
      }
    };

    tryLoadPath(0);
  }

  setupStreetLightMesh(streetLight) {
    streetLight.traverse((child) => {
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
  }

  getPositionConstants() {
    return {
      X_REGULAR: this.STREETLIGHT_X_REGULAR,
      X_MIRROR: this.STREETLIGHT_X_MIRROR,
      Y: this.STREETLIGHT_Y,
      SPACING: this.STREETLIGHT_SPACING
    };
  }
}

