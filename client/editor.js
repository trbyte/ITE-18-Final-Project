// Editor Mode Module for Road Safety Simulator
// Handles all editor functionality: dragging, copy/paste, rotation, export/import

import * as THREE from 'three';
import { DragControls } from 'three/addons/controls/DragControls.js';

// Editor Mode Configuration
export const EDITOR_MODE = true; // false = runtime / post-production

// Editor state
let scene, camera, renderer;
const draggableObjects = [];
let dragControls = null;
const DRAG_SPEED = 0.5; // Adjust this value: 0.1 = very slow, 1.0 = normal speed
const objectRegistry = new Map(); // Maps object names to Three.js objects
let selectedObject = null;
let clipboard = null;

// Initialize editor with scene, camera, and renderer
export function initEditor(_scene, _camera, _renderer) {
  scene = _scene;
  camera = _camera;
  renderer = _renderer;
}

// Register object in registry (works in both editor and runtime modes)
export function registerObject(object, name) {
  objectRegistry.set(name, object);
}

// Helper function to find the parent draggable object
function findParentDraggable(object) {
  if (object.userData.parentDraggable) {
    return object.userData.parentDraggable;
  }
  return object;
}

// Editor Mode: Make an object draggable (including all child meshes)
export function makeDraggable(object, name = null) {
  // Always register object for layout system
  if (!name) {
    name = `object_${objectRegistry.size + 1}`;
  }
  registerObject(object, name);
  
  // Only make draggable in editor mode
  if (!EDITOR_MODE) return;
  
  // Collect all meshes in the object (including children)
  const meshesToAdd = [];
  
  // Add the root object if it's a mesh
  if (object.isMesh) {
    object.userData.parentDraggable = object;
    meshesToAdd.push(object);
  }
  
  // Traverse and add all child meshes
  object.traverse(function(child) {
    if (child.isMesh) {
      child.userData.parentDraggable = object;
      meshesToAdd.push(child);
    }
  });
  
  // Add all meshes to draggable array
  draggableObjects.push(...meshesToAdd);
  
  // Reinitialize DragControls if it exists
  if (dragControls) {
    dragControls.dispose();
    dragControls = null;
  }
  
  // Initialize DragControls with updated array (only if renderer is ready)
  if (draggableObjects.length > 0 && renderer && renderer.domElement) {
    dragControls = new DragControls(draggableObjects, camera, renderer.domElement);
    
    // Store initial positions for calculating offset
    const dragData = new Map();
    
    // Prevent interference with camera controls and move parent object
    dragControls.addEventListener('dragstart', function(event) {
      const parent = findParentDraggable(event.object);
      
      // Select the object when dragging starts
      selectObject(parent);
      
      // Store drag data
      const startWorldPos = new THREE.Vector3();
      event.object.getWorldPosition(startWorldPos);
      
      dragData.set(event.object, {
        parent: parent,
        startWorldPos: startWorldPos.clone(),
        parentStartPos: parent.position.clone(),
        childStartLocalPos: event.object.position.clone()
      });
      
      // Disable camera controls while dragging
      parent.userData.isDragging = true;
      event.object.userData.isDragging = true;
    });
    
    dragControls.addEventListener('drag', function(event) {
      const data = dragData.get(event.object);
      if (!data) return;
      
      const parent = data.parent;
      
      // If dragging the parent itself
      if (event.object === parent) {
        // DragControls has already moved event.object.position
        // Calculate the offset from the start position
        const offset = new THREE.Vector3();
        offset.subVectors(event.object.position, data.parentStartPos);
        // Apply speed multiplier to slow down
        offset.multiplyScalar(DRAG_SPEED);
        // Set the slowed position
        parent.position.copy(data.parentStartPos).add(offset);
        return;
      }
      
      // If dragging a child, get current world position (after DragControls moved the child)
      const currentWorldPos = new THREE.Vector3();
      event.object.getWorldPosition(currentWorldPos);
      
      // Calculate world space offset
      const worldOffset = new THREE.Vector3();
      worldOffset.subVectors(currentWorldPos, data.startWorldPos);
      
      // Apply speed multiplier to slow down dragging
      worldOffset.multiplyScalar(DRAG_SPEED);
      
      // Apply offset to parent
      parent.position.copy(data.parentStartPos).add(worldOffset);
      
      // Restore child's original local position (maintains relative transform)
      event.object.position.copy(data.childStartLocalPos);
    });
    
    dragControls.addEventListener('dragend', function(event) {
      const data = dragData.get(event.object);
      if (data) {
        data.parent.userData.isDragging = false;
        dragData.delete(event.object);
      }
      if (event.object.userData) {
        event.object.userData.isDragging = false;
      }
    });
  }
}

// Editor Mode: Select an object (click to select)
export function selectObject(object) {
  if (!EDITOR_MODE) return;
  
  // Deselect previous object
  if (selectedObject) {
    selectedObject.traverse(function(child) {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            if (mat && mat.emissive) mat.emissive.setHex(0x000000);
          });
        } else if (child.material.emissive) {
          child.material.emissive.setHex(0x000000);
        }
      }
    });
  }
  
  selectedObject = object;
  
  // Highlight selected object
  if (selectedObject) {
    selectedObject.traverse(function(child) {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            if (mat && mat.emissive) {
              mat.emissive.setHex(0x444444);
              mat.emissiveIntensity = 0.5;
            }
          });
        } else if (child.material.emissive) {
          child.material.emissive.setHex(0x444444);
          child.material.emissiveIntensity = 0.5;
        }
      }
    });
  }
  
  updateEditorUI();
}

// Editor Mode: Copy selected object to clipboard
export function copySelectedObject() {
  if (!EDITOR_MODE || !selectedObject) return;
  
  // Store reference to the object for cloning later
  clipboard = selectedObject;
  
  // Find the original object's name
  const originalName = Array.from(objectRegistry.entries()).find(([n, obj]) => obj === selectedObject)?.[0] || 'object';
  
  document.getElementById('status').textContent = `Copied object: ${originalName} (Press V to paste)`;
  setTimeout(() => {
    document.getElementById('status').textContent = 'Street Road loaded successfully!';
  }, 2000);
}

// Editor Mode: Paste object from clipboard
export function pasteFromClipboard() {
  if (!EDITOR_MODE || !clipboard) {
    document.getElementById('status').textContent = 'Nothing to paste! Copy an object first (C key)';
    setTimeout(() => {
      document.getElementById('status').textContent = 'Street Road loaded successfully!';
    }, 2000);
    return;
  }
  
  // Clone the object from clipboard
  const cloned = clipboard.clone();
  
  // Clone all children recursively
  cloned.traverse(function(child) {
    if (child.isMesh) {
      if (child.geometry) child.geometry = child.geometry.clone();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map(mat => mat ? mat.clone() : null);
        } else {
          child.material = child.material.clone();
        }
      }
    }
  });
  
  // Offset position slightly from the original
  cloned.position.x = clipboard.position.x + 0.5;
  cloned.position.y = clipboard.position.y;
  cloned.position.z = clipboard.position.z;
  
  // Copy rotation and scale
  cloned.rotation.copy(clipboard.rotation);
  cloned.scale.copy(clipboard.scale);
  
  // Add to scene first
  scene.add(cloned);
  
  // Register and make draggable
  // Find the original object's name
  const originalName = Array.from(objectRegistry.entries()).find(([n, obj]) => obj === clipboard)?.[0] || 'object';
  const baseName = originalName.replace(/_\d+$/, ''); // Remove trailing _number
  const newName = `${baseName}_${objectRegistry.size + 1}`;
  
  // Make the cloned object draggable (this adds it to draggableObjects and reinitializes DragControls)
  makeDraggable(cloned, newName);
  
  // Ensure the object is properly set up for dragging
  cloned.traverse(function(child) {
    if (child.isMesh && !child.userData.parentDraggable) {
      child.userData.parentDraggable = cloned;
    }
  });
  
  // Select the new object so user can immediately interact with it
  selectObject(cloned);
  
  document.getElementById('status').textContent = `Pasted object: ${newName}`;
  setTimeout(() => {
    document.getElementById('status').textContent = 'Street Road loaded successfully!';
  }, 2000);
}

// Editor Mode: Rotate selected object
export function rotateSelectedObject(axis, angle) {
  if (!EDITOR_MODE || !selectedObject) return;
  
  if (axis === 'x') {
    selectedObject.rotation.x += angle;
  } else if (axis === 'y') {
    selectedObject.rotation.y += angle;
  } else if (axis === 'z') {
    selectedObject.rotation.z += angle;
  }
  
  updateEditorUI();
}

// Editor Mode: Update UI with selected object info
function updateEditorUI() {
  if (!EDITOR_MODE) return;
  
  const editorControlsDiv = document.getElementById('editor-controls');
  if (editorControlsDiv) {
    if (selectedObject) {
      const name = Array.from(objectRegistry.entries()).find(([n, obj]) => obj === selectedObject)?.[0] || 'Unknown';
      editorControlsDiv.innerHTML = `
        EDITOR MODE: Drag objects to position | Press P to export layout<br>
        <span style="color: #4caf50;">Selected: ${name}</span> | 
        C: Copy | V: Paste | R: Rotate Y | X: Rotate X | Z: Rotate Z (Shift for reverse)
      `;
    } else {
      editorControlsDiv.innerHTML = 'EDITOR MODE: Drag objects to position | Press P to export layout | Click object to select';
    }
  }
}

// Editor Mode: Export layout to JSON
export function exportLayout() {
  if (!EDITOR_MODE) return;
  
  const layout = [];
  
  objectRegistry.forEach((object, name) => {
    // For mirror streetlights, always export correct x position
    let xPos = object.position.x;
    if (name.startsWith('streetlight_mirror_')) {
      xPos = -0.8350271700107539; // Always use correct mirror x position
    }
    
    layout.push({
      name: name,
      position: {
        x: xPos,
        y: object.position.y,
        z: object.position.z
      },
      rotation: {
        x: object.rotation.x,
        y: object.rotation.y,
        z: object.rotation.z
      },
      scale: {
        x: object.scale.x,
        y: object.scale.y,
        z: object.scale.z
      }
    });
  });
  
  const jsonString = JSON.stringify(layout, null, 2);
  console.log('=== EXPORTED LAYOUT ===');
  console.log(jsonString);
  console.log('=======================');
  
  // Also copy to clipboard if possible
  if (navigator.clipboard) {
    navigator.clipboard.writeText(jsonString).then(() => {
      document.getElementById('status').textContent = 'Layout exported to console and clipboard!';
      setTimeout(() => {
        document.getElementById('status').textContent = 'Street Road loaded successfully!';
      }, 2000);
    }).catch(() => {
      document.getElementById('status').textContent = 'Layout exported to console!';
      setTimeout(() => {
        document.getElementById('status').textContent = 'Street Road loaded successfully!';
      }, 2000);
    });
  } else {
    document.getElementById('status').textContent = 'Layout exported to console!';
    setTimeout(() => {
      document.getElementById('status').textContent = 'Street Road loaded successfully!';
    }, 2000);
  }
}

// Runtime Mode: Load layout from JSON
export async function loadLayout(layoutPath = 'layout.json') {
  if (EDITOR_MODE) return;
  
  try {
    const response = await fetch(layoutPath);
    if (!response.ok) {
      console.warn(`Layout file not found: ${layoutPath}. Using default positions.`);
      return;
    }
    
    const layout = await response.json();
    
    layout.forEach(item => {
      const object = objectRegistry.get(item.name);
      if (object) {
        // Set position - for mirror streetlights, always use correct x position
        if (item.name.startsWith('streetlight_mirror_')) {
          object.position.set(-0.8350271700107539, item.position.y, item.position.z);
          // Force x position again to ensure it's set correctly (in case of any timing issues)
          object.position.x = -0.8350271700107539;
        } else {
          object.position.set(item.position.x, item.position.y, item.position.z);
        }
        object.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
        if (item.scale) {
          object.scale.set(item.scale.x, item.scale.y, item.scale.z);
        }
      } else {
        console.warn(`Object not found in registry: ${item.name}`);
      }
    });
    
    // After loading, ensure all mirror streetlights have correct x position
    objectRegistry.forEach((object, name) => {
      if (name.startsWith('streetlight_mirror_')) {
        object.position.x = -0.8350271700107539;
      }
    });
    
    console.log('Layout loaded successfully');
  } catch (error) {
    console.warn('Failed to load layout:', error);
  }
}

// Get draggable objects for click detection
export function getDraggableObjects() {
  return draggableObjects;
}

// Get object registry size (for naming)
export function getObjectRegistrySize() {
  return objectRegistry.size;
}

// Get all streetlights from registry for recycling
export function getStreetlights() {
  const streetlights = [];
  objectRegistry.forEach((object, name) => {
    if (name.startsWith('streetlight_')) {
      streetlights.push(object);
    }
  });
  return streetlights;
}

// Get all mirror streetlights from registry for recycling
export function getMirrorStreetlights() {
  const mirrorStreetlights = [];
  objectRegistry.forEach((object, name) => {
    if (name.startsWith('streetlight_mirror_')) {
      mirrorStreetlights.push(object);
    }
  });
  return mirrorStreetlights;
}

// Get findParentDraggable function for external use
export { findParentDraggable };

// Setup keyboard and mouse handlers for editor
export function setupEditorHandlers(canvas) {
  if (!EDITOR_MODE) return;
  
  // Keyboard handlers
  window.addEventListener("keydown", e => {
    // Editor Mode: Export layout with P key
    if (e.key.toLowerCase() === 'p') {
      exportLayout();
    }
    // Editor Mode: Copy selected object with C key (or Ctrl+C)
    if (e.key.toLowerCase() === 'c') {
      e.preventDefault();
      copySelectedObject();
    }
    // Editor Mode: Paste from clipboard with V key (or Ctrl+V)
    if (e.key.toLowerCase() === 'v') {
      e.preventDefault();
      pasteFromClipboard();
    }
    // Editor Mode: Rotate with R key (Y axis)
    if (e.key.toLowerCase() === 'r' && selectedObject) {
      e.preventDefault();
      const angle = e.shiftKey ? -Math.PI / 8 : Math.PI / 8;
      rotateSelectedObject('y', angle);
    }
    // Editor Mode: Rotate X axis with X key
    if (e.key.toLowerCase() === 'x' && selectedObject) {
      e.preventDefault();
      const angle = e.shiftKey ? -Math.PI / 8 : Math.PI / 8;
      rotateSelectedObject('x', angle);
    }
    // Editor Mode: Rotate Z axis with Z key
    if (e.key.toLowerCase() === 'z' && selectedObject) {
      e.preventDefault();
      const angle = e.shiftKey ? -Math.PI / 8 : Math.PI / 8;
      rotateSelectedObject('z', angle);
    }
  });
  
  // Mouse click detection for object selection
  let mouseDownPos = new THREE.Vector2();
  let mouseDownTime = 0;
  
  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0 && draggableObjects.length > 0) {
      mouseDownPos.set(e.clientX, e.clientY);
      mouseDownTime = Date.now();
      
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObjects(draggableObjects);
      if (intersects.length === 0) {
        // Clicked on empty space, deselect
        selectObject(null);
      }
    }
  });
  
  canvas.addEventListener("mouseup", (e) => {
    // Editor Mode: Detect clicks (not drags) for object selection
    if (e.button === 0) {
      const mouseUpPos = new THREE.Vector2(e.clientX, e.clientY);
      const distance = mouseDownPos.distanceTo(mouseUpPos);
      const timeDiff = Date.now() - mouseDownTime;
      
      // If mouse moved less than 5 pixels and took less than 200ms, it's a click
      if (distance < 5 && timeDiff < 200) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        
        const intersects = raycaster.intersectObjects(draggableObjects);
        if (intersects.length > 0) {
          const clickedObject = intersects[0].object;
          const parent = findParentDraggable(clickedObject);
          selectObject(parent);
        }
      }
    }
  });
  
  // Check if object is being dragged (for camera control interference)
  canvas.addEventListener("mousemove", (e) => {
    if (dragControls) {
      const isDragging = draggableObjects.some(obj => obj.userData.isDragging);
      if (isDragging) {
        // Prevent camera movement while dragging
        return true;
      }
    }
    return false;
  });
}

// Update UI based on editor mode
export function updateEditorModeUI() {
  const editorModeDiv = document.getElementById('editor-mode');
  const editorControlsDiv = document.getElementById('editor-controls');
  
  if (EDITOR_MODE) {
    editorModeDiv.textContent = 'EDITOR MODE: Active';
    editorModeDiv.style.color = '#4caf50';
    editorControlsDiv.style.display = 'block';
    updateEditorUI();
  } else {
    editorModeDiv.textContent = 'RUNTIME MODE: Active';
    editorModeDiv.style.color = '#2196f3';
    editorControlsDiv.style.display = 'none';
  }
}

