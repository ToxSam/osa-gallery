'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { Avatar } from '@/types/avatar';
import { loadMixamoAnimation } from './utils/animationLoader';
import { Progress } from '@/components/ui/progress';

interface HomeVRMViewerProps {
  className?: string;
  avatar?: Avatar | null;
}

export const HomeVRMViewer: React.FC<HomeVRMViewerProps> = ({ className, avatar: propAvatar }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showLoadingBar, setShowLoadingBar] = useState(false);
  const loadingBarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const avatar = propAvatar || null;
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const vrmRef = useRef<any>(null);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const frameIdRef = useRef<number | null>(null);
  const isActiveRef = useRef(true);
  const animationLoadedRef = useRef(false);
  const rotationAnimationTimeRef = useRef(0);

  const setupCamera = (box: THREE.Box3, aspect: number) => {
    const size = new THREE.Vector3();
    box.getSize(size);
    
    // Calculate the radius of a sphere that would contain the model
    const radius = Math.max(size.x, size.y, size.z) * 0.5;
    
    // Calculate camera distance based on model size
    const fov = 30;
    const distance = (radius * 1.5) / Math.tan((fov * 0.5) * Math.PI / 180);
    
    // Create and position camera
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, Math.max(1000, distance * 2));
    
    // Position camera to frame the model
    camera.position.set(0, size.y * 0.5, distance);
    camera.lookAt(0, size.y * 0.5, 0);
    
    return camera;
  };

  useEffect(() => {
    if (!containerRef.current || !avatar?.modelFileUrl) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrameId: number | null = null;
    
    const init = async () => {
      try {
        setLoadingProgress(0);
        setShowLoadingBar(false);
        
        // Clear any existing timeout
        if (loadingBarTimeoutRef.current) {
          clearTimeout(loadingBarTimeoutRef.current);
        }
        
        // Show loading bar only after 2 seconds delay
        loadingBarTimeoutRef.current = setTimeout(() => {
          setShowLoadingBar(true);
        }, 2000);
        
        // Create renderer first to establish WebGL context
        try {
          renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: true
          });
        } catch (error) {
          console.error('Failed to create WebGL renderer:', error);
          throw new Error('WebGL initialization failed');
        }
        
        // Test if context is valid
        const context = renderer.getContext();
        if (!context) {
          renderer.dispose();
          renderer = null;
          throw new Error('Failed to get WebGL context');
        }

        // Check if container is still mounted
        if (!containerRef.current) {
          renderer.dispose();
          renderer = null;
          throw new Error('Container was unmounted');
        }

        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        containerRef.current.appendChild(renderer.domElement);

        isActiveRef.current = true;
        animationLoadedRef.current = false;
        
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = null;

        // Initial camera setup
        const camera = new THREE.PerspectiveCamera(
          30,
          containerRef.current!.clientWidth / containerRef.current!.clientHeight,
          0.1,
          1000
        );
        cameraRef.current = camera;

        // Enhanced Lighting Setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(0, 1, 2);
        scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(-2, 1, 0);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
        rimLight.position.set(0, 1, -2);
        scene.add(rimLight);

        // Load VRM
        const loader = new GLTFLoader();
        loader.register((parser: any) => new VRMLoaderPlugin(parser));

        // Raycaster setup
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // Load model first
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.load(
            avatar.modelFileUrl as string,
            resolve,
            (progress) => {
              if (progress.total) {
                const percentage = Math.round((progress.loaded / progress.total) * 100);
                setLoadingProgress(percentage);
                console.log(`Loading progress: ${percentage}%`);
              }
            },
            reject
          );
        });

        const vrm = gltf.userData.vrm;
        if (!vrm) {
          throw new Error('No VRM data found');
        }

        // Use combineSkeletons instead of removeUnnecessaryJoints
        if (typeof VRMUtils.combineSkeletons === 'function') {
          VRMUtils.combineSkeletons(gltf.scene);
        } else {
          VRMUtils.removeUnnecessaryJoints(gltf.scene);
        }

        scene.add(gltf.scene);
        vrmRef.current = vrm;

        // Center model and adjust camera
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const newCamera = setupCamera(box, containerRef.current!.clientWidth / containerRef.current!.clientHeight);
        cameraRef.current = newCamera;

        // Center the model
        gltf.scene.position.x = -center.x;
        gltf.scene.position.y = -center.y + size.y * 0.5;
        gltf.scene.position.z = -center.z;
        gltf.scene.rotation.y = Math.PI;

        // Setup controls
        if (!renderer) throw new Error('Renderer was disposed');
        const controls = new OrbitControls(newCamera, renderer.domElement);
        controlsRef.current = controls;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false;
        controls.enableRotate = false; // Disable camera rotation, we'll handle avatar rotation manually
        
        const minDistance = size.y * 1.2;
        const maxDistance = size.y * 2.5;
        controls.minDistance = minDistance;
        controls.maxDistance = maxDistance;
        controls.minPolarAngle = Math.PI / 3;
        controls.maxPolarAngle = Math.PI / 1.8;
        controls.target.set(0, size.y * 0.5, 0);
        controls.update();

        // Check if mobile device - disable interactions on mobile
        const isMobile = window.innerWidth < 1024; // lg breakpoint

        // Mouse handlers - moved after controls setup
        // Only enable on desktop (non-mobile)
        const handleMouseDown = (event: MouseEvent) => {
          if (isMobile) return; // Disable on mobile
          if (!vrmRef.current || !controlsRef.current || !renderer?.domElement) return;

          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, cameraRef.current!);
          const intersects = raycaster.intersectObject(vrmRef.current.scene, true);

          if (intersects.length > 0) {
            // Click hit the avatar - enable avatar rotation
            isDraggingRef.current = true;
            previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
            if (controlsRef.current) {
              controlsRef.current.enabled = false; // Disable orbit controls while rotating avatar
            }
          }
        };

        const handleMouseMove = (event: MouseEvent) => {
          if (isMobile) return; // Disable on mobile
          if (isDraggingRef.current && vrmRef.current) {
            const deltaX = event.clientX - previousMousePositionRef.current.x;
            vrmRef.current.scene.rotation.y += deltaX * 0.01; // Rotate avatar
            previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
          }
        };

        const handleMouseUp = () => {
          if (isMobile) return; // Disable on mobile
          if (isDraggingRef.current && controlsRef.current) {
            isDraggingRef.current = false;
            controlsRef.current.enabled = true; // Re-enable orbit controls for zooming
            
            // Reset animation time to match current rotation for smooth continuation
            if (vrmRef.current?.scene) {
              const currentRotation = vrmRef.current.scene.rotation.y;
              const baseRotation = Math.PI;
              const rotationOffset = currentRotation - baseRotation;
              // Calculate animation time that would produce this rotation offset
              // rotationOffset = sin(time * speed) * (PI/4)
              // time = arcsin(rotationOffset / (PI/4)) / speed
              const rotationSpeed = 0.5;
              if (Math.abs(rotationOffset) <= Math.PI / 4) {
                rotationAnimationTimeRef.current = Math.asin(rotationOffset / (Math.PI / 4)) / rotationSpeed;
              }
            }
          }
        };

        // Add event listeners after everything is set up - only on desktop
        if (renderer?.domElement && !isMobile) {
          renderer.domElement.addEventListener('mousedown', handleMouseDown);
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
        }

        // Load animation
        console.log('Loading animation...');
        const clip = await loadMixamoAnimation(
          'https://assets.opensourceavatars.com/animations/Warrior%20Idle.fbx',
          vrm
        );

        if (clip && isActiveRef.current) {
          mixerRef.current = new THREE.AnimationMixer(vrm.scene);
          const action = mixerRef.current.clipAction(clip);
          action.play();
          animationLoadedRef.current = true;
          console.log('Animation started');
        }

        setLoadingProgress(100);
        if (loadingBarTimeoutRef.current) {
          clearTimeout(loadingBarTimeoutRef.current);
        }
        setShowLoadingBar(false);
        setLoading(false);

        // Animation loop
        const animate = () => {
          if (!isActiveRef.current || !renderer) return;

          animationFrameId = requestAnimationFrame(animate);
          const delta = clockRef.current.getDelta();

          if (mixerRef.current) {
            mixerRef.current.update(delta);
          }

          if (vrm) {
            vrm.update(delta);
          }

          // Add rotation animation: 45° left → -45° right → 45° left (back and forth)
          // Always animate (works on both mobile and desktop)
          // Only skip animation when user is actively dragging (desktop only)
          if (vrmRef.current?.scene) {
            if (!isDraggingRef.current) {
              rotationAnimationTimeRef.current += delta;
              // Use a sine wave to create smooth back-and-forth motion
              const rotationSpeed = 0.5; // Adjust this to change animation speed
              const rotationAmount = Math.sin(rotationAnimationTimeRef.current * rotationSpeed) * (Math.PI / 4); // ±45 degrees
              // Base rotation is Math.PI (180°), add the animated rotation
              vrmRef.current.scene.rotation.y = Math.PI + rotationAmount;
            }
          }

          controls.update();
          renderer.render(scene, newCamera);
        };

        // Start animation loop
        animate();

        // Handle resize
        const handleResize = () => {
          if (!containerRef.current || !cameraRef.current || !renderer) return;
          
          const camera = cameraRef.current;
          camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };
        
        window.addEventListener('resize', handleResize);

        return () => {
          if (renderer?.domElement) {
            renderer.domElement.removeEventListener('mousedown', handleMouseDown);
          }
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
          window.removeEventListener('resize', handleResize);
        };

      } catch (error) {
        // Ensure proper cleanup if initialization fails
        if (renderer) {
          renderer.dispose();
          if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.remove();
          }
          renderer = null;
        }
        console.error('Setup error:', error);
        setLoadingProgress(0);
        if (loadingBarTimeoutRef.current) {
          clearTimeout(loadingBarTimeoutRef.current);
        }
        setShowLoadingBar(false);
        setLoading(false);
      }
    };

    init();

    // Cleanup function
    return () => {
      isActiveRef.current = false;
      if (loadingBarTimeoutRef.current) {
        clearTimeout(loadingBarTimeoutRef.current);
      }
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        if (vrmRef.current?.scene) {
          mixerRef.current.uncacheRoot(vrmRef.current.scene);
        }
        mixerRef.current = null;
      }

      if (vrmRef.current) {
        VRMUtils.deepDispose(vrmRef.current.scene);
        vrmRef.current = null;
      }

      if (sceneRef.current) {
        sceneRef.current.clear();
        sceneRef.current = null;
      }

      if (renderer) {
        try {
          renderer.dispose();
          renderer.forceContextLoss();
          if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.remove();
          }
        } catch (error) {
          console.error('Error during renderer cleanup:', error);
        }
        renderer = null;
      }

      animationLoadedRef.current = false;
    };
  }, [avatar?.modelFileUrl]);

  return (
    <div 
      ref={containerRef} 
      className={`relative ${className}`}
      style={{ 
        minHeight: '500px', 
        width: '100%', 
        height: '100%',
        position: 'relative'
      }}
    >
      {loading && showLoadingBar && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <div className="w-full max-w-xs px-8 space-y-2">
            <Progress value={loadingProgress} className="h-1.5" />
            <p className="text-center text-xs text-gray-600 dark:text-gray-400 font-medium">
              {loadingProgress}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 