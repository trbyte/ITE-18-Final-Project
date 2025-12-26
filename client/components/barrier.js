// Barrier Component - Handles concrete barrier loading and placement
import * as THREE from 'three';
import * as Editor from '../editor.js';

export class BarrierManager {
  constructor(scene, loader) {
    this.scene = scene;
    this.loader = loader;
    this.barriers = []; // Store all barriers for recycling
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
          console.log('Barriers loaded successfully');
          this.setupBarriers(gltf.scene);
        }, (progress) => {
          if (progress.lengthComputable) {
            console.log('Loading barriers:', (progress.loaded / progress.total * 100).toFixed(0) + '%');
          }
        }, (error) => {
          console.error('Failed to load barriers from:', modelPath, error);
          tryLoadPath(pathIndex + 1);
        });
      } else {
        this.loader.setPath('../assets/models/concrete_barriers/');
        this.loader.load(modelPath, (gltf) => {
          console.log('Barriers loaded successfully');
          this.setupBarriers(gltf.scene);
        }, (progress) => {
          if (progress.lengthComputable) {
            console.log('Loading barriers:', (progress.loaded / progress.total * 100).toFixed(0) + '%');
          }
        }, (error) => {
          console.error('Failed to load barriers from:', modelPath, error);
          tryLoadPath(pathIndex + 1);
        });
      }
    };

    tryLoadPath(0);
  }

  setupBarriers(barrierScene) {
    // Log all node names to debug
    console.log('All nodes in barrier scene:');
    const allNodes = [];
    barrierScene.traverse((child) => {
      if (child.name) {
        allNodes.push(child.name);
        console.log('Node found:', child.name, 'Type:', child.constructor.name, 'Has mesh:', child.isMesh);
      }
    });
    console.log('Total nodes with names:', allNodes.length);

    // Find barrier models: 1 (M_Barrier - Cube.001), 2 (M_Barrier2 - Cube.002), 
    // 3 (M_BarrierRed - Cube.003), 4 (M_BarrierRed - Cube.003), 5 (M_BarrierPlsatic - Cube.005), 6 (M_BarrierMetal - Cube.006)
    let barrier1Node = null;
    let barrier2Node = null;
    let barrier3Node = null;
    let barrier4Node = null;
    let barrier5Node = null;
    let barrier6Node = null;

    // First, try to find by exact name
    barrierScene.traverse((child) => {
      if (child.name === 'Cube.001') {
        barrier1Node = child;
        console.log('Found barrier 1 by name:', child.name);
      }
      if (child.name === 'Cube.002') {
        barrier2Node = child;
        console.log('Found barrier 2 by name:', child.name);
      }
      if (child.name === 'Cube.003') {
        barrier3Node = child;
        barrier4Node = child; // Also reference as model 4
        console.log('Found barrier 3/4 by name:', child.name);
      }
      if (child.name === 'Cube.005') {
        barrier5Node = child;
        console.log('Found barrier 5 by name:', child.name);
      }
      if (child.name === 'Cube.006') {
        barrier6Node = child;
        console.log('Found barrier 6 by name:', child.name);
      }
    });

    // If not found, try to find by material name and get the parent group
    if (!barrier1Node || !barrier2Node || !barrier3Node || !barrier4Node || !barrier5Node || !barrier6Node) {
      barrierScene.traverse((child) => {
        if (child.isMesh) {
          const materialName = child.material?.name || '';
          
          // Find barrier 1 - look for M_Barrier material (not Barrier2, Metal, Plastic, Red, Tall, or Fence)
          if (materialName === 'M_Barrier' && !barrier1Node) {
            let parent = child.parent;
            // Go up the hierarchy to find the Cube.001 node
            while (parent && parent !== barrierScene) {
              if (parent.name === 'Cube.001') {
                barrier1Node = parent;
                console.log('Found barrier 1 by material, parent:', parent.name);
                break;
              }
              parent = parent.parent;
            }
            // If still not found, use the mesh's parent directly
            if (!barrier1Node && child.parent) {
              barrier1Node = child.parent;
              console.log('Found barrier 1 using mesh parent:', child.parent.name);
            }
          }
          
          // Find barrier 2 - look for M_Barrier2 material
          if (materialName === 'M_Barrier2' && !barrier2Node) {
            let parent = child.parent;
            while (parent && parent !== barrierScene) {
              if (parent.name === 'Cube.002') {
                barrier2Node = parent;
                console.log('Found barrier 2 by material, parent:', parent.name);
                break;
              }
              parent = parent.parent;
            }
            if (!barrier2Node && child.parent) {
              barrier2Node = child.parent;
              console.log('Found barrier 2 using mesh parent:', child.parent.name);
            }
          }
          
          // Find barrier 3/4 - look for M_BarrierRed material
          if (materialName === 'M_BarrierRed' && (!barrier3Node || !barrier4Node)) {
            let parent = child.parent;
            while (parent && parent !== barrierScene) {
              if (parent.name === 'Cube.003') {
                barrier3Node = parent;
                barrier4Node = parent;
                console.log('Found barrier 3/4 by material, parent:', parent.name);
                break;
              }
              parent = parent.parent;
            }
            if ((!barrier3Node || !barrier4Node) && child.parent) {
              barrier3Node = child.parent;
              barrier4Node = child.parent;
              console.log('Found barrier 3/4 using mesh parent:', child.parent.name);
            }
          }
          
          // Find barrier 5 - look for M_BarrierPlsatic material
          if (materialName === 'M_BarrierPlsatic' && !barrier5Node) {
            let parent = child.parent;
            while (parent && parent !== barrierScene) {
              if (parent.name === 'Cube.005') {
                barrier5Node = parent;
                console.log('Found barrier 5 by material, parent:', parent.name);
                break;
              }
              parent = parent.parent;
            }
            if (!barrier5Node && child.parent) {
              barrier5Node = child.parent;
              console.log('Found barrier 5 using mesh parent:', child.parent.name);
            }
          }
          
          // Find barrier 6 - look for M_BarrierMetal material
          if (materialName === 'M_BarrierMetal' && !barrier6Node) {
            let parent = child.parent;
            while (parent && parent !== barrierScene) {
              if (parent.name === 'Cube.006') {
                barrier6Node = parent;
                console.log('Found barrier 6 by material, parent:', parent.name);
                break;
              }
              parent = parent.parent;
            }
            if (!barrier6Node && child.parent) {
              barrier6Node = child.parent;
              console.log('Found barrier 6 using mesh parent:', child.parent.name);
            }
          }
        }
      });
    }

    // Generate random positions for barriers with collision detection
    const minDistance = 10.0; // Increased minimum distance between barriers (was 5.0)
    const placedPositions = []; // Track all placed barrier positions
    const zRange = { min: 5.0, max: 100.0 }; // Extended Z range for more spread (was 5.0-50.0)
    
    // Helper function to check if a position is too close to existing barriers
    const isPositionValid = (x, z, existingPositions, minDist) => {
      for (const pos of existingPositions) {
        const distance = Math.sqrt((x - pos.x) ** 2 + (z - pos.z) ** 2);
        if (distance < minDist) {
          return false;
        }
      }
      return true;
    };
    
    // Helper function to generate a valid random position
    const generateValidPosition = (side, existingPositions, minDist, maxAttempts = 200) => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let x, z;
        if (side === 'right') {
          x = 1.0 + Math.random() * 2.0; // Random between 1.0 and 3.0 (right sidewalk)
        } else if (side === 'left') {
          x = -3.0 + Math.random() * 2.0; // Random between -3.0 and -1.0 (left sidewalk)
        } else {
          // Random side
          x = (Math.random() > 0.5 ? 1.0 : -3.0) + Math.random() * 2.0;
        }
        z = zRange.min + Math.random() * (zRange.max - zRange.min); // Extended range
        
        if (isPositionValid(x, z, existingPositions, minDist)) {
          return { x, z };
        }
      }
      // If we can't find a valid position after max attempts, return a position anyway
      return { 
        x: (Math.random() > 0.5 ? 1.0 : -3.0) + Math.random() * 2.0, 
        z: zRange.min + Math.random() * (zRange.max - zRange.min)
      };
    };
    
    // Generate positions for all barriers (30 total barriers)
    const totalBarriers = 30;
    const barrierPositions = [];
    
    // First barrier on right, second on left, rest random
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

    // Place all barriers using a loop
    for (let i = 0; i < totalBarriers; i++) {
      const configIndex = i % barrierConfigs.length;
      const config = barrierConfigs[configIndex];
      
      if (config.node) {
        const barrierClone = config.node.clone(true);
        const barrierName = `barrier_${i + 1}`;
        const pos = barrierPositions[i];
        
        console.log(`Placing ${barrierName}, clone has ${barrierClone.children.length} children`);
        this.placeBarrier(
          barrierClone,
          barrierName,
          { x: pos.x, y: 0, z: pos.z },
          config.rotation,
          config.scale
        );
      } else {
        console.warn(`Barrier model ${configIndex + 1} not found for barrier ${i + 1}!`);
      }
    }
  }

  placeBarrier(barrier, name, position, rotation, scale = null) {
    // Setup barrier mesh
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

    // Reset position and rotation before calculating size
    barrier.position.set(0, 0, 0);
    barrier.rotation.set(0, 0, 0);
    barrier.scale.set(1, 1, 1);

    // Apply custom scale if provided, otherwise calculate scale automatically
    if (scale) {
      barrier.scale.set(scale.x, scale.y, scale.z);
      console.log(`Barrier ${name} using custom scale:`, scale);
    } else {
      // Calculate size and scale appropriately
      const box = new THREE.Box3().setFromObject(barrier);
      const size = box.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z);
      
      console.log(`Barrier ${name} size:`, size, 'maxDimension:', maxDimension);
      
      // Scale barrier to appropriate size (target size around 1-2 units)
      if (maxDimension > 0) {
        const targetSize = 1.5; // Target height/width around 1.5 units
        const scaleValue = targetSize / maxDimension;
        barrier.scale.set(scaleValue, scaleValue, scaleValue);
        console.log(`Barrier ${name} scaled by:`, scaleValue);
      }
    }

    // Apply rotation
    barrier.rotation.set(rotation.x, rotation.y, rotation.z);
    
    // Set position on the sidewalk (y position should be on ground level)
    // Adjust y based on barrier height if y is 0 in position
    if (position.y === 0) {
      const scaledBox = new THREE.Box3().setFromObject(barrier);
      const scaledSize = scaledBox.getSize(new THREE.Vector3());
      const yPosition = scaledSize.y / 2; // Place bottom of barrier on ground
      barrier.position.set(position.x, yPosition, position.z);
    } else {
      barrier.position.set(position.x, position.y, position.z);
    }
    
    console.log(`Barrier ${name} placed at:`, barrier.position, 'rotation:', barrier.rotation, 'scale:', barrier.scale);
    
    // Store barrier for recycling
    this.barriers.push(barrier);
    
    // Register and make draggable
    Editor.makeDraggable(barrier, name);
    this.scene.add(barrier);
  }

  recycleBarriers(cameraZ) {
    if (this.barriers.length === 0) return;

    const recycleThreshold = 5;
    const minDistance = 10.0; // Same as initial placement
    const zRange = { min: 5.0, max: 100.0 }; // Same as initial placement
    const aheadDistance = 50.0; // Distance ahead of camera to maintain barrier density

    for (let i = 0; i < this.barriers.length; i++) {
      const barrier = this.barriers[i];
      const barrierBox = new THREE.Box3().setFromObject(barrier);
      const barrierMaxZ = barrierBox.max.z;

      // If barrier is behind the camera
      if (barrierMaxZ < cameraZ - recycleThreshold) {
        // Find the frontmost Z position of all other barriers
        let frontmostZ = -Infinity;
        for (let j = 0; j < this.barriers.length; j++) {
          if (j !== i) {
            const otherBox = new THREE.Box3().setFromObject(this.barriers[j]);
            if (otherBox.max.z > frontmostZ) {
              frontmostZ = otherBox.max.z;
            }
          }
        }

        // Calculate target area ahead of camera to maintain density
        // Place barriers in the range [cameraZ + aheadDistance, cameraZ + aheadDistance + zRange range]
        const targetMinZ = cameraZ + aheadDistance;
        const targetMaxZ = targetMinZ + (zRange.max - zRange.min);

        // Generate a new position in the target area with consistent spacing
        let newX, newZ;
        let attempts = 0;
        const maxAttempts = 200;
        let validPosition = false;

        while (!validPosition && attempts < maxAttempts) {
          // Random side (left or right sidewalk)
          const side = Math.random() > 0.5 ? 'right' : 'left';
          if (side === 'right') {
            newX = 1.0 + Math.random() * 2.0; // Random between 1.0 and 3.0 (right sidewalk)
          } else {
            newX = -3.0 + Math.random() * 2.0; // Random between -3.0 and -1.0 (left sidewalk)
          }
          
          // Place in target area to maintain density (similar to initial placement range)
          newZ = targetMinZ + Math.random() * (targetMaxZ - targetMinZ);
          
          // Check if position is valid (far enough from other barriers)
          validPosition = true;
          for (let j = 0; j < this.barriers.length; j++) {
            if (j !== i) {
              const otherPos = this.barriers[j].position;
              const distance = Math.sqrt((newX - otherPos.x) ** 2 + (newZ - otherPos.z) ** 2);
              if (distance < minDistance) {
                validPosition = false;
                break;
              }
            }
          }
          attempts++;
        }

        // If we couldn't find a valid position, place it anyway with minimum spacing from frontmost
        if (!validPosition) {
          newX = (Math.random() > 0.5 ? 1.0 : -3.0) + Math.random() * 2.0;
          if (frontmostZ === -Infinity) {
            newZ = targetMinZ;
          } else {
            newZ = Math.max(frontmostZ + minDistance, targetMinZ);
          }
        }

        // Update barrier position
        const scaledBox = new THREE.Box3().setFromObject(barrier);
        const scaledSize = scaledBox.getSize(new THREE.Vector3());
        const yPosition = scaledSize.y / 2; // Place bottom of barrier on ground
        
        barrier.position.set(newX, yPosition, newZ);
      }
    }
  }

  getBarriers() {
    return this.barriers;
  }
}

