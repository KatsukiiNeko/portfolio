// Three.js Scene for Portfolio Hero Section with Limited Zoom
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

class HeroScene {
  constructor() {
    // Scene container element - we'll replace the .shape div
    this.container = document.querySelector('.shape') || document.querySelector('.hero-image');
    if (!this.container) return;
    
    // Scene dimensions
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    
    // Mouse/touch interaction states
    this.isDragging = false;
    this.isPinching = false;
    this.previousMousePosition = {
      x: 0,
      y: 0
    };
    this.previousTouchMidpoint = null; // For two-finger rotation
    this.targetRotation = {
      x: 0,
      y: 0
    };
    this.currentRotation = {
      x: 0,
      y: 0
    };
    
    // Touch hold functionality
    this.touchStartTime = 0;
    this.touchHoldDelay = 300; // ms to consider a touch as "hold"
    this.touchHoldTimer = null;
    this.isHolding = false;
    this.holdPosition = { x: 0, y: 0 };
    this.holdDistanceThreshold = 10; // pixels of movement allowed during hold
    
    // Track if we're on mobile
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Zoom limits and tracking variables (for desktop only)
    this.defaultZoomPosition = this.isMobile ? 6 : 5; // Default camera Z position
    this.minZoomDistance = 5;   // Closest zoom allowed
    this.maxZoomDistance = 3;   // Furthest zoom allowed
    this.zoomScrollCount = 0;   // Track number of zoom actions
    this.maxZoomScrolls = 3;    // Maximum allowed zoom scroll actions
    this.zoomScrollTimer = null; // For resetting zoom count after inactivity
    this.zoomScrollResetTime = 2000; // Reset zoom count after 2 seconds of inactivity
    
    // Animation properties for auto-rotation
    this.autoRotationSpeed = {
      sphere: { x: 0.005, y: 0.007, z: 0.003 },
      particles: { x: 0.002, y: -0.003, z: 0.001 }
    };
    
    // Initialize 3D scene
    this.initScene();
    this.createLights();
    this.createObject();
    this.addEventListeners();
    
    // Start animation loop
    this.animate();
  }
  
  initScene() {
    // Create scene
    this.scene = new THREE.Scene();
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      this.isMobile ? 50 : 45, // Wider FOV on mobile for better experience
      this.width / this.height, 
      0.1, 
      1000
    );
    this.camera.position.z = this.defaultZoomPosition; // Store initial camera position
    
    // Create renderer with optimizations
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: !this.isMobile, // Disable antialiasing on mobile for performance
      alpha: true,  // Transparent background
      powerPreference: "high-performance" // Request high performance GPU
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.isMobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio); // Limit pixel ratio on mobile
    
    // Clear existing content and append canvas
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Add cursor style to indicate draggable (only on desktop)
    if (!this.isMobile) {
      this.renderer.domElement.style.cursor = 'grab';
    }
    
    // Set touch-action to none to prevent browser handling of touch events
    this.renderer.domElement.style.touchAction = 'none';
  }
  
  createLights() {
    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(0, 5, 5);
    this.scene.add(mainLight);
    
    // Ambient light for overall scene illumination
    const ambientLight = new THREE.AmbientLight(0x814DE5, 0.5);
    this.scene.add(ambientLight);
    
    // Add a point light with purple color
    const purpleLight = new THREE.PointLight(0x814DE5, 2, 10);
    purpleLight.position.set(2, 1, 2);
    this.scene.add(purpleLight);
  }
  
  createObject() {
    // Create a group to hold our objects
    this.objectGroup = new THREE.Group();
    
    // Create custom shape similar to the purple blob in the design
    this.createBlobShape();
    
    // Create floating particles around the shape
    this.createParticles();
    
    // Add the group to the scene
    this.scene.add(this.objectGroup);
  }
  
  createBlobShape() {
    // Create a custom shape that resembles the purple circular shape
    // We'll use a combination of geometries to create an interesting form
    
    // Main sphere
    const sphereGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x814DE5,
      shininess: 30,
      transparent: true,
      opacity: 0.9,
    });
    this.mainSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    
    // Create a separate group for the main sphere so it can rotate independently
    this.sphereGroup = new THREE.Group();
    this.sphereGroup.add(this.mainSphere);
    this.objectGroup.add(this.sphereGroup);
    
    // Create distorted torus for interesting shape
    const torusGeometry = new THREE.TorusGeometry(0.8, 0.3, 16, 100);
    const torusMaterial = new THREE.MeshPhongMaterial({
      color: 0x6E30E3,
      shininess: 50,
      transparent: true,
      opacity: 0.7,
    });
    this.torus = new THREE.Mesh(torusGeometry, torusMaterial);
    this.torus.rotation.x = Math.PI / 2;
    this.objectGroup.add(this.torus);
    
    // Add another torus at different angle
    const torus2 = new THREE.Mesh(torusGeometry, torusMaterial);
    torus2.rotation.x = Math.PI / 4;
    torus2.rotation.y = Math.PI / 4;
    this.objectGroup.add(torus2);
  }
  
  createParticles() {
    // Create small particles around the main shape
    const particlesGeometry = new THREE.BufferGeometry();
    
    // Reduce particle count on mobile for performance
    const particleCount = this.isMobile ? 50 : 100;
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const color = new THREE.Color();
    
    for (let i = 0; i < particleCount; i++) {
      // Position particles in a sphere around the center
      const radius = 1.5 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Randomize colors between purple and light purple
      color.setHSL(0.75, 0.8, 0.4 + Math.random() * 0.4);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Optimize particle rendering for mobile
    const particlesMaterial = new THREE.PointsMaterial({
      size: this.isMobile ? 0.07 : 0.05,  // Slightly larger on mobile for visibility
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: !this.isMobile, // Disable size attenuation on mobile for performance
    });
    
    // Create separate group for particles to allow independent rotation
    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.particlesGroup = new THREE.Group();
    this.particlesGroup.add(this.particles);
    this.objectGroup.add(this.particlesGroup);
  }
  
  addEventListeners() {
    // Resize handler with debounce for better performance
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.onResize(), 100);
    });
    
    // Add event listeners based on device type
    if (this.isMobile) {
      // Touch interaction for mobile devices with passive: false for better performance
      this.renderer.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
      document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
      document.addEventListener('touchend', this.onTouchEnd.bind(this));
      document.addEventListener('touchcancel', this.onTouchEnd.bind(this));
    } else {
      // Mouse interaction for desktop
      this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
      document.addEventListener('mousemove', this.onMouseMove.bind(this));
      document.addEventListener('mouseup', this.onMouseUp.bind(this));
      document.addEventListener('mouseleave', this.onMouseUp.bind(this));
      
      // Add scroll to zoom functionality with limit
      this.renderer.domElement.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    }
    
    // Add orientation change listener for mobile devices
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.onResize(), 200);
    });
  }
  
  onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    
    // Update camera aspect ratio and projection matrix
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size
    this.renderer.setSize(this.width, this.height);
  }
  
  onMouseDown(event) {
    event.preventDefault();
    
    // Change cursor style
    this.renderer.domElement.style.cursor = 'grabbing';
    
    this.isDragging = true;
    this.previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  }
  
  onMouseMove(event) {
    if (this.isDragging) {
      const deltaMove = {
        x: event.clientX - this.previousMousePosition.x,
        y: event.clientY - this.previousMousePosition.y
      };
      
      // Update target rotation based on mouse movement
      this.targetRotation.y += deltaMove.x * 0.01;
      this.targetRotation.x += deltaMove.y * 0.01;
      
      // Limit x-rotation to avoid flipping
      this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x));
      
      this.previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    }
  }
  
  onMouseUp() {
    this.isDragging = false;
    // Change cursor style back
    this.renderer.domElement.style.cursor = 'grab';
  }
  
  onTouchStart(event) {
    if (event.touches.length === 1) {
      // Start with no default prevention to potentially allow scrolling
      const touch = event.touches[0];
      
      // Store initial touch position for hold detection
      this.holdPosition = {
        x: touch.clientX,
        y: touch.clientY
      };
      
      // Start timing for hold detection
      this.touchStartTime = Date.now();
      this.isHolding = false;
      
      // Set a timer to check for hold
      this.touchHoldTimer = setTimeout(() => {
        // After delay, consider this a hold if we're still touching
        if (this.touchStartTime > 0) {
          this.isHolding = true;
          
          // Create visual indicator for hold
          this.showHoldIndicator();
        }
      }, this.touchHoldDelay);
      
      // Meanwhile, also track for rotation
      this.isDragging = true;
      this.previousMousePosition = {
        x: touch.clientX,
        y: touch.clientY
      };
      
    } else if (event.touches.length === 2) {
      // For two-finger gestures, prevent default
      event.preventDefault();
      
      // Clear any hold detection
      this.clearHoldState();
      
      // Setup for two-finger rotation
      this.isPinching = true;
      this.isDragging = false;
      
      // Calculate initial midpoint between touches
      this.previousTouchMidpoint = {
        x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
        y: (event.touches[0].clientY + event.touches[1].clientY) / 2
      };
    }
  }
  
  showHoldIndicator() {
    // Create or update visual indicator for hold gesture
    if (!this.holdIndicator) {
      this.holdIndicator = document.createElement('div');
      this.holdIndicator.style.cssText = `
        position: absolute;
        width: 60px;
        height: 60px;
        border-radius: 30px;
        background-color: rgba(129, 77, 229, 0.2);
        border: 2px solid rgba(129, 77, 229, 0.5);
        top: ${this.holdPosition.y - 30}px;
        left: ${this.holdPosition.x - 30}px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: scale(0);
        transition: transform 0.3s ease;
        pointer-events: none;
        z-index: 1000;
      `;
      
      // Add down arrow icon
      const arrow = document.createElement('div');
      arrow.style.cssText = `
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 15px solid rgba(129, 77, 229, 0.8);
      `;
      this.holdIndicator.appendChild(arrow);
      
      document.body.appendChild(this.holdIndicator);
      
      // Animate in
      setTimeout(() => {
        if (this.holdIndicator) {
          this.holdIndicator.style.transform = 'scale(1)';
        }
      }, 10);
    }
  }
  
  clearHoldState() {
    // Clear hold timers and state
    clearTimeout(this.touchHoldTimer);
    this.touchStartTime = 0;
    this.isHolding = false;
    
    // Remove hold indicator if it exists
    if (this.holdIndicator) {
      this.holdIndicator.style.transform = 'scale(0)';
      setTimeout(() => {
        if (this.holdIndicator && this.holdIndicator.parentNode) {
          this.holdIndicator.parentNode.removeChild(this.holdIndicator);
        }
        this.holdIndicator = null;
      }, 300);
    }
  }
  
  onTouchMove(event) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      
      // Check if we're in a hold state
      if (this.isHolding) {
        // Don't prevent default - let the page scroll naturally
        return;
      }
      
      // Check if the user has moved enough to consider it a drag rather than a potential hold
      const moveDistance = Math.sqrt(
        Math.pow(touch.clientX - this.holdPosition.x, 2) + 
        Math.pow(touch.clientY - this.holdPosition.y, 2)
      );
      
      // If moved significantly, cancel hold detection
      if (moveDistance > this.holdDistanceThreshold) {
        this.clearHoldState();
      }
      
      // Only prevent default and handle rotation if we're not in hold mode
      if (this.isDragging && !this.isHolding) {
        // Prevent default to stop scrolling only for rotation
        event.preventDefault();
        
        const deltaMove = {
          x: touch.clientX - this.previousMousePosition.x,
          y: touch.clientY - this.previousMousePosition.y
        };
        
        // Make rotation speed based on screen size for consistent feel across devices
        const rotationSpeed = 0.01 * (Math.min(window.innerWidth, window.innerHeight) / 500);
        
        // Update target rotation based on touch movement
        this.targetRotation.y += deltaMove.x * rotationSpeed;
        this.targetRotation.x += deltaMove.y * rotationSpeed;
        
        // Limit x-rotation to avoid flipping
        this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x));
        
        this.previousMousePosition = {
          x: touch.clientX,
          y: touch.clientY
        };
      }
    } 
    // Handle two-finger gesture as rotation only (zoom disabled on mobile)
    else if (event.touches.length === 2) {
      // Always prevent default for two-finger gestures
      event.preventDefault();
      
      // Clear any hold state since we're now using two fingers
      this.clearHoldState();
      
      // Calculate midpoint between the two touch points
      const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
      const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
      
      // Calculate delta from previous position (if we have one)
      if (this.previousTouchMidpoint) {
        const deltaMove = {
          x: midX - this.previousTouchMidpoint.x,
          y: midY - this.previousTouchMidpoint.y
        };
        
        // Apply rotation based on the midpoint movement
        const rotationSpeed = 0.01 * (Math.min(window.innerWidth, window.innerHeight) / 500);
        this.targetRotation.y += deltaMove.x * rotationSpeed;
        this.targetRotation.x += deltaMove.y * rotationSpeed;
        
        // Limit x-rotation to avoid flipping
        this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x));
      }
      
      // Store current midpoint for next move
      this.previousTouchMidpoint = { x: midX, y: midY };
    }
  }
  
  onTouchEnd(event) {
    // Clean up hold state when touch ends
    this.clearHoldState();
    
    if (event.touches.length === 0) {
      this.isDragging = false;
      this.isPinching = false;
      this.previousTouchMidpoint = null;
    } else if (event.touches.length === 1) {
      // If we were pinching and now have 1 finger left
      this.isPinching = false;
      this.isDragging = true;
      this.previousTouchMidpoint = null;
      this.previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
      
      // Reset for potential new hold with remaining finger
      this.holdPosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
      this.touchStartTime = Date.now();
      
      // Set new hold timer for the remaining finger
      this.touchHoldTimer = setTimeout(() => {
        if (this.touchStartTime > 0) {
          this.isHolding = true;
          this.showHoldIndicator();
        }
      }, this.touchHoldDelay);
    }
  }
  
  onWheel(event) {
    // Check if we've exceeded our zoom limit
    if (this.zoomScrollCount >= this.maxZoomScrolls) {
      // If limit reached, allow default scroll behavior (don't preventDefault)
      return;
    }
    
    // Prevent default only if we're still within our zoom limit
    event.preventDefault();
    
    // Increment our scroll counter
    this.zoomScrollCount++;
    
    // Start timer to reset zoom count
    this.resetZoomScrollTimer();
    
    // Zoom in/out with mouse wheel
    const zoomSpeed = 0.8; // Larger value for fewer scrolls
    const direction = event.deltaY > 0 ? 1 : -1;
    
    // Update camera position within limits
    this.camera.position.z = Math.max(
      this.minZoomDistance, 
      Math.min(this.maxZoomDistance, this.camera.position.z + direction * zoomSpeed)
    );
  }
  
  // Reset zoom scroll count after a period of inactivity
  resetZoomScrollTimer() {
    // Clear any existing timer
    if (this.zoomScrollTimer) {
      clearTimeout(this.zoomScrollTimer);
    }
    
    // Set new timer
    this.zoomScrollTimer = setTimeout(() => {
      this.zoomScrollCount = 0;
    }, this.zoomScrollResetTime);
  }
  
  animate() {
    // Use RAF for animation loop
    requestAnimationFrame(this.animate.bind(this));
    
    // Performance optimization: skip frames on low-end devices if needed
    if (this.isMobile && this.shouldSkipFrame()) {
      return;
    }
    
    // Smoothly interpolate to target rotation with device-optimized speeds
    const rotationSpeed = this.isMobile ? 0.08 : 0.1;
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * rotationSpeed;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * rotationSpeed;
    
    // Apply rotations to the object group
    this.objectGroup.rotation.x = this.currentRotation.x;
    this.objectGroup.rotation.y = this.currentRotation.y;
    
    // Adjust animation speeds based on device for performance
    const torusSpeed = this.isMobile ? 0.003 : 0.005;
    const idleRotationSpeed = this.isMobile ? 0.0005 : 0.001;
    
    // Rotate torus in opposite direction for added visual interest
    if (this.torus) {
      this.torus.rotation.z += torusSpeed;
    }
    
    // Auto-rotate the sphere independently
    if (this.sphereGroup) {
      this.sphereGroup.rotation.x += this.autoRotationSpeed.sphere.x;
      this.sphereGroup.rotation.y += this.autoRotationSpeed.sphere.y;
      this.sphereGroup.rotation.z += this.autoRotationSpeed.sphere.z;
    }
    
    // Rotate particles in a different direction
    if (this.particlesGroup) {
      this.particlesGroup.rotation.x += this.autoRotationSpeed.particles.x;
      this.particlesGroup.rotation.y += this.autoRotationSpeed.particles.y;
      this.particlesGroup.rotation.z += this.autoRotationSpeed.particles.z;
    }
    
    // Add subtle autonomous motion when not being dragged
    if (!this.isDragging && !this.isPinching) {
      this.targetRotation.y += idleRotationSpeed;
    }
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  // Helper method to adaptively skip frames on low-end devices
  shouldSkipFrame() {
    // Only initialize when needed
    if (!this.frameCount) {
      this.frameCount = 0;
      this.lastFpsCheck = performance.now();
      this.frameSkip = 0;
    }
    
    this.frameCount++;
    
    // Check FPS every second
    const now = performance.now();
    if (now - this.lastFpsCheck > 1000) {
      const fps = this.frameCount * 1000 / (now - this.lastFpsCheck);
      this.lastFpsCheck = now;
      this.frameCount = 0;
      
      // Adjust frame skipping based on FPS
      if (fps < 30) this.frameSkip = Math.min(this.frameSkip + 1, 2); // Max skip 2 frames
      else if (fps > 50) this.frameSkip = Math.max(this.frameSkip - 1, 0);
    }
    
    // Skip rendering for smoother experience on low-end devices
    if (this.frameSkip > 0) {
      return (this.frameCount % (this.frameSkip + 1)) !== 0;
    }
    return false;
  }
}

// Initialize the scene when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Ensure we initialize the scene after all other scripts
  setTimeout(() => {
    window.heroScene = new HeroScene();
  }, 100);
});

// Add a small instruction hint to help users know they can interact
function addInteractionHint() {
  // Create hint element
  const hintElement = document.createElement('div');
  
  // Detect if we're on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Set appropriate text based on device
  hintElement.textContent = isMobile ? 
    'Drag to rotate • Hold to scroll' : 
    'Drag to rotate • Scroll to zoom (3 times max)';
  
  hintElement.style.cssText = `
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    padding: ${isMobile ? '8px 12px' : '5px 10px'};
    border-radius: 4px;
    font-size: ${isMobile ? '14px' : '12px'};
    opacity: 0.8;
    transition: opacity 0.3s;
    pointer-events: none;
    z-index: 10;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  
  // Add the hint to the container
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.shape') || document.querySelector('.hero-image');
    if (container) {
      container.style.position = 'relative';
      container.appendChild(hintElement);
      
      // Show hint for longer on mobile and fade out
      setTimeout(() => {
        hintElement.style.opacity = 0;
      }, isMobile ? 7000 : 5000);
    }
  });
}

addInteractionHint();

export default HeroScene;
