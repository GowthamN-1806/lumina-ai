import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeDGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // 1. Core Sphere (Transparent cyan outline)
    const globeGeom = new THREE.SphereGeometry(1.5, 32, 32);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x4fd1ff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const globeMesh = new THREE.Mesh(globeGeom, globeMat);
    group.add(globeMesh);

    // 2. Latitude/Longitude Grid lines (subtle)
    const latitudeCount = 8;
    for (let i = 0; i <= latitudeCount; i++) {
      const phi = (i / latitudeCount) * Math.PI;
      const ringRadius = Math.sin(phi) * 1.5;
      const y = Math.cos(phi) * 1.5;

      const ringGeom = new THREE.BufferGeometry();
      const points = [];
      const segments = 64;
      for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * Math.PI * 2;
        points.push(Math.cos(theta) * ringRadius, y, Math.sin(theta) * ringRadius);
      }
      ringGeom.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      const ringMat = new THREE.LineBasicMaterial({
        color: 0x7c5cff,
        transparent: true,
        opacity: 0.2,
      });
      const ring = new THREE.Line(ringGeom, ringMat);
      group.add(ring);
    }

    // 3. Floating Resource Nodes
    const nodeCount = prefersReducedMotion ? 15 : 45;
    const nodeGeom = new THREE.BufferGeometry();
    const nodePos = new Float32Array(nodeCount * 3);
    const nodeAngles: { phi: number; theta: number; speed: number; pulseSpeed: number }[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      const r = 1.51; // slightly larger than sphere radius

      nodePos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      nodePos[i * 3 + 1] = r * Math.cos(phi);
      nodePos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      nodeAngles.push({
        phi,
        theta,
        speed: (Math.random() - 0.5) * 0.002,
        pulseSpeed: 1 + Math.random() * 2,
      });
    }

    nodeGeom.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));

    // Particle texture (dot glow)
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, "rgba(79, 209, 255, 1)");
    grad.addColorStop(0.5, "rgba(124, 92, 255, 0.6)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    const nodeTexture = new THREE.CanvasTexture(canvas);

    const nodeMat = new THREE.PointsMaterial({
      size: 0.16,
      map: nodeTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const nodePoints = new THREE.Points(nodeGeom, nodeMat);
    group.add(nodePoints);

    // 4. Connecting Lines between close nodes (Arc-like links)
    const linkCount = prefersReducedMotion ? 5 : 12;
    const linksGroup = new THREE.Group();
    group.add(linksGroup);

    const buildLinks = () => {
      // Clear old links
      while (linksGroup.children.length > 0) {
        const obj = linksGroup.children[0];
        linksGroup.remove(obj);
      }

      // Draw active connections
      for (let k = 0; k < linkCount; k++) {
        const i = Math.floor(Math.random() * nodeCount);
        let j = Math.floor(Math.random() * nodeCount);
        if (i === j) j = (j + 1) % nodeCount;

        const p1 = new THREE.Vector3(
          nodePos[i * 3],
          nodePos[i * 3 + 1],
          nodePos[i * 3 + 2]
        );
        const p2 = new THREE.Vector3(
          nodePos[j * 3],
          nodePos[j * 3 + 1],
          nodePos[j * 3 + 2]
        );

        // Make an arc by interpolating points
        const points = [];
        const segments = 16;
        for (let s = 0; s <= segments; s++) {
          const t = s / segments;
          const p = new THREE.Vector3().lerpVectors(p1, p2, t);
          // Normalize to push it outward into a curve above the sphere
          p.normalize().multiplyScalar(1.5 + Math.sin(t * Math.PI) * 0.15);
          points.push(p);
        }

        const curveGeom = new THREE.BufferGeometry().setFromPoints(points);
        const curveMat = new THREE.LineBasicMaterial({
          color: 0x00e38c,
          transparent: true,
          opacity: 0.35,
        });
        const curve = new THREE.Line(curveGeom, curveMat);
        linksGroup.add(curve);
      }
    };

    buildLinks();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x4fd1ff, 1.5);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    // Animation loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Continuous rotation
      if (!prefersReducedMotion) {
        group.rotation.y = elapsed * 0.08;
        group.rotation.x = Math.sin(elapsed * 0.05) * 0.1;

        // Periodic rebuild links for dynamic active nodes effect
        if (Math.floor(elapsed) % 6 === 0 && Math.floor(elapsed * 10) % 60 === 0) {
          buildLinks();
        }

        // Animate particles scale / pulse
        nodeMat.size = 0.16 + Math.sin(elapsed * 4) * 0.03;
      } else {
        group.rotation.y = elapsed * 0.02;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      globeGeom.dispose();
      globeMat.dispose();
      nodeGeom.dispose();
      nodeMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Globe Canvas Container */}
      <div ref={containerRef} className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] z-10" />
      {/* Glass backdrop ring */}
      <div className="absolute w-[180px] h-[180px] rounded-full border border-cyan-500/10 bg-cyan-500/2 pointer-events-none" />
    </div>
  );
}
