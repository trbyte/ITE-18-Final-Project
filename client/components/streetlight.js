import * as THREE from 'three';

export class StreetlightManager {
  constructor(scene, loader) {
    this.scene = scene;
    this.loader = loader;
    this.streetlights = [];
    this.mirrorStreetlights = [];
    this.STREETLIGHT_X_REGULAR = 0.7659052966593223;
    this.STREETLIGHT_X_MIRROR = -0.8350271700107539;
    this.STREETLIGHT_Y = 0.08464134976573123;
    this.STREETLIGHT_SPACING = 15;
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

      const zPositions = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165];
      zPositions.forEach((zPos, index) => {
        if (zPos === 0) {
          streetLight.position.set(this.STREETLIGHT_X_REGULAR, this.STREETLIGHT_Y, zPos);
          this.streetlights.push(streetLight);
          this.scene.add(streetLight);
        } else {
          this.loadStreetLightAtZ(zPos, index + 1);
        }
      });

      const mirrorZPositions = [4, 19, 34, 49, 64, 79, 94, 109, 124, 139, 154, 169];
      mirrorZPositions.forEach((zPos, index) => {
        this.loadStreetLightAtZWithName(zPos, `streetlight_mirror_${index + 1}`);
      });
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
        this.mirrorStreetlights.push(newStreetLight);
      } else {
        this.streetlights.push(newStreetLight);
      }

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

  getStreetlights() {
    return this.streetlights;
  }

  getMirrorStreetlights() {
    return this.mirrorStreetlights;
  }
}

