'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

// Compact texture preview component - optimized for uniform thumbnail display
const TextureRenderer = ({ texture, size = 200 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!texture || !canvasRef.current) return;

    // Get the actual texture dimensions
    const img = texture.image;
    if (!img) {
      console.warn('Texture has no image data');
      return;
    }

    const textureWidth = img.width || size;
    const textureHeight = img.height || size;
    const aspectRatio = textureWidth / textureHeight;

    // Calculate thumbnail dimensions maintaining aspect ratio
    // Always fit within the size constraint
    let thumbWidth, thumbHeight;
    
    if (aspectRatio >= 1) {
      // Landscape or square - width is limiting factor
      thumbWidth = size;
      thumbHeight = size / aspectRatio;
    } else {
      // Portrait - height is limiting factor
      thumbHeight = size;
      thumbWidth = size * aspectRatio;
    }

    // Round to avoid sub-pixel rendering
    thumbWidth = Math.round(thumbWidth);
    thumbHeight = Math.round(thumbHeight);

    // Use 2D canvas context for direct image rendering (more efficient than WebGL)
    const canvas = canvasRef.current;
    canvas.width = thumbWidth;
    canvas.height = thumbHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, thumbWidth, thumbHeight);

    // Draw the texture image directly to canvas
    try {
      // Handle different image types
      if (img instanceof HTMLImageElement || 
          img instanceof HTMLCanvasElement || 
          img instanceof ImageBitmap ||
          img instanceof OffscreenCanvas) {
        ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
      } else {
        // Fallback to WebGL rendering for complex texture types
        renderWithWebGL(texture, canvas, thumbWidth, thumbHeight);
      }
    } catch (error) {
      console.error('Error rendering texture:', error);
      // Fallback to WebGL rendering
      renderWithWebGL(texture, canvas, thumbWidth, thumbHeight);
    }
  }, [texture, size]);
  
  // Fallback WebGL rendering function for complex texture types
  const renderWithWebGL = (texture, canvas, width, height) => {
    try {
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: false,
        preserveDrawingBuffer: true
      });
      renderer.setSize(width, height);
      
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true
      });
      const geometry = new THREE.PlaneGeometry(2, 2);
      const plane = new THREE.Mesh(geometry, material);
      
      scene.add(plane);
      renderer.render(scene, camera);
      
      // Clean up
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    } catch (error) {
      console.error('WebGL fallback rendering failed:', error);
    }
  };
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        imageRendering: 'auto'
      }}
      className="mx-auto"
    />
  );
};

export default TextureRenderer; 