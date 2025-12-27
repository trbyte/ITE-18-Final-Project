import * as THREE from 'three';

export class BarrierManager {
  constructor(scene, loader, carController = null) {
    this.scene = scene;
    this.loader = loader;
    this.barriers = [];
    this.carController = carController;
  }

  loadBarriers() {
    const possiblePaths = [
      'scene.gltf',
      '../assets/models/concrete_barriers/scene.gltf',
      'assets/models/concrete_barriers/scene.gltf',
      './assets/models/concrete_barriers/scene.gltf'
    ];

    const tryLoadPath = (pathIndex) => {
      if (pathIndex >= possiblePaths.length) return;

      const modelPath = possiblePaths[pathIndex];
      
      if (modelPath.includes('/')) {
        const pathParts = modelPath.split('/');
        const fileName = pathParts.pop();
        this.loader.setPath(pathParts.join('/') + '/');
        this.loader.load(fileName, (gltf) => {
          this.setupBarriers(gltf.scene);
        }, undefined, () => tryLoadPath(pathIndex + 1));
      } else {
        this.loader.setPath('../assets/models/concrete_barriers/');
        this.loader.load(modelPath, (gltf) => {
          this.setupBarriers(gltf.scene);
        }, undefined, () => tryLoadPath(pathIndex + 1));
      }
    };

    tryLoadPath(0);
  }

  setupBarriers(barrierScene) {
    let barrier1Node = null;
    let barrier2Node = null;
    let barrier3Node = null;
    let barrier4Node = null;
    let barrier5Node = null;
    let barrier6Node = null;

    barrierScene.traverse((child) => {
      if (child.name === 'Cube.001') {
        barrier1Node = child;
      }
      if (child.name === 'Cube.002') {
        barrier2Node = child;
      }
      if (child.name === 'Cube.003') {
        barrier3Node = child;
        barrier4Node = child;
      }
      if (child.name === 'Cube.005') {
        barrier5Node = child;
      }
      if (child.name === 'Cube.006') {
        barrier6Node = child;
      }
    });

    if (!barrier1Node || !barrier2Node || !barrier3Node || !barrier4Node || !barrier5Node || !barrier6Node) {
      barrierScene.traverse((child) => {
        if (child.isMesh) {
          const materialName = child.material?.name || '';
          
          if (materialName === 'M_Barrier' && !barrier1Node) {
            let parent = child.parent;
            while (parent && parent !== barrierScene) {
              if (parent.name === 'Cube.001') {
                barrier1Node = parent;
                break;
              }
              parent = parent.parent;
            }
            if (!barrier1Node && child.parent) {
              barrier1Node = child.parent;
            }
          }
          
          if (materialName === 'M_Barrier2' && !barrier2Node) {
            let parent = child.parent;
            while (parent && parent !== barrierScene) {
              if (parent.name === 'Cube.002') {
                barrier2Node = parent;
                break;
              }
              parent = parent.parent;
            }
            if (!barrier2Node && child.parent) {
              barrier2Node = child.parent;
            }
          }
          
          if (materialName === 'M_BarrierRed' && (!barrier3Node || !barrier4Node)) {
            let parent = child.parent;
            while (parent && parent !== barrierScene) {
              if (parent.name === 'Cube.003') {
                barrier3Node = parent;
                barrier4Node = parent;
                break;
              }
              parent = parent.parent;
            }
            if ((!barrier3Node || !barrier4Node) && child.parent) {
              barrier3Node = child.parent;
              barrier4Node = child.parent;
            }
          }
          
          if (materialName === 'M_BarrierPlsatic' && !barrier5Node) {
            let parent = child.parent;
            while (parent && parent !== barrierScene) {
              if (parent.name === 'Cube.005') {
                barrier5Node = parent;
                break;
              }
              parent = parent.parent;
            }
            if (!barrier5Node && child.parent) {
              barrier5Node = child.parent;
            }
          }
          
          if (materialName === 'M_BarrierMetal' && !barrier6Node) {
            let parent = child.parent;
            while (parent && parent !== barrierScene) {
              if (parent.name === 'Cube.006') {
                barrier6Node = parent;
                break;
              }
              parent = parent.parent;
            }
            if (!barrier6Node && child.parent) {
              barrier6Node = child.parent;
            }
          }
        }
      });
    }

    const minDistance = 20.0;
    const placedPositions = [];
    const zRange = { min: 5.0, max: 100.0 };
    
    const CAR_WIDTH = 1.5;
    const ROAD_LEFT_EDGE = -1.5;
    const ROAD_RIGHT_EDGE = 1.5;
    const MIN_PASSAGE_WIDTH = CAR_WIDTH + 0.5;
    const Z_TOLERANCE = 2.0;
    const MIN_Z_SPACING_SAME_SIDE = CAR_WIDTH + 6.5;
    const MIN_Z_SPACING_OPPOSITE_SIDE = CAR_WIDTH + 5.0;
    const X_TOLERANCE = 3.0;
    const LEFT_SIDE_THRESHOLD = -1.0;
    const RIGHT_SIDE_THRESHOLD = 1.0;
    
    const hasClearPath = (z, existingPositions) => {
      const nearbyBarriers = existingPositions.filter(pos => 
        Math.abs(pos.z - z) < Z_TOLERANCE + 1.0
      );
      
      if (nearbyBarriers.length === 0) return true;
      
      const BARRIER_HALF_WIDTH = 0.6;
      const roadWidth = ROAD_RIGHT_EDGE - ROAD_LEFT_EDGE;
      const requiredPassageWidth = MIN_PASSAGE_WIDTH;
      let hasPath = false;
      const testStep = 0.05;
      
      for (let testX = ROAD_LEFT_EDGE; testX <= ROAD_RIGHT_EDGE - requiredPassageWidth; testX += testStep) {
        let pathClear = true;
        
        for (const pos of nearbyBarriers) {
          const barrierLeft = pos.x - BARRIER_HALF_WIDTH;
          const barrierRight = pos.x + BARRIER_HALF_WIDTH;
          const pathLeft = testX;
          const pathRight = testX + requiredPassageWidth;
          
          if (!(barrierRight < pathLeft || barrierLeft > pathRight)) {
            pathClear = false;
            break;
          }
        }
        
        if (pathClear) {
          hasPath = true;
          break;
        }
      }
      
      if (!hasPath) {
        let barriersOnRoad = false;
        for (const pos of nearbyBarriers) {
          const barrierLeft = pos.x - BARRIER_HALF_WIDTH;
          const barrierRight = pos.x + BARRIER_HALF_WIDTH;
          
          if (barrierRight > ROAD_LEFT_EDGE && barrierLeft < ROAD_RIGHT_EDGE) {
            barriersOnRoad = true;
            break;
          }
        }
        
        if (!barriersOnRoad) {
          return true;
        }
      }
      
      return hasPath;
    };
    
    // Helper function to check if barriers on the same side are too close in Z direction
    const hasEnoughZSpacingOnSameSide = (x, z, existingPositions, minZSpacing) => {
      for (const pos of existingPositions) {
        if (Math.abs(pos.x - x) < X_TOLERANCE) {
          if (Math.abs(pos.z - z) < minZSpacing) {
            return false;
          }
        }
      }
      return true;
    };
    
    const hasEnoughZSpacingOnOppositeSide = (x, z, existingPositions, minZSpacing) => {
      const isLeftSide = x < LEFT_SIDE_THRESHOLD;
      const isRightSide = x > RIGHT_SIDE_THRESHOLD;
      
      for (const pos of existingPositions) {
        const otherIsLeftSide = pos.x < LEFT_SIDE_THRESHOLD;
        const otherIsRightSide = pos.x > RIGHT_SIDE_THRESHOLD;
        
        if ((isLeftSide && otherIsRightSide) || (isRightSide && otherIsLeftSide)) {
          if (Math.abs(pos.z - z) < minZSpacing) {
            return false;
          }
        }
      }
      return true;
    };
    
    const isPositionValid = (x, z, existingPositions, minDist) => {
      for (const pos of existingPositions) {
        const distance = Math.sqrt((x - pos.x) ** 2 + (z - pos.z) ** 2);
        if (distance < minDist) {
          return false;
        }
      }
      return true;
    };
    
    const BARRIER_HALF_WIDTH = 0.6;
    const SAFE_DISTANCE_FROM_ROAD = 0;
    
    const generateValidPosition = (side, existingPositions, minDist, maxAttempts = 300) => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let x, z;
        if (side === 'right') {
          x = ROAD_RIGHT_EDGE + SAFE_DISTANCE_FROM_ROAD + Math.random() * (3.0 - ROAD_RIGHT_EDGE - SAFE_DISTANCE_FROM_ROAD);
          x = Math.max(ROAD_RIGHT_EDGE + SAFE_DISTANCE_FROM_ROAD, Math.min(x, 3.0));
        } else if (side === 'left') {
          x = -3.0 + Math.random() * (ROAD_LEFT_EDGE - SAFE_DISTANCE_FROM_ROAD - (-3.0));
          x = Math.max(-3.0, Math.min(x, ROAD_LEFT_EDGE - SAFE_DISTANCE_FROM_ROAD));
        } else {
          if (Math.random() > 0.5) {
            x = ROAD_RIGHT_EDGE + SAFE_DISTANCE_FROM_ROAD + Math.random() * (3.0 - ROAD_RIGHT_EDGE - SAFE_DISTANCE_FROM_ROAD);
            x = Math.max(ROAD_RIGHT_EDGE + SAFE_DISTANCE_FROM_ROAD, Math.min(x, 3.0));
          } else {
            x = -3.0 + Math.random() * (ROAD_LEFT_EDGE - SAFE_DISTANCE_FROM_ROAD - (-3.0));
            x = Math.max(-3.0, Math.min(x, ROAD_LEFT_EDGE - SAFE_DISTANCE_FROM_ROAD));
          }
        }
        z = zRange.min + Math.random() * (zRange.max - zRange.min);
        
        if (isPositionValid(x, z, existingPositions, minDist) &&
            hasClearPath(z, existingPositions) &&
            hasEnoughZSpacingOnSameSide(x, z, existingPositions, MIN_Z_SPACING_SAME_SIDE) &&
            hasEnoughZSpacingOnOppositeSide(x, z, existingPositions, MIN_Z_SPACING_OPPOSITE_SIDE)) {
          return { x, z };
        }
      }
      for (let attempt = 0; attempt < 100; attempt++) {
        let x, z;
        if (Math.random() > 0.5) {
          x = ROAD_RIGHT_EDGE + SAFE_DISTANCE_FROM_ROAD + Math.random() * (3.0 - ROAD_RIGHT_EDGE - SAFE_DISTANCE_FROM_ROAD);
          x = Math.max(ROAD_RIGHT_EDGE + SAFE_DISTANCE_FROM_ROAD, Math.min(x, 3.0));
        } else {
          x = -3.0 + Math.random() * (ROAD_LEFT_EDGE - SAFE_DISTANCE_FROM_ROAD - (-3.0));
          x = Math.max(-3.0, Math.min(x, ROAD_LEFT_EDGE - SAFE_DISTANCE_FROM_ROAD));
        }
        z = zRange.min + Math.random() * (zRange.max - zRange.min);
        
        if (hasClearPath(z, existingPositions) &&
            hasEnoughZSpacingOnSameSide(x, z, existingPositions, MIN_Z_SPACING_SAME_SIDE) &&
            hasEnoughZSpacingOnOppositeSide(x, z, existingPositions, MIN_Z_SPACING_OPPOSITE_SIDE)) {
          return { x, z };
        }
      }
      const lastResortX = Math.random() > 0.5 
        ? ROAD_RIGHT_EDGE + SAFE_DISTANCE_FROM_ROAD + Math.random() * 0.5
        : -3.0 + Math.random() * 0.5;
      return { 
        x: lastResortX, 
        z: zRange.min + Math.random() * (zRange.max - zRange.min)
      };
    };
    
    const totalBarriers = 30;
    const barrierPositions = [];
    
    for (let i = 0; i < totalBarriers; i++) {
      let side = 'random';
      if (i === 0) side = 'right';
      else if (i === 1) side = 'left';
      
      const pos = generateValidPosition(side, placedPositions, minDistance);
      barrierPositions.push(pos);
      placedPositions.push(pos);
    }

    // Array of available barrier models with their configurations
    const barrierConfigs = [
      { node: barrier1Node, rotation: { x: 1.5707963267948966, y: 3.141592653589793, z: 7.461282552275762 }, scale: { x: 0.3022561345477022, y: 0.3022561345477022, z: 0.3022561345477022 } },
      { node: barrier2Node, rotation: { x: 14.529866022852804, y: 21.991148575128545, z: 4.71238898038469 }, scale: null },
      { node: barrier3Node, rotation: { x: 1.5707963267948966, y: 3.141592653589793, z: 7.461282552275762 }, scale: null },
      { node: barrier5Node, rotation: { x: 14.529866022852804, y: 21.991148575128545, z: 4.71238898038469 }, scale: null },
      { node: barrier6Node, rotation: { x: 14.529866022852804, y: 21.991148575128545, z: 4.71238898038469 }, scale: null }
    ];

    for (let i = 0; i < totalBarriers; i++) {
      const configIndex = i % barrierConfigs.length;
      const config = barrierConfigs[configIndex];
      
      if (config.node) {
        const barrierClone = config.node.clone(true);
        const barrierName = `barrier_${i + 1}`;
        const pos = barrierPositions[i];
        
        this.placeBarrier(
          barrierClone,
          barrierName,
          { x: pos.x, y: 0, z: pos.z },
          config.rotation,
          config.scale
        );
      }
    }
  }

  placeBarrier(barrier, name, position, rotation, scale = null) {
    barrier.traverse((child) => {
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

    barrier.position.set(0, 0, 0);
    barrier.rotation.set(0, 0, 0);
    barrier.scale.set(1, 1, 1);

    if (scale) {
      barrier.scale.set(scale.x, scale.y, scale.z);
    } else {
      const box = new THREE.Box3().setFromObject(barrier);
      const size = box.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z);
      
      if (maxDimension > 0) {
        const targetSize = 1.5;
        const scaleValue = targetSize / maxDimension;
        barrier.scale.set(scaleValue, scaleValue, scaleValue);
      }
    }

    barrier.rotation.set(rotation.x, rotation.y, rotation.z);
    
    if (position.y === 0) {
      const scaledBox = new THREE.Box3().setFromObject(barrier);
      const scaledSize = scaledBox.getSize(new THREE.Vector3());
      const yPosition = scaledSize.y / 2;
      barrier.position.set(position.x, yPosition, position.z);
    } else {
      barrier.position.set(position.x, position.y, position.z);
    }
    
    this.barriers.push(barrier);

    if (this.carController) {
      this.carController.barriers.push(barrier);
    }
    
    this.scene.add(barrier);
  }

  recycleBarriers(cameraZ) {
    if (this.barriers.length === 0) return;

    const recycleThreshold = 5;
    const minDistance = 25.0;
    const zRange = { min: 7.0, max: 40.0 };
    const aheadDistance = 50.0;
    
    const CAR_WIDTH = 1.5;
    const ROAD_LEFT_EDGE = -1.5;
    const ROAD_RIGHT_EDGE = 1.5;
    const MIN_PASSAGE_WIDTH = CAR_WIDTH + 0.5;
    const Z_TOLERANCE = 1.5;
    const MIN_Z_SPACING_SAME_SIDE = CAR_WIDTH + 6.0;
    const MIN_Z_SPACING_OPPOSITE_SIDE = CAR_WIDTH + 4.0;
    const X_TOLERANCE = 2.5;
    const LEFT_SIDE_THRESHOLD = -1.0;
    const RIGHT_SIDE_THRESHOLD = 1.0;
    const BARRIER_HALF_WIDTH_RECYCLE = 0.6;
    const SAFE_DISTANCE_FROM_ROAD_RECYCLE = -0.3;
    
    const hasClearPath = (z, existingPositions) => {
      const nearbyBarriers = existingPositions.filter(pos => 
        Math.abs(pos.z - z) < Z_TOLERANCE + 1.0
      );
      
      if (nearbyBarriers.length === 0) return true;
      
      const BARRIER_HALF_WIDTH = 0.6;
      const roadWidth = ROAD_RIGHT_EDGE - ROAD_LEFT_EDGE;
      const requiredPassageWidth = MIN_PASSAGE_WIDTH;
      
      // Test multiple paths across the road to ensure at least one is clear
      let hasPath = false;
      const testStep = 0.05; // Smaller step for more thorough checking
      
      for (let testX = ROAD_LEFT_EDGE; testX <= ROAD_RIGHT_EDGE - requiredPassageWidth; testX += testStep) {
        let pathClear = true;
        
        // Check if this path is blocked by any nearby barrier
        for (const pos of nearbyBarriers) {
          // Calculate barrier's actual extent (position ± half width)
          const barrierLeft = pos.x - BARRIER_HALF_WIDTH;
          const barrierRight = pos.x + BARRIER_HALF_WIDTH;
          const pathLeft = testX;
          const pathRight = testX + requiredPassageWidth;
          
          // Check if barrier overlaps with the path
          if (!(barrierRight < pathLeft || barrierLeft > pathRight)) {
            // Barrier overlaps with this path
            pathClear = false;
            break;
          }
        }
        
        if (pathClear) {
          hasPath = true;
          break;
        }
      }
      
      if (!hasPath) {
        let barriersOnRoad = false;
        for (const pos of nearbyBarriers) {
          const barrierLeft = pos.x - BARRIER_HALF_WIDTH;
          const barrierRight = pos.x + BARRIER_HALF_WIDTH;
          
          if (barrierRight > ROAD_LEFT_EDGE && barrierLeft < ROAD_RIGHT_EDGE) {
            barriersOnRoad = true;
            break;
          }
        }
        
        if (!barriersOnRoad) {
          return true;
        }
      }
      
      return hasPath;
    };
    
    const hasEnoughZSpacingOnSameSide = (x, z, existingPositions, minZSpacing) => {
      for (const pos of existingPositions) {
        if (Math.abs(pos.x - x) < X_TOLERANCE) {
          if (Math.abs(pos.z - z) < minZSpacing) {
            return false;
          }
        }
      }
      return true;
    };
    
    // Helper function to check if barriers on opposing sides are too close in Z direction
    const hasEnoughZSpacingOnOppositeSide = (x, z, existingPositions, minZSpacing) => {
      const isLeftSide = x < LEFT_SIDE_THRESHOLD;
      const isRightSide = x > RIGHT_SIDE_THRESHOLD;
      
      for (const pos of existingPositions) {
        const otherIsLeftSide = pos.x < LEFT_SIDE_THRESHOLD;
        const otherIsRightSide = pos.x > RIGHT_SIDE_THRESHOLD;
        
        // Check if barriers are on opposite sides
        if ((isLeftSide && otherIsRightSide) || (isRightSide && otherIsLeftSide)) {
          // Check if barriers are too close in Z direction (intersecting)
          if (Math.abs(pos.z - z) < minZSpacing) {
            return false;
          }
        }
      }
      return true;
    };
    
    const isPositionValid = (x, z, existingPositions, minDist) => {
      for (const pos of existingPositions) {
        const distance = Math.sqrt((x - pos.x) ** 2 + (z - pos.z) ** 2);
        if (distance < minDist) {
          return false;
        }
      }
      return true;
    };

    for (let i = 0; i < this.barriers.length; i++) {
      const barrier = this.barriers[i];
      const barrierBox = new THREE.Box3().setFromObject(barrier);
      const barrierMaxZ = barrierBox.max.z;

      if (barrierMaxZ < cameraZ - recycleThreshold) {
        const existingPositions = [];
        for (let j = 0; j < this.barriers.length; j++) {
          if (j !== i) {
            existingPositions.push({ x: this.barriers[j].position.x, z: this.barriers[j].position.z });
          }
        }
        
        let frontmostZ = -Infinity;
        for (let j = 0; j < this.barriers.length; j++) {
          if (j !== i) {
            const otherBox = new THREE.Box3().setFromObject(this.barriers[j]);
            if (otherBox.max.z > frontmostZ) {
              frontmostZ = otherBox.max.z;
            }
          }
        }

        const targetMinZ = cameraZ + aheadDistance;
        const targetMaxZ = targetMinZ + (zRange.max - zRange.min);
        let newX, newZ;
        let attempts = 0;
        const maxAttempts = 300;
        let validPosition = false;

        while (!validPosition && attempts < maxAttempts) {
          const side = Math.random() > 0.5 ? 'right' : 'left';
          if (side === 'right') {
            newX = ROAD_RIGHT_EDGE + SAFE_DISTANCE_FROM_ROAD_RECYCLE + Math.random() * (3.0 - ROAD_RIGHT_EDGE - SAFE_DISTANCE_FROM_ROAD_RECYCLE);
            newX = Math.max(ROAD_RIGHT_EDGE + SAFE_DISTANCE_FROM_ROAD_RECYCLE, Math.min(newX, 3.0));
          } else {
            newX = -3.0 + Math.random() * (ROAD_LEFT_EDGE - SAFE_DISTANCE_FROM_ROAD_RECYCLE - (-3.0));
            newX = Math.max(-3.0, Math.min(newX, ROAD_LEFT_EDGE - SAFE_DISTANCE_FROM_ROAD_RECYCLE));
          }
          
          newZ = targetMinZ + Math.random() * (targetMaxZ - targetMinZ);
          
          if (isPositionValid(newX, newZ, existingPositions, minDistance) &&
              hasClearPath(newZ, existingPositions) &&
              hasEnoughZSpacingOnSameSide(newX, newZ, existingPositions, MIN_Z_SPACING_SAME_SIDE) &&
              hasEnoughZSpacingOnOppositeSide(newX, newZ, existingPositions, MIN_Z_SPACING_OPPOSITE_SIDE)) {
            validPosition = true;
          }
          attempts++;
        }

        if (!validPosition) {
          for (let attempt = 0; attempt < 100; attempt++) {
            newX = (Math.random() > 0.5 ? 1.0 : -3.0) + Math.random() * 2.0;
            newZ = targetMinZ + Math.random() * (targetMaxZ - targetMinZ);
            
            if (hasClearPath(newZ, existingPositions) &&
                hasEnoughZSpacingOnSameSide(newX, newZ, existingPositions, MIN_Z_SPACING_SAME_SIDE) &&
                hasEnoughZSpacingOnOppositeSide(newX, newZ, existingPositions, MIN_Z_SPACING_OPPOSITE_SIDE)) {
              validPosition = true;
              break;
            }
          }
        }
        
        if (!validPosition) {
          if (Math.random() > 0.5) {
            newX = ROAD_RIGHT_EDGE + SAFE_DISTANCE_FROM_ROAD_RECYCLE + Math.random() * 0.5;
          } else {
            newX = -3.0 + Math.random() * 0.5;
          }
          if (frontmostZ === -Infinity) {
            newZ = targetMinZ;
          } else {
            newZ = Math.max(frontmostZ + minDistance, targetMinZ);
          }
        }

        const scaledBox = new THREE.Box3().setFromObject(barrier);
        const scaledSize = scaledBox.getSize(new THREE.Vector3());
        const yPosition = scaledSize.y / 2;
        
        barrier.position.set(newX, yPosition, newZ);
      }
    }
  }

  getBarriers() {
    return this.barriers;
  }
}

