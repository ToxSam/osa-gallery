/// src/components/VRMViewer/VRMInspectorViewer.jsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { loadMixamoAnimation } from './utils/animationLoader';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { SkeletonHelper } from 'three';
import { useI18n } from '@/lib/i18n';

export const VRMInspectorViewer = ({ url, onMetadataLoad }) => {
  const { t } = useI18n();
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const vrmRef = useRef(null);
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const loadingIndicatorRef = useRef(null);
  const frameIdRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const isDraggingAvatarRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const skeletonHelperRef = useRef(null);
  const boneMarkersRef = useRef([]);
  const boneConnectionsRef = useRef([]);
  const originalMaterialsRef = useRef(new Map()); // Store original materials for wireframe toggle
  const boneReferencesRef = useRef([]); // Store bone references for updates
  const heightMeterRef = useRef(null); // Store height meter reference
  const particleSystemRef = useRef(null); // Store particle system reference
  const floorRef = useRef(null);
  const prevUrlRef = useRef(null);
  const contextLostRef = useRef(false);
  const avatarOriginalPositionRef = useRef(new THREE.Vector3(0, 0, 0));
  const hipsOriginalPositionRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [skeletonMode, setSkeletonMode] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [avatarHeight, setAvatarHeight] = useState(0);
  const [showAnimationPanel, setShowAnimationPanel] = useState(true);
  const [currentAnimation, setCurrentAnimation] = useState(null);
  const [isLoadingAnimation, setIsLoadingAnimation] = useState(false);
  const [hasLoadedAvatar, setHasLoadedAvatar] = useState(false);

  // Modify the initialization effect to not depend on t
  useEffect(() => {
    if (!canvasRef.current) return;
  
    console.log('Initializing 3D scene');
    let isActive = true;
    const canvas = canvasRef.current;
  
    try {
      // Initialize renderer
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      // Don't use tone mapping - it desaturates colors like pure white wireframes
      // renderer.outputColorSpace = THREE.SRGBColorSpace;
      // renderer.toneMapping = THREE.ACESFilmicToneMapping;
      // renderer.toneMappingExposure = 1;

      // IMPORTANT: Only set these after the renderer is created
      const gl = renderer.getContext();
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

      // Set up texture loader with correct settings
      const textureLoader = new THREE.TextureLoader();
      textureLoader.manager.onLoad = () => {
        const gl = renderer.getContext();
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      };

      rendererRef.current = renderer;
      
      // Handle resizing
      const handleResize = () => {
        if (!canvas.parentElement) return;
        
        const width = canvas.parentElement.clientWidth;
        const height = canvas.parentElement.clientHeight;
        const aspectRatio = width / height;
        
        if (cameraRef.current) {
          cameraRef.current.aspect = aspectRatio;
          cameraRef.current.updateProjectionMatrix();
        }
        
        renderer.setSize(width, height, false);
      };
  
      handleResize();
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(canvas.parentElement);

      // Create scene
      const scene = new THREE.Scene();
      
      // Transparent background - no gradient, scene will be transparent
      scene.background = null;
      
      // No fog needed with transparent background
      sceneRef.current = scene;

      // Setup camera
      const camera = new THREE.PerspectiveCamera(
        45.0,
        (canvas.clientWidth || 800) / (canvas.clientHeight || 600),
        0.1,
        100.0
      );
      camera.position.set(0, 1.5, 3);
      camera.lookAt(0, 1, 0);
      cameraRef.current = camera;

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 1);
      mainLight.position.set(1, 2, 1);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 1024;
      mainLight.shadow.mapSize.height = 1024;
      scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
      fillLight.position.set(-1, 1, -1);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xffcc88, 0.5);
      rimLight.position.set(0, 0, -5);
      scene.add(rimLight);
      
      // Add small circular grid around the character (matching VRMViewer)
      const circleRadius = 2; // Small circle around character
      const segments = 32; // Number of segments for the circle
      
      // Create circular grid using lines
      const circularGridGroup = new THREE.Group();
      
      // Create concentric circles
      const numCircles = 4;
      for (let i = 1; i <= numCircles; i++) {
        const radius = (circleRadius / numCircles) * i;
        const circleGeometry = new THREE.BufferGeometry();
        const circlePoints = [];
        
        for (let j = 0; j <= segments; j++) {
          const angle = (j / segments) * Math.PI * 2;
          circlePoints.push(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
          );
        }
        
        circleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(circlePoints, 3));
        const circleMaterial = new THREE.LineBasicMaterial({ 
          color: 0x888888, 
          transparent: true, 
          opacity: 0.5 
        });
        const circleLine = new THREE.Line(circleGeometry, circleMaterial);
        circularGridGroup.add(circleLine);
      }
      
      // Create radial lines
      const numRadialLines = 8;
      for (let i = 0; i < numRadialLines; i++) {
        const angle = (i / numRadialLines) * Math.PI * 2;
        const lineGeometry = new THREE.BufferGeometry();
        const linePoints = [
          0, 0, 0,
          Math.cos(angle) * circleRadius, 0, Math.sin(angle) * circleRadius
        ];
        
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: 0x888888, 
          transparent: true, 
          opacity: 0.5 
        });
        const radialLine = new THREE.Line(lineGeometry, lineMaterial);
        circularGridGroup.add(radialLine);
      }
      
      circularGridGroup.position.y = 0.01;
      scene.add(circularGridGroup);
      floorRef.current = circularGridGroup; // Store floor reference so it persists
      
      // Create smoke/dust particle system with 3 layers
      const particleCount = 120; // Further reduced particle count
      const particles = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const velocities = new Float32Array(particleCount);
      const maxHeights = new Float32Array(particleCount); // Max height for each layer
      const lifetimes = new Float32Array(particleCount); // Track particle lifetime (0 to 1)
      const sizes = new Float32Array(particleCount);
      const rotations = new Float32Array(particleCount); // Rotation angle for each particle
      const rotationSpeeds = new Float32Array(particleCount); // Rotation speed
      const baseSizes = new Float32Array(particleCount); // Store base size for fade calculations
      const colors = new Float32Array(particleCount * 3); // RGB color for each particle
      
      const clearRadius = 3.0; // Radius around character where particles don't spawn
      const midRadius = 6.0; // Mid layer boundary
      const outerRadius = 10; // Outer layer boundary
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Generate position in layers
        const angle = Math.random() * Math.PI * 2;
        const rand = Math.random();
        let distanceFromCenter, velocity, maxHeight;
        
        // Distribute particles across 3 layers with different sizes and colors
        // 60% inner, 25% mid, 15% outer (most particles close)
        let baseSize;
        let colorBrightness;
        let rotationSpeed;
        
        if (rand < 0.60) {
          // Inner layer: between clearRadius and midRadius - SMALLEST & DARKEST (most particles here)
          distanceFromCenter = clearRadius + Math.random() * (midRadius - clearRadius);
          velocity = Math.random() * 0.0003 + 0.0002; // Ultra slow: 0.0002-0.0005
          maxHeight = 0.3; // Rise only 0.3m
          baseSize = Math.random() * 0.06 + 0.08; // Smallest: 0.08 to 0.14
          colorBrightness = 0.50 + Math.random() * 0.10; // Darkest: 0.50-0.60 (subtle dark grey)
          rotationSpeed = (Math.random() - 0.5) * 0.3; // Fastest rotation: -0.15 to 0.15 (50% faster)
        } else if (rand < 0.85) {
          // Mid layer: between midRadius and outerRadius - MEDIUM SIZE & MEDIUM BRIGHTNESS
          distanceFromCenter = midRadius + Math.random() * (outerRadius - midRadius);
          velocity = Math.random() * 0.0005 + 0.0005; // Very slow: 0.0005-0.001
          maxHeight = 0.6; // Rise 0.6m
          baseSize = Math.random() * 0.10 + 0.13; // Medium: 0.13 to 0.23
          colorBrightness = 0.60 + Math.random() * 0.10; // Medium: 0.60-0.70 (subtle medium grey)
          rotationSpeed = (Math.random() - 0.5) * 0.2; // Medium rotation: -0.1 to 0.1
        } else {
          // Outer layer: beyond outerRadius - BIGGEST & LIGHTEST (fewest particles)
          distanceFromCenter = outerRadius + Math.random() * 3;
          velocity = Math.random() * 0.0008 + 0.0008; // Slow: 0.0008-0.0016
          maxHeight = 1.0; // Rise 1.0m
          baseSize = Math.random() * 0.14 + 0.18; // Biggest: 0.18 to 0.32
          colorBrightness = 0.70 + Math.random() * 0.10; // Lightest: 0.70-0.80 (subtle light grey)
          rotationSpeed = (Math.random() - 0.5) * 0.2; // Medium rotation: -0.1 to 0.1
        }
        
        const x = Math.cos(angle) * distanceFromCenter;
        const z = Math.sin(angle) * distanceFromCenter;
        
        positions[i3] = x;
        positions[i3 + 1] = 0.02 + Math.random() * 0.03; // All spawn very close to floor (0.02-0.05m)
        positions[i3 + 2] = z;
        
        velocities[i] = velocity;
        maxHeights[i] = maxHeight;
        
        // Random starting lifetime (0 to 1, where 1 is just born)
        lifetimes[i] = Math.random();
        
        // Set size based on layer
        sizes[i] = baseSize;
        baseSizes[i] = baseSize;
        
        // Set color based on layer (RGB - all same value for grey)
        colors[i3] = colorBrightness;
        colors[i3 + 1] = colorBrightness;
        colors[i3 + 2] = colorBrightness;
        
        // Random rotation (speed already set above based on layer)
        rotations[i] = Math.random() * Math.PI * 2;
        rotationSpeeds[i] = rotationSpeed;
      }
      
      particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      particles.setAttribute('rotation', new THREE.BufferAttribute(rotations, 1));
      particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      // Create particle material with custom shader for rotation support
      const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
          map: { value: createSquareTexture() },
        },
        vertexShader: `
          attribute float size;
          attribute float rotation;
          attribute vec3 color;
          varying float vRotation;
          varying vec3 vColor;
          
          void main() {
            vRotation = rotation;
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (400.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D map;
          varying float vRotation;
          varying vec3 vColor;
          
          void main() {
            vec2 center = vec2(0.5, 0.5);
            vec2 uv = gl_PointCoord - center;
            
            // Apply rotation
            float c = cos(vRotation);
            float s = sin(vRotation);
            mat2 rotationMatrix = mat2(c, -s, s, c);
            uv = rotationMatrix * uv + center;
            
            // Sample texture
            vec4 texColor = texture2D(map, uv);
            
            // Apply per-particle color and output with better visibility
            gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * 0.7);
          }
        `,
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
      });
      
      const particleSystem = new THREE.Points(particles, particleMaterial);
      particleSystem.userData.velocities = velocities;
      particleSystem.userData.maxHeights = maxHeights;
      particleSystem.userData.lifetimes = lifetimes;
      particleSystem.userData.rotationSpeeds = rotationSpeeds;
      particleSystem.userData.baseSizes = baseSizes;
      particleSystem.userData.clearRadius = clearRadius;
      particleSystem.userData.midRadius = midRadius;
      particleSystem.userData.outerRadius = outerRadius;
      particleSystem.userData.startPositions = new Float32Array(positions); // Store original positions
      scene.add(particleSystem);
      particleSystemRef.current = particleSystem;
      
      // Create height meter/ruler
      const createHeightMeter = (maxHeight = 2.5, avatarHeight = 0, avatarWidth = 0) => {
        const meterGroup = new THREE.Group();
        
        // Position ruler based on actual avatar width - similar to camera positioning logic
        // Always position at a fixed small offset from the avatar's edge
        const edgeOffset = 0.15; // Small consistent offset from avatar edge
        const meterX = avatarWidth > 0 
          ? -(avatarWidth / 2 + edgeOffset) // Position just outside avatar's left edge
          : -0.5; // Default fallback position
        
        // Create main vertical line (ruler bar) - slightly thicker
        const lineGeometry = new THREE.BufferGeometry();
        const linePoints = [
          meterX, 0, 0,
          meterX, maxHeight, 0
        ];
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: 0x888888, // Grey color matching the floor grid
          transparent: true, 
          opacity: 0.6,
          linewidth: 3
        });
        const verticalLine = new THREE.Line(lineGeometry, lineMaterial);
        meterGroup.add(verticalLine);
        
        // Create detailed tick marks with multiple levels
        const majorTickInterval = 0.5; // Major ticks every 0.5 meters
        const minorTickInterval = 0.1; // Minor ticks every 0.1 meters
        const microTickInterval = 0.05; // Micro ticks every 0.05 meters
        const numTicks = Math.ceil(maxHeight / microTickInterval);
        
        for (let i = 0; i <= numTicks; i++) {
          const height = i * microTickInterval;
          if (height > maxHeight) break;
          
          let tickLength, tickOpacity;
          const isMajor = Math.abs(height % majorTickInterval) < 0.001;
          const isMinor = Math.abs(height % minorTickInterval) < 0.001;
          
          if (isMajor) {
            // Major ticks (0.5m intervals) - longest
            tickLength = 0.12;
            tickOpacity = 0.7;
          } else if (isMinor) {
            // Minor ticks (0.1m intervals) - medium
            tickLength = 0.08;
            tickOpacity = 0.5;
          } else {
            // Micro ticks (0.05m intervals) - shortest
            tickLength = 0.04;
            tickOpacity = 0.3;
          }
          
          // Create tick mark (facing inward toward the center)
          const tickGeometry = new THREE.BufferGeometry();
          const tickPoints = [
            meterX, height, 0,
            meterX + tickLength, height, 0
          ];
          tickGeometry.setAttribute('position', new THREE.Float32BufferAttribute(tickPoints, 3));
          const tickMaterial = new THREE.LineBasicMaterial({ 
            color: 0x888888,
            transparent: true, 
            opacity: tickOpacity,
            linewidth: isMajor ? 2 : 1
          });
          const tickLine = new THREE.Line(tickGeometry, tickMaterial);
          meterGroup.add(tickLine);
          
          // Add text label at major tick intervals
          if (isMajor) {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.font = 'bold 48px Arial';
            ctx.fillStyle = '#888888'; // Grey color matching grid
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(height.toFixed(1), 118, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ 
              map: texture, 
              transparent: true,
              depthTest: false
            });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(0.2, 0.1, 1);
            sprite.position.set(meterX - 0.12, height, 0);
            meterGroup.add(sprite);
          }
        }
        
        // Add "m" (meters) label at the top
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 128;
        labelCanvas.height = 64;
        const labelCtx = labelCanvas.getContext('2d');
        labelCtx.font = 'bold 42px Arial';
        labelCtx.fillStyle = '#888888'; // Grey color matching grid
        labelCtx.textAlign = 'center';
        labelCtx.textBaseline = 'middle';
        labelCtx.fillText('m', 64, 32);
        
        const labelTexture = new THREE.CanvasTexture(labelCanvas);
        const labelMaterial = new THREE.SpriteMaterial({ 
          map: labelTexture, 
          transparent: true,
          depthTest: false
        });
        const labelSprite = new THREE.Sprite(labelMaterial);
        labelSprite.scale.set(0.15, 0.075, 1);
        labelSprite.position.set(meterX, maxHeight + 0.15, 0);
        meterGroup.add(labelSprite);
        
        // Add dynamic avatar height display at the avatar's actual height (if avatar height is provided)
        if (avatarHeight > 0) {
          // Create horizontal line pointing to the height (shorter so text sits on top)
          const heightLineGeometry = new THREE.BufferGeometry();
          const heightLinePoints = [
            meterX, avatarHeight, 0,
            meterX + 0.25, avatarHeight, 0  // Shorter line, text will start after this
          ];
          heightLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(heightLinePoints, 3));
          const heightLineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x888888, // Grey color matching grid
            transparent: true, 
            opacity: 0.7,
            linewidth: 3
          });
          const heightLine = new THREE.Line(heightLineGeometry, heightLineMaterial);
          meterGroup.add(heightLine);
          
          // Create the height text in grey
          const heightCanvas = document.createElement('canvas');
          heightCanvas.width = 512;
          heightCanvas.height = 128;
          const heightCtx = heightCanvas.getContext('2d');
          heightCtx.font = 'bold 90px Arial';
          heightCtx.fillStyle = '#888888'; // Grey color matching grid
          heightCtx.textAlign = 'left';
          heightCtx.textBaseline = 'middle';
          heightCtx.fillText(`${avatarHeight.toFixed(2)}m`, 10, 64);
          
          const heightTexture = new THREE.CanvasTexture(heightCanvas);
          const heightMaterial = new THREE.SpriteMaterial({ 
            map: heightTexture, 
            transparent: true,
            depthTest: false
          });
          const heightSprite = new THREE.Sprite(heightMaterial);
          heightSprite.scale.set(0.65, 0.16, 1);
          heightSprite.position.set(meterX + 0.55, avatarHeight, 0); // Text starts after the line ends
          meterGroup.add(heightSprite);
        }
        
        return meterGroup;
      };
      
      // Add initial height meter (will be updated when avatar loads)
      const heightMeter = createHeightMeter(2.5, 0, 0);
      heightMeter.position.y = 0.01;
      heightMeter.visible = false; // Start invisible, will be shown when first avatar loads
      scene.add(heightMeter);
      heightMeterRef.current = heightMeter;
      
      // Function to update height meter based on avatar height and width
      window.updateHeightMeter = (avatarHeight, avatarWidth = 0) => {
        if (heightMeterRef.current && sceneRef.current) {
          // Store current visibility state before removing
          const currentVisibility = heightMeterRef.current.visible;
          
          sceneRef.current.remove(heightMeterRef.current);
          
          // Dispose of old geometries and materials
          heightMeterRef.current.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (obj.material.map) obj.material.map.dispose();
              obj.material.dispose();
            }
          });
          
          // Create new meter with appropriate height, avatar height, and width
          const maxHeight = Math.ceil(avatarHeight * 1.2); // 20% taller than avatar
          const newMeter = createHeightMeter(maxHeight, avatarHeight, avatarWidth);
          newMeter.position.y = 0.01;
          newMeter.visible = currentVisibility; // Preserve visibility state
          sceneRef.current.add(newMeter);
          heightMeterRef.current = newMeter;
        }
      };
      
      // Create loading indicator - from original VRMViewer
      const loadingCanvas = document.createElement('canvas');
      loadingCanvas.width = 256;
      loadingCanvas.height = 256;
      const ctx = loadingCanvas.getContext('2d');
      ctx.font = 'bold 180px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText('⏳', 128, 128);
      
      const loadingTexture = new THREE.CanvasTexture(loadingCanvas);
      const loadingMaterial = new THREE.SpriteMaterial({
        map: loadingTexture,
        transparent: true,
        depthTest: false
      });
      
      const loadingSprite = new THREE.Sprite(loadingMaterial);
      loadingSprite.scale.set(0.5, 0.5, 1);
      loadingSprite.position.set(0, 1.0, 0);
      loadingSprite.visible = false; // Initially hidden
      scene.add(loadingSprite);
      loadingIndicatorRef.current = loadingSprite;
      
      // Setup controls
      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      // Use same controls settings as original VRMViewer
      controls.maxPolarAngle = Math.PI / 1.8;
      controls.minPolarAngle = 0;
      controls.enableZoom = true;
      controls.minDistance = 1;
      controls.maxDistance = 5;
      controls.target.set(0, 1, 0);
      
      // Make sure we enable all needed controls
      controls.enableRotate = true;
      controls.enablePan = true;
      
      // Additional controls settings to ensure they work properly
      controls.rotateSpeed = 0.7;
      controls.zoomSpeed = 1.0;
      controls.panSpeed = 0.7;
      
      // Prevent orbitcontrols from capturing keyboard
      controls.enableKeys = false;
      
      // Make sure touch controls work on mobile
      controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
      
      // Ensure controls are properly set up
      controls.update();
      controlsRef.current = controls;

      // Avatar direct rotation controls from original VRMViewer
      const handleMouseDown = (event) => {
        if (!vrmRef.current) return;
        
        // Get canvas-relative mouse coordinates
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        mouseRef.current.set(x, y);
        
        // Ensure raycaster is initialized
        if (!raycasterRef.current) {
          raycasterRef.current = new THREE.Raycaster();
        }
        
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        
        // Check if we're clicking on the avatar
        const intersects = raycasterRef.current.intersectObject(vrmRef.current.scene, true);
        
        if (intersects.length > 0) {
          // We clicked on the avatar
          isDraggingAvatarRef.current = true;
          previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
          
          // Disable orbit controls while dragging the avatar
          if (controlsRef.current) {
            controlsRef.current.enabled = false;
          }
        }
      };
      
      const handleMouseMove = (event) => {
        if (isDraggingAvatarRef.current && vrmRef.current) {
          // Calculate rotation based on mouse movement
          const deltaX = event.clientX - previousMousePositionRef.current.x;
          
          // Rotate the avatar around its Y-axis
          vrmRef.current.scene.rotation.y += deltaX * 0.01;
          
          // Update previous position
          previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
        }
      };
      
      const handleMouseUp = () => {
        if (isDraggingAvatarRef.current) {
          isDraggingAvatarRef.current = false;
          
          // Re-enable orbit controls
          if (controlsRef.current) {
            controlsRef.current.enabled = true;
          }
        }
      };
      
      // Add event listeners for avatar rotation
      canvas.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      // Animation loop
      const animate = () => {
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          const delta = clockRef.current.getDelta();
          
          // Update controls even when model is not loaded
          if (controlsRef.current) {
            controlsRef.current.update();
          }
          
          // Update VRM animations
          if (vrmRef.current) {
            // If there's a mixer with animations, update it
            if (mixerRef.current) {
              mixerRef.current.update(delta);
            }
            
            // Update VRM with proper delta time for smooth animations
            if (typeof vrmRef.current.update === 'function') {
              vrmRef.current.update(delta);
            }
            
            // Lock scene Y position to prevent vertical drift
            if (avatarOriginalPositionRef.current) {
              vrmRef.current.scene.position.y = avatarOriginalPositionRef.current.y;
            }
            
            // Lock hips bone Y position - this is what animations actually move!
            if (hipsOriginalPositionRef.current) {
              const hipsNode = vrmRef.current.humanoid?.getNormalizedBoneNode('hips');
              if (hipsNode) {
                hipsNode.position.y = hipsOriginalPositionRef.current.y;
              }
            }
            
            // Update bone visualizations if enabled
            if (skeletonMode) {
              updateBoneVisualizations();
            }
          }
          
          // Animate particles (smoke/dust)
          if (particleSystemRef.current) {
            const positions = particleSystemRef.current.geometry.attributes.position.array;
            const sizes = particleSystemRef.current.geometry.attributes.size.array;
            const rotations = particleSystemRef.current.geometry.attributes.rotation.array;
            const velocities = particleSystemRef.current.userData.velocities;
            const maxHeights = particleSystemRef.current.userData.maxHeights;
            const lifetimes = particleSystemRef.current.userData.lifetimes;
            const rotationSpeeds = particleSystemRef.current.userData.rotationSpeeds;
            const baseSizes = particleSystemRef.current.userData.baseSizes;
            const startPositions = particleSystemRef.current.userData.startPositions;
            
            for (let i = 0; i < positions.length / 3; i++) {
              const i3 = i * 3;
              
              // Move particle up only
              positions[i3 + 1] += velocities[i];
              
              // Update rotation
              rotations[i] += rotationSpeeds[i] * delta;
              
              // Decrease lifetime even more slowly for very subtle, long animation
              lifetimes[i] -= delta * 0.03; // Even slower (was 0.05)
              
              // Calculate fade/opacity factor for smooth transitions
              let opacityFactor = 1.0;
              if (lifetimes[i] > 0.8) {
                // Gentler fade in during first 20% of lifetime
                const t = (1.0 - lifetimes[i]) / 0.2; // 0 to 1 during fade in
                // More visible during fade: starts at 0.3 instead of 0
                opacityFactor = 0.3 + (t * t * (3.0 - 2.0 * t) * 0.7);
              } else if (lifetimes[i] < 0.2) {
                // Gradual fade out during last 20% of lifetime
                const t = lifetimes[i] / 0.2; // 1 to 0 during fade out
                opacityFactor = t * t * (3.0 - 2.0 * t); // Smoothstep easing
              }
              
              // Calculate size: start at full size, shrink as lifetime decreases
              // lifetimes[i] goes from 1.0 -> 0.0, so particles shrink over time
              const sizeFactor = 0.5 + (lifetimes[i] * 0.5); // Start at 1.0, end at 0.5 (less shrinking)
              
              // Apply both factors to size (opacity controls fade, sizeFactor controls shrinking)
              sizes[i] = baseSizes[i] * opacityFactor * sizeFactor;
              
              // Get the height this particle started at
              const startY = startPositions[i3 + 1];
              const currentHeight = positions[i3 + 1] - startY;
              
              // Reset particle if lifetime is over or it reaches its max height
              if (lifetimes[i] <= 0 || currentHeight > maxHeights[i]) {
                // Reset to original spawn position
                positions[i3] = startPositions[i3];
                positions[i3 + 1] = startPositions[i3 + 1];
                positions[i3 + 2] = startPositions[i3 + 2];
                
                // Reset lifetime
                lifetimes[i] = 1.0;
                
                // Reset rotation
                rotations[i] = Math.random() * Math.PI * 2;
                
                // Recalculate layer-based properties on respawn
                const x = positions[i3];
                const z = positions[i3 + 2];
                const distFromCenter = Math.sqrt(x * x + z * z);
                
                // Determine which layer this particle is in and set appropriate size/color
                if (distFromCenter < particleSystemRef.current.userData.midRadius) {
                  // Inner layer - smallest & darkest, fastest rotation
                  baseSizes[i] = Math.random() * 0.06 + 0.08;
                  const brightness = 0.50 + Math.random() * 0.10;
                  const colors = particleSystemRef.current.geometry.attributes.color.array;
                  colors[i3] = brightness;
                  colors[i3 + 1] = brightness;
                  colors[i3 + 2] = brightness;
                } else if (distFromCenter < particleSystemRef.current.userData.outerRadius) {
                  // Mid layer - medium size & brightness
                  baseSizes[i] = Math.random() * 0.10 + 0.13;
                  const brightness = 0.60 + Math.random() * 0.10;
                  const colors = particleSystemRef.current.geometry.attributes.color.array;
                  colors[i3] = brightness;
                  colors[i3 + 1] = brightness;
                  colors[i3 + 2] = brightness;
                } else {
                  // Outer layer - biggest & lightest
                  baseSizes[i] = Math.random() * 0.14 + 0.18;
                  const brightness = 0.70 + Math.random() * 0.10;
                  const colors = particleSystemRef.current.geometry.attributes.color.array;
                  colors[i3] = brightness;
                  colors[i3 + 1] = brightness;
                  colors[i3 + 2] = brightness;
                }
                
                // Reset size (will be faded in by the fade factor calculation)
                sizes[i] = baseSizes[i];
                
                // Mark color attribute as needing update
                particleSystemRef.current.geometry.attributes.color.needsUpdate = true;
              }
            }
            
            particleSystemRef.current.geometry.attributes.position.needsUpdate = true;
            particleSystemRef.current.geometry.attributes.size.needsUpdate = true;
            particleSystemRef.current.geometry.attributes.rotation.needsUpdate = true;
          }
          
          // Render scene
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
        
        // Continue animation loop only if component is still mounted
        if (isActive) {
          frameIdRef.current = requestAnimationFrame(animate);
        }
      };
      
      // Start animation loop
      animate();

      // Cleanup function
      return () => {
        isActive = false;
        if (frameIdRef.current) {
          cancelAnimationFrame(frameIdRef.current);
        }
        
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        
        // Remove event listeners
        canvas.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }

        // Clean up particle system
        if (particleSystemRef.current) {
          if (particleSystemRef.current.geometry) particleSystemRef.current.geometry.dispose();
          if (particleSystemRef.current.material) {
            // Clean up shader material uniforms
            if (particleSystemRef.current.material.uniforms && particleSystemRef.current.material.uniforms.map) {
              if (particleSystemRef.current.material.uniforms.map.value) {
                particleSystemRef.current.material.uniforms.map.value.dispose();
              }
            }
            particleSystemRef.current.material.dispose();
          }
        }

        if (vrmRef.current) {
          VRMUtils.deepDispose(vrmRef.current.scene);
        }
      };
    } catch (err) {
      console.error('Error initializing scene:', err);
      setError('Failed to initialize 3D scene');
    }
  }, []); // Remove t from dependencies

  // Add separate effect for error message translation
  useEffect(() => {
    if (error) {
      setError(t('vrmviewer.errors.initializationFailed'));
    }
  }, [t, error]);

  // Handle URL changes to load the VRM model
  useEffect(() => {
    if (!url || !sceneRef.current || !loadingIndicatorRef.current) return;
    
    // FIXED: Check for repeated loading of the same URL using the ref properly
    if (prevUrlRef.current === url) {
      console.log('🔍 DEBUG - Preventing reload of the same URL:', url);
      return;
    }
    
    // Update the stored URL
    prevUrlRef.current = url;
    
    // Show loading indicator
    console.log('🔍 DEBUG - Loading process starting with URL:', url);
    loadingIndicatorRef.current.visible = true;
    setIsLoading(true);
    setError(null);
    
    // Clean up previous VRM and its expressions
    if (vrmRef.current) {
      console.log('🔍 DEBUG - Cleaning up previous VRM model');
      // Clean up expressions
      if (vrmRef.current.expressionManager) {
        Object.values(vrmRef.current.expressionManager.expressions).forEach(expression => {
          if (expression) {
            expression.weight = 0;
            if (typeof expression.applyWeight === 'function') {
              expression.applyWeight();
            }
          }
        });
      }
      // Clean up morph targets
      vrmRef.current.scene.traverse((node) => {
        if (node.isMesh && node.morphTargetInfluences) {
          node.morphTargetInfluences.fill(0);
          if (typeof node.updateMorphTargets === 'function') {
            node.updateMorphTargets();
          }
        }
      });
      // Dispose VRM
      VRMUtils.deepDispose(vrmRef.current.scene);
      sceneRef.current.remove(vrmRef.current.scene);
      vrmRef.current = null;
    }
    
    // Remove skeleton helper if it exists
    if (skeletonHelperRef.current) {
      sceneRef.current.remove(skeletonHelperRef.current);
      skeletonHelperRef.current = null;
    }
    
    // Create GLTFLoader
    const loader = new GLTFLoader();
    
    // Register VRM plugin - specialized for VRM Inspector
    loader.register((parser) => {
      return new VRMLoaderPlugin(parser);
    });
    
    console.log('🔍 DEBUG - GLTFLoader created, about to load VRM');
    
    // Load the VRM
    loader.load(
      url,
      async (gltf) => {
        console.log('🔍 DEBUG - GLTF loaded successfully, processing data');
        try {
          // Get VRM instance from userData
          const vrm = gltf.userData.vrm;
          
          console.log('🔍 DEBUG - VRM data from GLTF:', vrm ? 'Found' : 'Not found');
          
          if (!vrm) {
            console.error('No VRM data found in the GLTF');
            setError(t('vrmviewer.errors.noVrmData'));
            hideLoadingIndicator();
            setIsLoading(false);
            return;
          }
          
          // Save reference to VRM and initialize expressions
          vrmRef.current = vrm;
          vrm.updateExpression = updateExpression;
          
          // Clear previous materials map
          originalMaterialsRef.current.clear();
          
          // Initialize expression manager if available
          if (vrm.expressionManager) {
            console.log('🔍 DEBUG - Initializing expression manager');
            if (typeof vrm.expressionManager.setup === 'function') {
              vrm.expressionManager.setup();
            }
            
            // Reset all expressions to 0
            Object.values(vrm.expressionManager.expressions).forEach(expression => {
              if (expression) {
                expression.weight = 0;
                if (typeof expression.applyWeight === 'function') {
                  expression.applyWeight();
                }
              }
            });
            
            // Force expression manager update
            if (typeof vrm.expressionManager.update === 'function') {
              vrm.expressionManager.update();
            }
          }

          // Extract and send metadata
          console.log('🔍 DEBUG - Extracting VRM metadata');
          const metadata = extractVRMMetadata(vrm, gltf);
          console.log('🔍 DEBUG - Extracted metadata:', metadata);
          
          if (metadata && onMetadataLoad) {
            console.log('🔍 DEBUG - Calling onMetadataLoad with metadata and VRM instance');
            onMetadataLoad({
              ...metadata,
              vrm,
              gltf
            });
          }
          
          // Setup the scene
          vrm.scene.traverse((object) => {
            if (object.isMesh) {
              object.castShadow = true;
              object.receiveShadow = true;
              
              // Store original materials for wireframe toggle (store references, not clones!)
              if (object.material) {
                if (Array.isArray(object.material)) {
                  // Store array of material references
                  originalMaterialsRef.current.set(object.uuid, [...object.material]);
                } else {
                  // Store single material reference
                  originalMaterialsRef.current.set(object.uuid, object.material);
                }
              }
              
              // Apply wireframe mode if it's currently enabled
              if (wireframeMode) {
                // Replace with white wireframe material
                const whiteMaterial = new THREE.MeshBasicMaterial({
                  color: 0xffffff,
                  wireframe: true,
                  transparent: false
                });
                
                if (Array.isArray(object.material)) {
                  object.material = object.material.map(() => whiteMaterial.clone());
                } else {
                  object.material = whiteMaterial;
                }
              }
            }
          });
          
          // Rotate the VRM model 180 degrees so it faces the camera
          vrm.scene.rotation.y = Math.PI;
          
          // Position model
          vrm.humanoid.resetNormalizedPose();
          
          const box = new THREE.Box3().setFromObject(vrm.scene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          vrm.scene.position.sub(center);
          vrm.scene.position.y = 0;
          
          // Store the original position to prevent animation drift
          avatarOriginalPositionRef.current.copy(vrm.scene.position);
          
          // Store the hips bone original position
          const hipsNode = vrm.humanoid?.getNormalizedBoneNode('hips');
          if (hipsNode) {
            hipsOriginalPositionRef.current = hipsNode.position.clone();
          }
          
          // Update avatar height state and height meter
          const height = size.y;
          const width = size.x;
          setAvatarHeight(height);
          if (typeof window.updateHeightMeter === 'function') {
            window.updateHeightMeter(height, width);
          }
          
          // Add VRM to scene
          sceneRef.current.add(vrm.scene);
          console.log('🔍 DEBUG - VRM added to scene');
          
          // Setup skeleton helper if needed
          if (skeletonMode) {
            createSkeletonVisualization(vrm);
          }
          
          // Auto-frame camera based on avatar size with smooth animation
          if (cameraRef.current && controlsRef.current) {
            const box = new THREE.Box3().setFromObject(vrm.scene);
            const size = box.getSize(new THREE.Vector3());
            
            const maxDimension = Math.max(size.x, size.y, size.z);
            const fov = cameraRef.current.fov * (Math.PI / 180);
            
            // Calculate optimal camera distance to fit the avatar
            // Use tight multiplier (0.85x) to bring avatars much closer
            const cameraDistance = Math.abs(maxDimension / Math.sin(fov / 2)) * 0.85;
            
            // Clamp distance to reasonable values - closer now
            const minDistance = 0.6;
            const maxDistance = 4;
            const finalDistance = Math.max(minDistance, Math.min(maxDistance, cameraDistance));
            
            // Update the controls' min/max distance dynamically based on avatar size
            controlsRef.current.minDistance = Math.max(0.3, finalDistance * 0.25);
            controlsRef.current.maxDistance = Math.max(6, finalDistance * 2.5);
            
            if (isFirstLoad) {
              // First load: Set position with initial angle (right and up)
              const targetY = size.y * 0.45;
              const cameraY = size.y * 0.5;
              
              // Set camera to the right and up, at calculated distance
              cameraRef.current.position.set(
                finalDistance * 0.32, // to the right
                cameraY,
                finalDistance
              );
              controlsRef.current.target.set(0, targetY, 0);
              controlsRef.current.update();
              setIsFirstLoad(false);
              
              console.log(`First load - camera positioned at distance: ${finalDistance.toFixed(2)}`);
            } else {
              // Subsequent loads: Only adjust distance, keep current angle
              // Get current camera direction (normalized)
              const currentPos = cameraRef.current.position.clone();
              const currentTarget = controlsRef.current.target.clone();
              const direction = currentPos.clone().sub(currentTarget).normalize();
              
              // Calculate current distance
              const currentDistance = currentPos.distanceTo(currentTarget);
              
              // Calculate new positions maintaining the same direction/angle
              const newTarget = new THREE.Vector3(0, size.y * 0.45, 0);
              const newCameraPos = newTarget.clone().add(direction.multiplyScalar(finalDistance));
              
              // Animate smoothly to new position
              const startCameraPos = currentPos;
              const startTargetPos = currentTarget;
              const duration = 600; // ms
              const startTime = Date.now();
              
              const animateCamera = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Smooth easing function
                const eased = progress < 0.5 
                  ? 2 * progress * progress 
                  : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                
                // Interpolate camera position
                cameraRef.current.position.lerpVectors(startCameraPos, newCameraPos, eased);
                
                // Interpolate target position
                controlsRef.current.target.lerpVectors(startTargetPos, newTarget, eased);
                controlsRef.current.update();
                
                if (progress < 1) {
                  requestAnimationFrame(animateCamera);
                }
              };
              
              animateCamera();
              
              console.log(`Reframing - maintaining angle, adjusting distance from ${currentDistance.toFixed(2)} to ${finalDistance.toFixed(2)}`);
            }
          }
          
          // Hide loading indicator after everything is done
          hideLoadingIndicator();
          setIsLoading(false);
          
          // Mark that we've loaded an avatar and activate ruler on first load
          if (isFirstLoad) {
            setShowRuler(true);
            if (heightMeterRef.current) {
              heightMeterRef.current.visible = true;
            }
          }
          setHasLoadedAvatar(true);
          
        } catch (error) {
          console.error('Error setting up VRM:', error);
          setError(t('vrmviewer.errors.setupFailed', { error: error.message }));
          hideLoadingIndicator();
          setIsLoading(false);
        }
      },
      (progress) => {
        const percent = Math.floor((progress.loaded / progress.total) * 100);
        console.log(`Loading VRM: ${percent}%`);
      },
      (error) => {
        console.error('Error loading VRM:', error);
        setError(t('vrmviewer.errors.loadFailed', { error: error.message }));
        
        // Make sure we hide the loading indicator on error
        if (loadingIndicatorRef.current) {
          loadingIndicatorRef.current.visible = false;
        }
        setIsLoading(false);
      }
    );
    
    // Safety net: force hide loading indicator after 30 seconds no matter what
    const safetyTimeout = setTimeout(() => {
      console.log('🔍 DEBUG - Safety timeout reached, forcing loading indicator off');
      if (loadingIndicatorRef.current) {
        loadingIndicatorRef.current.visible = false;
      }
      setIsLoading(false);
    }, 30000);
    
    return () => {
      clearTimeout(safetyTimeout);
    };
  }, [url, onMetadataLoad, skeletonMode, t]);

  useEffect(() => {
    try {
      if (!vrmRef.current || !sceneRef.current) return;
      
      // Handle skeleton helper visibility
      if (skeletonMode && !skeletonHelperRef.current) {
        console.log('🔍 DEBUG - Creating skeleton in useEffect');
        createSkeletonVisualization(vrmRef.current);
      } else if (!skeletonMode && skeletonHelperRef.current) {
        console.log('🔍 DEBUG - Removing skeleton in useEffect');
        sceneRef.current.remove(skeletonHelperRef.current);
        skeletonHelperRef.current = null;
        
        // Clean up bone markers
        if (boneMarkersRef.current.length > 0) {
          boneMarkersRef.current.forEach(obj => {
            if (obj.parent) obj.parent.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
          });
          boneMarkersRef.current = [];
        }
        
        // Clean up bone connections
        if (boneConnectionsRef.current.length > 0) {
          boneConnectionsRef.current.forEach(obj => {
            if (obj.parent) obj.parent.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
          });
          boneConnectionsRef.current = [];
        }
      }
    } catch (error) {
      console.error('Error in skeletonMode useEffect:', error);
    }
  }, [skeletonMode]);

  // Extract VRM metadata - specialized for Inspector
  const extractVRMMetadata = (vrm, gltf) => {
    try {
      console.log('🔍 DEBUG - Extracting metadata from VRM');
      
      // Get raw metadata from VRM instance
      const rawMetadata = vrm.meta;
      
      if (!rawMetadata) {
        console.error('No metadata found in VRM');
        return null;
      }

      // Detect VRM version
      let vrmVersion;
      if (gltf.parser?.json?.extensions?.VRM) {
        vrmVersion = 'VRM 0.x';
      } else if (gltf.parser?.json?.extensions?.VRMC_vrm) {
        vrmVersion = 'VRM 1.0';
      } else if (rawMetadata.metaVersion === 0) {
        vrmVersion = 'VRM 0.x';
      } else if (rawMetadata.specVersion) {
        vrmVersion = `VRM ${rawMetadata.specVersion}`;
      } else {
        vrmVersion = 'Unknown';
      }
      
      // Basic model stats
      let triangleCount = 0;
      let materialCount = 0;
      let avatarHeight = 0;
      const materials = new Set();
      
      // Calculate avatar height using bounding box
      const bbox = new THREE.Box3().setFromObject(vrm.scene);
      avatarHeight = bbox.max.y - bbox.min.y;
      console.log('🔍 DEBUG - Calculated avatar height:', avatarHeight.toFixed(2), 'units');
      
      vrm.scene.traverse((obj) => {
        if (obj.isMesh) {
          if (obj.geometry) {
            if (obj.geometry.index) {
              triangleCount += obj.geometry.index.count / 3;
            } else if (obj.geometry.attributes.position) {
              triangleCount += obj.geometry.attributes.position.count / 3;
            }
          }
          
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(mat => materials.add(mat));
            } else {
              materials.add(obj.material);
            }
          }
        }
      });
      
      materialCount = materials.size;
      
      // Create metadata object to return
      const metadata = {
        ...rawMetadata,
        triangleCount,
        materialCount,
        avatarHeight,
        vrmVersion, // Add the detected version
        vrm, // Pass the VRM instance
        gltf // Pass the GLTF instance
      };
      
      console.log('🔍 DEBUG - Extracted metadata:', metadata);
      return metadata;
    } catch (err) {
      console.error('Error extracting VRM metadata:', err);
      return null;
    }
  };

  // Toggle wireframe mode
  const toggleWireframeMode = () => {
    console.log('Toggle wireframe called, current mode:', wireframeMode);
    const newMode = !wireframeMode;
    setWireframeMode(newMode);
    console.log('New wireframe mode:', newMode);
    
    if (!vrmRef.current) return;
    
    // Apply wireframe mode to all meshes in the model
    vrmRef.current.scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        if (newMode) {
          // Switch to pure white wireframe material with emissive property for brightness
          const whiteMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: false,
            fog: false // Ignore fog to maintain brightness
          });
          
          if (Array.isArray(obj.material)) {
            obj.material = obj.material.map(() => whiteMaterial.clone());
          } else {
            obj.material = whiteMaterial;
          }
        } else {
          // Restore original materials (use exact references, not clones!)
          const originalMaterial = originalMaterialsRef.current.get(obj.uuid);
          if (originalMaterial) {
            // Restore the exact original material reference
            obj.material = originalMaterial;
          }
        }
      }
    });
  };

  // Toggle skeleton mode
  const toggleSkeletonMode = () => {
    try {
      const newMode = !skeletonMode;
      setSkeletonMode(newMode);
      
      if (newMode && vrmRef.current && !skeletonHelperRef.current) {
        console.log('🔍 DEBUG - Creating skeleton in toggleSkeletonMode');
        createSkeletonVisualization(vrmRef.current);
      } else if (!newMode && skeletonHelperRef.current && sceneRef.current) {
        console.log('🔍 DEBUG - Removing skeleton in toggleSkeletonMode');
        sceneRef.current.remove(skeletonHelperRef.current);
        skeletonHelperRef.current = null;
        
        // Clean up bone markers
        if (boneMarkersRef.current.length > 0) {
          boneMarkersRef.current.forEach(obj => {
            if (obj.parent) obj.parent.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
          });
          boneMarkersRef.current = [];
        }
        
        // Clean up bone connections
        if (boneConnectionsRef.current.length > 0) {
          boneConnectionsRef.current.forEach(obj => {
            if (obj.parent) obj.parent.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
          });
          boneConnectionsRef.current = [];
        }
      }
    } catch (error) {
      console.error('Error in toggleSkeletonMode:', error);
    }
  };

  // Create skeleton visualization - HACKY approach: attach shapes directly to bones!
  const createSkeletonVisualization = (vrm) => {
    // Clean up existing visualizations
    if (skeletonHelperRef.current && sceneRef.current) {
      sceneRef.current.remove(skeletonHelperRef.current);
      skeletonHelperRef.current = null;
    }
    
    if (boneConnectionsRef.current.length > 0) {
      boneConnectionsRef.current.forEach(obj => {
        if (obj.parent) obj.parent.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      boneConnectionsRef.current = [];
    }
    
    if (boneMarkersRef.current.length > 0) {
      boneMarkersRef.current.forEach(obj => {
        if (obj.parent) obj.parent.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      boneMarkersRef.current = [];
    }
    
    boneReferencesRef.current = [];
    
    if (!vrm || !sceneRef.current) return;
    
    console.log('Creating skeleton with PARENTED shapes (hacky approach)');
    
    try {
      // Use SkeletonHelper as base
      const helper = new THREE.SkeletonHelper(vrm.scene);
      helper.material.color = new THREE.Color(0x00d4ff); // Cyan
      helper.material.linewidth = 2;
      helper.material.transparent = true;
      helper.material.opacity = 0.6;
      helper.material.depthTest = false;
      helper.visible = skeletonMode;
      helper.renderOrder = 999;
      
      sceneRef.current.add(helper);
      skeletonHelperRef.current = helper;
      
      // Get all bones
      const bones = [];
      vrm.scene.traverse((obj) => {
        if (obj.isBone || obj.type === 'Bone') {
          bones.push(obj);
        }
      });
      
      console.log(`Found ${bones.length} bones`);
      
      // Materials
      const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 0.9,
        depthTest: false
      });
      
      const coneMaterial = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.4,
        depthTest: false,
        side: THREE.DoubleSide
      });
      
      // HACKY PART: Attach shapes directly as children of bones!
      bones.forEach((bone) => {
        // Add sphere at this bone (local position 0,0,0) - SMALLER SIZE
        const sphereGeom = new THREE.SphereGeometry(0.012, 8, 8); // Reduced from 0.02 to 0.012
        const sphere = new THREE.Mesh(sphereGeom, sphereMaterial);
        sphere.renderOrder = 1000;
        // Position at bone origin
        sphere.position.set(0, 0, 0);
        bone.add(sphere); // ATTACH TO BONE!
        boneMarkersRef.current.push(sphere);
        
        // If bone has children, create cones pointing to them
        bone.children.forEach((child) => {
          if (child.isBone || child.type === 'Bone') {
            // Create cone from this bone to child - THINNER
            const coneGeom = new THREE.ConeGeometry(0.015, 1, 4); // Reduced from 0.03 to 0.015
            const cone = new THREE.Mesh(coneGeom, coneMaterial);
            cone.renderOrder = 1000;
            
            // Position and orient in local space
            const childLocalPos = child.position.clone();
            const length = childLocalPos.length();
            
            if (length > 0.005) {
              // Position cone at HALF the distance (midpoint)
              const direction = childLocalPos.clone().normalize();
              cone.position.copy(direction.multiplyScalar(length * 0.5));
              
              // Scale to match bone length
              cone.scale.set(1, length, 1);
              
              // Orient toward child
              const up = new THREE.Vector3(0, 1, 0);
              cone.quaternion.setFromUnitVectors(up, childLocalPos.clone().normalize());
              
              bone.add(cone); // ATTACH TO BONE!
              boneConnectionsRef.current.push(cone);
            }
          }
        });
      });
      
      console.log(`Attached ${boneMarkersRef.current.length} spheres and ${boneConnectionsRef.current.length} cones to bones`);
    } catch (err) {
      console.error('Error creating skeleton visualization:', err);
    }
  };

  // Update the skeleton visualization in the animation loop if needed
  const updateSkeletonVisualization = () => {
    // The SkeletonHelper automatically updates with the model
    // Custom spring bone visualization would update here if implemented
  };

  // Update the bone visualizations in the animation loop
  const updateBoneVisualizations = () => {
    // NO UPDATE NEEDED! The shapes are children of bones, they follow automatically!
    // This is the HACK - let Three.js scene graph do the work
    return;
  };

  // Toggle ruler visibility mode
  const toggleRulerMode = () => {
    console.log('Toggle ruler called, current mode:', showRuler);
    const newShowRuler = !showRuler;
    setShowRuler(newShowRuler);
    console.log('New ruler mode:', newShowRuler);
    
    // Update ruler visibility
    if (heightMeterRef.current) {
      heightMeterRef.current.visible = newShowRuler;
    }
  };

  // Available animations list
  const availableAnimations = [
    { name: 'T-Pose (Default)', file: null }, // Default/reset option
    { name: 'Bored', file: '/animations/Bored.fbx' },
    { name: 'Cross Jumps', file: '/animations/CrossJumps.fbx' },
    { name: 'Fight Idle', file: '/animations/FightIdle.fbx' },
    { name: 'Jumping Rope', file: '/animations/JumpingRope.fbx' },
    { name: 'Looking', file: '/animations/Looking.fbx' },
    { name: 'Looking Around', file: '/animations/LookingAround.fbx' },
    { name: 'Magic Spell Casting', file: '/animations/MagicSpellCasting.fbx' },
    { name: 'Offensive Idle', file: '/animations/OffensiveIdle.fbx' },
    { name: 'Searching Files High', file: '/animations/SearchingFilesHigh.fbx' },
    { name: 'Standing Magic Attack', file: '/animations/StandingMagicAttack.fbx' },
    { name: 'Texting While Standing', file: '/animations/TextingWhileStanding.fbx' },
  ];

  // Load and play animation
  const loadAnimation = async (animationFile, animationName) => {
    if (!vrmRef.current) {
      console.warn('No VRM model loaded');
      return;
    }

    // If no file (T-Pose), just stop animation
    if (!animationFile) {
      stopAnimation();
      return;
    }

    setIsLoadingAnimation(true);

    try {
      // Use the proper loadMixamoAnimation function that retargets the animation
      const clip = await loadMixamoAnimation(animationFile, vrmRef.current);
      
      // Create or update the animation mixer
      if (!mixerRef.current) {
        mixerRef.current = new THREE.AnimationMixer(vrmRef.current.scene);
      } else {
        // Stop all current animations
        mixerRef.current.stopAllAction();
      }
      
      // Play the animation
      const action = mixerRef.current.clipAction(clip);
      action.reset();
      action.play();
      
      setCurrentAnimation(animationName);
      setIsLoadingAnimation(false);
    } catch (err) {
      console.error('Error loading animation:', err);
      setIsLoadingAnimation(false);
    }
  };

  // Stop animation and reset to T-pose
  const stopAnimation = () => {
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      setCurrentAnimation(null);
    }
    
    if (vrmRef.current) {
      vrmRef.current.humanoid.resetNormalizedPose();
    }
  };

  // Add a function to update expressions
  const updateExpression = (expressionName, weight) => {
    if (!vrmRef.current || !vrmRef.current.expressionManager) {
      console.warn('No VRM or expression manager available');
      return;
    }

    const expressionManager = vrmRef.current.expressionManager;
    
    // Find the target expression
    let targetExpression = null;
    Object.entries(expressionManager.expressions).forEach(([key, expression]) => {
      if (expression && expression.name === `VRMExpression_${expressionName}`) {
        targetExpression = expression;
      }
    });

    if (targetExpression) {
      // Ensure weight is between 0 and 1
      const clampedWeight = Math.max(0, Math.min(1, weight));
      
      // Set the weight
      targetExpression.weight = clampedWeight;
      
      // Apply the weight if the function exists
      if (typeof targetExpression.applyWeight === 'function') {
        targetExpression.applyWeight();
      }

      // Force update the expression manager
      if (typeof expressionManager.update === 'function') {
        expressionManager.update();
      }

      // Update all meshes with morph targets
      vrmRef.current.scene.traverse((node) => {
        if (node.isMesh && node.morphTargetInfluences && node.morphTargetDictionary) {
          let needsUpdate = false;
          const cleanExpressionName = expressionName.toLowerCase();
          
          // Get all morph targets that could match this expression
          const matchingMorphs = Object.entries(node.morphTargetDictionary).filter(([morphName]) => {
            const lowerMorphName = morphName.toLowerCase();
            // Check for exact matches first
            if (lowerMorphName === `blendshape1.funazushi_277_${cleanExpressionName}` ||
                lowerMorphName === `blendshape1.funazushi_276_${cleanExpressionName}`) {
              return true;
            }
            // Then check for partial matches
            return lowerMorphName.includes(cleanExpressionName);
          });

          // If we found matching morph targets, update them
          if (matchingMorphs.length > 0) {
            matchingMorphs.forEach(([morphName, morphIndex]) => {
              // Scale the weight based on the morph target's name pattern
              let scaledWeight = clampedWeight;
              
              // Some VRMs use binary expressions (0 or 1)
              const isBinaryExpression = morphName.toLowerCase().includes('binary_') || 
                                      targetExpression.isBinary;
              
              if (isBinaryExpression) {
                // For binary expressions, use a threshold
                scaledWeight = clampedWeight >= 0.5 ? 1 : 0;
              } else {
                // For continuous expressions, apply easing
                // This helps with more natural expression transitions
                scaledWeight = Math.pow(clampedWeight, 1.5); // Slight easing curve
              }

              // Only update if the weight has actually changed
              if (node.morphTargetInfluences[morphIndex] !== scaledWeight) {
                node.morphTargetInfluences[morphIndex] = scaledWeight;
                needsUpdate = true;
              }
            });
          }

          if (needsUpdate) {
            // Force geometry updates
            if (node.geometry) {
              node.geometry.attributes.position.needsUpdate = true;
              if (node.geometry.attributes.normal) {
                node.geometry.attributes.normal.needsUpdate = true;
              }
              node.geometry.computeBoundingSphere();
              node.geometry.computeBoundingBox();
            }

            // Force material update
            if (node.material) {
              node.material.needsUpdate = true;
            }

            // Force morph target update
            if (typeof node.updateMorphTargets === 'function') {
              node.updateMorphTargets();
            }
          }
        }
      });

      // Final expression manager update
      if (typeof expressionManager.update === 'function') {
        expressionManager.update();
      }
    } else {
      console.warn(`Expression ${expressionName} not found`);
    }
  };

  // Expose the updateExpression function
  useEffect(() => {
    if (vrmRef.current) {
      vrmRef.current.updateExpression = updateExpression;
    }
  }, [vrmRef.current]);

  // Update loading indicator visibility when URL changes
  useEffect(() => {
    if (loadingIndicatorRef.current) {
      loadingIndicatorRef.current.visible = !!url;
    }
  }, [url]);

  // Hide loading indicator when VRM is loaded
  const hideLoadingIndicator = () => {
    if (loadingIndicatorRef.current) {
      loadingIndicatorRef.current.visible = false;
    }
  };

  // Add event listeners for WebGL context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleContextLost = (event) => {
      event.preventDefault();
      contextLostRef.current = true;
    };

    const handleContextRestored = () => {
      contextLostRef.current = false;
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.setAnimationLoop(() => {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        });
      }
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, []);

  // Preserve renderer during re-renders
  useEffect(() => {
    if (rendererRef.current && !contextLostRef.current) {
      const preserveDrawingBuffer = true;
      rendererRef.current.preserveDrawingBuffer = preserveDrawingBuffer;
    }
  });

  return (
    <div className="relative w-full h-full">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ touchAction: "none" }}
      />
      
      {/* Control buttons group - hide on mobile, lower z-index when no avatar loaded */}
      {window.innerWidth >= 768 && (
        <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 ${hasLoadedAvatar ? 'z-10' : 'z-0'}`}>
          <div className={`bg-cream/90 dark:bg-gray-900/90 rounded-md p-2 flex items-center space-x-2 border border-gray-200 dark:border-gray-700 shadow-md transition-opacity ${hasLoadedAvatar ? 'opacity-100' : 'opacity-30 pointer-events-none'}`} style={{ backdropFilter: 'blur(4px)' }}>
            
            {/* Wireframe toggle button */}
            <div className="relative group">
              <button
                onClick={toggleWireframeMode}
                disabled={!hasLoadedAvatar}
                className={`px-4 py-2 rounded transition-all flex items-center gap-2 ${
                  wireframeMode 
                    ? 'bg-gray-300/70 dark:bg-gray-700/70 text-gray-900 dark:text-gray-100 font-medium' 
                    : 'bg-transparent text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {/* Grid icon - 4 squares in a 2x2 grid */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="5.5" height="5.5" rx="1" />
                  <rect x="10.5" y="2" width="5.5" height="5.5" rx="1" />
                  <rect x="2" y="10.5" width="5.5" height="5.5" rx="1" />
                  <rect x="10.5" y="10.5" width="5.5" height="5.5" rx="1" />
                </svg>
              </button>
              {/* Tooltip */}
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs py-1 px-3 rounded whitespace-nowrap shadow-lg">
                  {t('avatar.controls.wireframe')}
                </div>
              </div>
            </div>
            
            {/* Skeleton toggle button */}
            <div className="relative group">
              <button
                onClick={toggleSkeletonMode}
                disabled={!hasLoadedAvatar}
                className={`px-4 py-2 rounded transition-all flex items-center gap-2 ${
                  skeletonMode 
                    ? 'bg-gray-300/70 dark:bg-gray-700/70 text-gray-900 dark:text-gray-100 font-medium' 
                    : 'bg-transparent text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {/* Bone icon - dog bone shape */}
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M16.5 7.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S15 5.17 15 6c0 .11.01.22.04.32l-9.92 5.36c-.29-.42-.77-.68-1.12-.68-.83 0-1.5.67-1.5 1.5S3.17 14 4 14c.35 0 .83-.26 1.12-.68l9.92 5.36c-.03.1-.04.21-.04.32 0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5c-.35 0-.83.26-1.12.68L5.46 12.82c.03-.1.04-.21.04-.32s-.01-.22-.04-.32l9.92-5.36c.29.42.77.68 1.12.68z" transform="translate(-1 -2) scale(0.85)" />
                </svg>
              </button>
              {/* Tooltip */}
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs py-1 px-3 rounded whitespace-nowrap shadow-lg">
                  {t('avatar.controls.showBones')}
                </div>
              </div>
            </div>
            
            {/* Ruler toggle button */}
            <div className="relative group">
              <button
                onClick={toggleRulerMode}
                disabled={!hasLoadedAvatar}
                className={`px-4 py-2 rounded transition-all flex items-center gap-2 ${
                  showRuler 
                    ? 'bg-gray-300/70 dark:bg-gray-700/70 text-gray-900 dark:text-gray-100 font-medium' 
                    : 'bg-transparent text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {/* Ruler icon - matches other icon sizes */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="4" y="2" width="2.5" height="14" rx="0.5" />
                  <line x1="6.5" y1="3" x2="8.5" y2="3" strokeWidth="1.5" />
                  <line x1="6.5" y1="5.5" x2="8" y2="5.5" strokeWidth="1.5" />
                  <line x1="6.5" y1="8" x2="8.5" y2="8" strokeWidth="1.5" />
                  <line x1="6.5" y1="10.5" x2="8" y2="10.5" strokeWidth="1.5" />
                  <line x1="6.5" y1="13" x2="8.5" y2="13" strokeWidth="1.5" />
                </svg>
              </button>
              {/* Tooltip */}
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs py-1 px-3 rounded whitespace-nowrap shadow-lg">
                  {t('avatar.controls.ruler')}
                </div>
              </div>
            </div>
            
            {/* Animation panel toggle button */}
            <div className="relative group">
              <button
                onClick={() => setShowAnimationPanel(!showAnimationPanel)}
                disabled={!hasLoadedAvatar}
                className={`px-4 py-2 rounded transition-all flex items-center gap-2 ${
                  showAnimationPanel 
                    ? 'bg-gray-300/70 dark:bg-gray-700/70 text-gray-900 dark:text-gray-100 font-medium' 
                    : 'bg-transparent text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {/* Animation/Play icon */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 3L15 9L4 15V3Z" fill="currentColor" stroke="none" />
                </svg>
              </button>
              {/* Tooltip */}
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs py-1 px-3 rounded whitespace-nowrap shadow-lg">
                  Animations
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-red-500 bg-opacity-90 text-white px-4 py-2 rounded max-w-md text-center">
            {error}
          </div>
        </div>
      )}
      
      {/* Animation Panel - positioned on the right, similar to avatar info panel */}
      {showAnimationPanel && hasLoadedAvatar && window.innerWidth >= 768 && (
        <div 
          className="absolute top-4 right-4 z-10 bg-cream/95 dark:bg-gray-900/95 backdrop-blur-sm p-4 overflow-y-auto rounded-lg"
          style={{ width: '224px', maxHeight: 'calc(100vh - 120px)' }}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-300 dark:border-gray-700">Animations</h3>
          
          {/* Animation List */}
          <div className="space-y-1.5">
            {availableAnimations.map((animation) => (
              <button
                key={animation.name}
                onClick={() => loadAnimation(animation.file, animation.name)}
                disabled={isLoadingAnimation}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                  currentAnimation === animation.name
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium border-l-2 border-gray-900 dark:border-gray-100'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                } ${isLoadingAnimation ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="truncate">{animation.name}</span>
              </button>
            ))}
          </div>
          
          {/* Loading Indicator */}
          {isLoadingAnimation && (
            <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-700 text-center text-xs text-gray-600 dark:text-gray-400">
              Loading animation...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to create square/pixel texture for particles
function createSquareTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  // Create a solid square with slightly soft edges
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.fillRect(4, 4, 24, 24); // Main solid square
  
  // Add very subtle edge softening
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillRect(3, 3, 26, 1); // Top edge
  ctx.fillRect(3, 28, 26, 1); // Bottom edge
  ctx.fillRect(3, 3, 1, 26); // Left edge
  ctx.fillRect(28, 3, 1, 26); // Right edge
  
  // Corner pixels
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(3, 3, 1, 1); // Top-left
  ctx.fillRect(28, 3, 1, 1); // Top-right
  ctx.fillRect(3, 28, 1, 1); // Bottom-left
  ctx.fillRect(28, 28, 1, 1); // Bottom-right
  
  return new THREE.CanvasTexture(canvas);
}

export default VRMInspectorViewer; 