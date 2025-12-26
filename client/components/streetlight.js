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
  }

  loadStreetLight() {
    const possiblePaths = [
      'scene.gltf',
      '../assets/models/bridge_street_light_3/scene.gltf',
      'assets/models/bridge_street_light_3/scene.gltf',
      './assets/models/bridge_street_light_3/scene.gltf'
    ];

    const tryLoadPath = (pathIndex) => {
      if (pathIndex >= possiblePaths.length) {
        return;
      }

      const modelPath = possiblePaths[pathIndex];

      if (modelPath.includes('/')) {
        const pathParts = modelPath.split('/');
        pathParts.pop();
        this.loader.setPath(pathParts.join('/') + '/');
      } else {
        this.loader.setPath('../assets/models/bridge_street_light_3/');
      }

      this.loader.load(
        modelPath.includes('/') ? modelPath.split('/').pop() : modelPath,
        (gltf) => {
          const streetLight = gltf.scene;

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

          streetLight.scale.multiplyScalar(0.01);

          const box = new THREE.Box3().setFromObject(streetLight);
          const min = box.min;

          // Set position from saved layout
          streetLight.position.x = this.STREETLIGHT_X_REGULAR;
          streetLight.position.y = this.STREETLIGHT_Y;
          streetLight.position.z = -15;

          // Register and make draggable
          const lightName = `streetlight_${Editor.getObjectRegistrySize() + 1}`;
          Editor.makeDraggable(streetLight, lightName);

          this.scene.add(streetLight);

          // Create multiple streetlights at different z positions (15 units apart)
          const zPositions = [-15, 0, 15, 30, 45, 60];
          let streetlightIndex = 1; // Start from 1 since first one is already created

          zPositions.forEach((zPos) => {
            // Skip the first position (-15) since we already created it
            if (zPos === -15) return;

            // Load additional streetlight at this z position
            this.loadStreetLightAtZ(zPos, streetlightIndex);
            streetlightIndex++;
          });

          // Create multiple mirror streetlights at different z positions
          const mirrorZPositions = [-11, 4, 19, 34, 49, 64];
          let mirrorIndex = 1;

          mirrorZPositions.forEach((zPos) => {
            const mirrorName = `streetlight_mirror_${mirrorIndex}`;
            this.loadStreetLightAtZWithName(zPos, mirrorName);
            mirrorIndex++;
          });

          // Runtime Mode: Load layout after all objects are registered
          if (!Editor.EDITOR_MODE) {
            Editor.loadLayout();
          }
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

  loadStreetLightAtZ(zPosition, index) {
    const possiblePaths = [
      'scene.gltf',
      '../assets/models/bridge_street_light_3/scene.gltf',
      'assets/models/bridge_street_light_3/scene.gltf',
      './assets/models/bridge_street_light_3/scene.gltf'
    ];

    const tryLoadPath = (pathIndex) => {
      if (pathIndex >= possiblePaths.length) {
        return;
      }

      const modelPath = possiblePaths[pathIndex];

      if (modelPath.includes('/')) {
        const pathParts = modelPath.split('/');
        pathParts.pop();
        this.loader.setPath(pathParts.join('/') + '/');
      } else {
        this.loader.setPath('../assets/models/bridge_street_light_3/');
      }

      this.loader.load(
        modelPath.includes('/') ? modelPath.split('/').pop() : modelPath,
        (gltf) => {
          const newStreetLight = gltf.scene;

          this.setupStreetLightMesh(newStreetLight);
          newStreetLight.scale.multiplyScalar(0.01);

          // Set position - same x and y as first, but different z
          newStreetLight.position.x = this.STREETLIGHT_X_REGULAR;
          newStreetLight.position.y = this.STREETLIGHT_Y;
          newStreetLight.position.z = zPosition;

          // Register and make draggable
          const lightName = index !== undefined ? `streetlight_${index + 1}` : `streetlight_${Editor.getObjectRegistrySize() + 1}`;
          Editor.makeDraggable(newStreetLight, lightName);

          this.scene.add(newStreetLight);
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

  loadStreetLightAtZWithName(zPosition, name) {
    const possiblePaths = [
      'scene.gltf',
      '../assets/models/bridge_street_light_3/scene.gltf',
      'assets/models/bridge_street_light_3/scene.gltf',
      './assets/models/bridge_street_light_3/scene.gltf'
    ];

    const tryLoadPath = (pathIndex) => {
      if (pathIndex >= possiblePaths.length) {
        return;
      }

      const modelPath = possiblePaths[pathIndex];

      if (modelPath.includes('/')) {
        const pathParts = modelPath.split('/');
        pathParts.pop();
        this.loader.setPath(pathParts.join('/') + '/');
      } else {
        this.loader.setPath('../assets/models/bridge_street_light_3/');
      }

      this.loader.load(
        modelPath.includes('/') ? modelPath.split('/').pop() : modelPath,
        (gltf) => {
          const newStreetLight = gltf.scene;

          this.setupStreetLightMesh(newStreetLight);
          newStreetLight.scale.multiplyScalar(0.01);

          // Set position - same x and y as first, but different z
          newStreetLight.position.x = this.STREETLIGHT_X_REGULAR;
          newStreetLight.position.y = this.STREETLIGHT_Y;
          newStreetLight.position.z = zPosition;

          // Rotate mirror streetlights horizontally (180 degrees around Y axis)
          if (name.startsWith('streetlight_mirror_')) {
            newStreetLight.rotation.y = Math.PI; // 180 degrees
            // Set custom x position for mirror streetlights
            newStreetLight.position.x = this.STREETLIGHT_X_MIRROR;
          }

          // Register and make draggable with custom name
          Editor.makeDraggable(newStreetLight, name);

          this.scene.add(newStreetLight);

          console.log(`Streetlight ${name} loaded at position:`, newStreetLight.position.x, newStreetLight.position.y, newStreetLight.position.z);
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

