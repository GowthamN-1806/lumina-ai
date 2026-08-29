import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeDOrb() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      (container.clientWidth || 400) / (container.clientHeight || 400),
      0.1,
      100
    );
    camera.position.z = 5.5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth || 400, container.clientHeight || 400);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Group to hold everything for rotation
    const group = new THREE.Group();
    scene.add(group);

    // Create Holographic Outer Glass Sphere
    const glassGeometry = new THREE.SphereGeometry(1.6, 64, 64);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x7c5cff, // Purple
      emissive: 0x3b1c8c,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.6, // Glass transparency
      ior: 1.5, // Index of refraction
      thickness: 1.0, // Glass thickness
      transparent: true,
      opacity: 0.85,
      wireframe: false,
      depthWrite: false,
    });
    const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
    group.add(glassMesh);

    // Create Inner Holographic Energy Core (Wireframe sphere with noise-like shape)
    const coreGeometry = new THREE.IcosahedronGeometry(1.2, 4);
    
    // Let's store original positions of core vertices to animate them like a pulsing energy core
    const corePositions = coreGeometry.attributes.position;
    const originalPositions = corePositions.array.slice();

    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x4fd1ff, // Cyan
      wireframe: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(coreMesh);

    // Orbiting Particles System
    const particleCount = prefersReducedMotion ? 60 : 180;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const particleData: { angle: number; radius: number; speed: number; yOffset: number }[] = [];

    const color1 = new THREE.Color(0x7c5cff); // Purple
    const color2 = new THREE.Color(0x4fd1ff); // Cyan
    const color3 = new THREE.Color(0x00e38c); // Accent Green

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.0 + Math.random() * 0.8;
      const angle = Math.random() * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * 1.5;
      const speed = (0.005 + Math.random() * 0.01) * (Math.random() > 0.5 ? 1 : -1);

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      positions[i * 3] = x;
      positions[i * 3 + 1] = yOffset;
      positions[i * 3 + 2] = z;

      // Color interpolation
      const rand = Math.random();
      const mixedColor = rand < 0.4 ? color1 : rand < 0.8 ? color2 : color3;
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;

      particleData.push({ angle, radius, speed, yOffset });
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Custom particle texture (soft glowing point)
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(0.5, "rgba(255, 255, 255, 0.5)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    
    const pTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.12,
      map: pTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x4fd1ff, 2.5); // Cyan light from top-left
    dirLight1.position.set(-5, 5, 3);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x7c5cff, 2.5); // Purple light from bottom-right
    dirLight2.position.set(5, -5, 3);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x00e38c, 2, 10); // Glowing green inner light
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Animation Loop
    let clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Slow continuous rotations
        group.rotation.y = elapsedTime * 0.15;
        group.rotation.x = elapsedTime * 0.08;

        // Animate particles orbiting
        const particlePositions = particleGeometry.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          const data = particleData[i];
          data.angle += data.speed;

          particlePositions[i * 3] = Math.cos(data.angle) * data.radius;
          particlePositions[i * 3 + 2] = Math.sin(data.angle) * data.radius;
          // Add a subtle wave to yOffset
          particlePositions[i * 3 + 1] = data.yOffset + Math.sin(elapsedTime + data.angle) * 0.1;
        }
        particleGeometry.attributes.position.needsUpdate = true;

        // Animate energy core vertices (pulsing noise)
        const coreArray = corePositions.array as Float32Array;
        for (let i = 0; i < coreArray.length; i += 3) {
          const vx = originalPositions[i];
          const vy = originalPositions[i + 1];
          const vz = originalPositions[i + 2];

          // Compute length/direction
          const len = Math.sqrt(vx * vx + vy * vy + vz * vz);
          const nx = vx / len;
          const ny = vy / len;
          const nz = vz / len;

          // Pulse scale factor using sine waves and vertex positions
          const pulse = Math.sin(elapsedTime * 3 + vx * 2 + vy * 2) * 0.1;
          coreArray[i] = vx + nx * pulse;
          coreArray[i + 1] = vy + ny * pulse;
          coreArray[i + 2] = vz + nz * pulse;
        }
        corePositions.needsUpdate = true;

        // Core rotation (slightly counter to the main group)
        coreMesh.rotation.y = -elapsedTime * 0.3;
        coreMesh.rotation.z = elapsedTime * 0.1;

        // Mouse Parallax effect
        const mouse = mouseRef.current;
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;
        group.position.x = mouse.x * 0.5;
        group.position.y = -mouse.y * 0.5;
      } else {
        // Simple static rotation for reduced motion
        group.rotation.y = elapsedTime * 0.05;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Mouse movement handler
    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
    };

    container.addEventListener("mousemove", handleMouseMove);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      glassGeometry.dispose();
      glassMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Decorative ambient background glow */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 lg:w-[450px] lg:h-[450px] xl:w-[550px] xl:h-[550px] 2xl:w-[620px] 2xl:h-[620px] bg-gradient-to-tr from-purple-600/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div 
        ref={containerRef} 
        className="w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] md:w-[420px] md:h-[420px] lg:w-[480px] lg:h-[480px] xl:w-[560px] xl:h-[560px] 2xl:w-[640px] 2xl:h-[640px] z-10 cursor-grab active:cursor-grabbing transition-all duration-300" 
      />
    </div>
  );
}
