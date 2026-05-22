'use client';

import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { visitorSources, SHENZHEN_COORDS, CATEGORY_COLORS } from '@/data/visitors';

const DEG2RAD = Math.PI / 180;

function latLngToVector3(lat: number, lng: number, radius: number = 1): THREE.Vector3 {
  const phi = (90 - lat) * DEG2RAD;
  const theta = (lng + 180) * DEG2RAD;
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

const ENGLISH_LABELS: Record<string, string> = {
  '东京': 'Tokyo', '首尔': 'Seoul', '新加坡': 'Singapore', '孟买': 'Mumbai',
  '迪拜': 'Dubai', '特拉维夫': 'Tel Aviv', '台北': 'Taipei', '曼谷': 'Bangkok',
  '慕尼黑': 'Munich', '伦敦': 'London', '巴黎': 'Paris', '苏黎世': 'Zurich',
  '斯德哥尔摩': 'Stockholm', '阿姆斯特丹': 'Amsterdam', '米兰': 'Milan',
  '旧金山': 'San Francisco', '波士顿': 'Boston', '匹兹堡': 'Pittsburgh',
  '多伦多': 'Toronto', '纽约': 'New York', '圣保罗': 'São Paulo',
  '内罗毕': 'Nairobi', '约翰内斯堡': 'Johannesburg', '悉尼': 'Sydney', '墨尔本': 'Melbourne',
};

const mouseState = { actual: { x: 0, y: 0 }, dragging: false, dragPrev: { x: 0, y: 0 } };

interface Globe3DProps { className?: string; }

export default function Globe3D({ className }: Globe3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const setup = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // 清理旧实例
    if (cleanupRef.current) cleanupRef.current();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const szDir = latLngToVector3(SHENZHEN_COORDS.lat, SHENZHEN_COORDS.lng, 2.8);
    camera.position.set(szDir.x, szDir.y, szDir.z);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    function resize() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const d1 = new THREE.DirectionalLight(0xffffff, 2.5); d1.position.set(5, 3, 5); scene.add(d1);
    const d2 = new THREE.DirectionalLight(0xaaccff, 0.4); d2.position.set(-3, -2, -3); scene.add(d2);

    // Globe group
    const globeGroup = new THREE.Group();
    globeGroup.scale.setScalar(0.75);
    scene.add(globeGroup);

    // Textures
    const loader = new THREE.TextureLoader();
    let loaded = 0;
    const dayMap = loader.load('/earth-blue-marble.jpg', () => { if (++loaded === 2) addGlobe(); });
    const nightMap = loader.load('/earth-night.jpg', () => { if (++loaded === 2) addGlobe(); });

    let globeMesh: THREE.Mesh | null = null;
    function addGlobe() {
      globeMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 64, 64),
        new THREE.MeshPhongMaterial({
          map: dayMap, emissiveMap: nightMap,
          emissive: new THREE.Color(0xffcc44), emissiveIntensity: 0.12,
          shininess: 20, specular: new THREE.Color(0x334466),
        })
      );
      globeGroup.add(globeMesh);
    }

    // City nodes
    const cityData = visitorSources.map((node) => ({
      pos: latLngToVector3(node.lat, node.lng, 1.008),
      color: CATEGORY_COLORS[node.category],
      english: ENGLISH_LABELS[node.city] || node.city,
    }));

    const cityMeshes: THREE.Mesh[] = [];
    const cityGroups: THREE.Group[] = [];
    cityData.forEach((node) => {
      const grp = new THREE.Group();
      grp.position.copy(node.pos);
      const outer = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 12, 12),
        new THREE.MeshBasicMaterial({ color: node.color, transparent: true, opacity: 0.6 })
      );
      grp.add(outer);
      cityMeshes.push(outer);
      grp.add(new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })));
      const hitbox = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
      hitbox.userData = { english: node.english, color: node.color };
      grp.add(hitbox);
      globeGroup.add(grp);
      cityGroups.push(grp);
    });

    // Arcs
    const target = latLngToVector3(SHENZHEN_COORDS.lat, SHENZHEN_COORDS.lng, 1);
    const arcData = visitorSources.map((dest, i) => {
      const start = latLngToVector3(dest.lat, dest.lng, 1);
      const dist = Math.sqrt(Math.pow(dest.lng - SHENZHEN_COORDS.lng, 2) + Math.pow(dest.lat - SHENZHEN_COORDS.lat, 2));
      const arcHeight = 0.08 + (dist / 180) * 0.25;
      const points: THREE.Vector3[] = [];
      for (let j = 0; j <= 50; j++) {
        const t = j / 50;
        const pt = new THREE.Vector3().lerpVectors(start, target, t);
        pt.normalize().multiplyScalar(1 + Math.sin(t * Math.PI) * arcHeight);
        points.push(pt);
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      globeGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x4f8cff, opacity: 0.3, transparent: true })));
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), new THREE.MeshBasicMaterial({ color: 0x7ab4ff, transparent: true, opacity: 0.9 }));
      globeGroup.add(particle);
      return { curve, delay: i * 0.15, speed: 0.3 + Math.random() * 0.2, particle };
    });

    // Shenzhen marker
    const szPos = latLngToVector3(SHENZHEN_COORDS.lat, SHENZHEN_COORDS.lng, 1.012);
    const szGroup = new THREE.Group();
    szGroup.position.copy(szPos);
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.98, 1, 32), new THREE.MeshBasicMaterial({ color: 0x6f9cff, transparent: true, opacity: 0.3, side: THREE.DoubleSide }));
      ring.rotation.x = Math.PI / 2;
      szGroup.add(ring);
      rings.push(ring);
    }
    szGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), new THREE.MeshBasicMaterial({ color: 0x6f9cff })));
    globeGroup.add(szGroup);

    // HTML labels overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:1;';
    container.appendChild(overlay);

    // Shenzhen label
    const szLabel = document.createElement('div');
    szLabel.style.cssText = 'position:absolute;display:flex;align-items:center;gap:4px;white-space:nowrap;transform:translate(-50%,-100%);';
    szLabel.innerHTML = '<div style="width:5px;height:5px;border-radius:50%;background:#6f9cff;box-shadow:0 0 6px rgba(111,156,255,0.6)"></div><span style="color:rgba(180,210,255,0.8);font-size:8px;font-weight:500;font-family:\'Helvetica Neue\',Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;text-shadow:0 0 4px rgba(0,0,0,0.6)">Shenzhen</span>';
    overlay.appendChild(szLabel);

    // City click label
    let activeLabel: HTMLDivElement | null = null;
    let labelTimer: ReturnType<typeof setTimeout> | null = null;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function showLabel(english: string, color: string, sx: number, sy: number) {
      if (labelTimer) clearTimeout(labelTimer);
      if (activeLabel) { activeLabel.remove(); activeLabel = null; }
      const el = document.createElement('div');
      el.style.cssText = 'position:absolute;display:flex;align-items:center;gap:4px;white-space:nowrap;transform:translate(-50%,-100%);';
      el.innerHTML = `<div style="width:4px;height:4px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color}80"></div><span style="color:rgba(180,210,255,0.9);font-size:9px;font-weight:500;font-family:'Helvetica Neue',Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;text-shadow:0 0 4px rgba(0,0,0,0.6)">${english}</span>`;
      el.style.left = `${sx}px`;
      el.style.top = `${sy - 16}px`;
      overlay.appendChild(el);
      activeLabel = el;
      labelTimer = setTimeout(() => { el.remove(); activeLabel = null; }, 2000);
    }

    function onClick(e: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(globeGroup.children, true);
      for (const hit of hits) {
        if (hit.object.userData?.english) {
          const wp = new THREE.Vector3();
          hit.object.getWorldPosition(wp);
          const sp = wp.clone().project(camera);
          showLabel(hit.object.userData.english, hit.object.userData.color,
            (sp.x * 0.5 + 0.5) * container!.clientWidth,
            (-sp.y * 0.5 + 0.5) * container!.clientHeight);
          break;
        }
      }
    }
    renderer.domElement.addEventListener('click', onClick);

    // Mouse drag
    const onMove = (e: MouseEvent) => {
      if (!mouseState.dragging) return;
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseState.actual.x += (nx - mouseState.dragPrev.x) * 2;
      mouseState.actual.y = Math.max(-0.8, Math.min(0.8, mouseState.actual.y + (ny - mouseState.dragPrev.y) * 0.8));
      mouseState.dragPrev.x = nx; mouseState.dragPrev.y = ny;
    };
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const rect = container.getBoundingClientRect();
      mouseState.dragging = true;
      mouseState.dragPrev.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseState.dragPrev.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      container.style.cursor = 'grabbing';
    };
    const onUp = () => { mouseState.dragging = false; container.style.cursor = 'grab'; };
    const onDbl = () => { mouseState.actual.x = 0; mouseState.actual.y = 0; };

    container.addEventListener('mousemove', onMove);
    container.addEventListener('mousedown', onDown);
    container.addEventListener('mouseup', onUp);
    container.addEventListener('mouseleave', onUp);
    container.addEventListener('dblclick', onDbl);

    // Animation
    const clock = new THREE.Clock();
    let raf: number;
    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!mouseState.dragging) mouseState.actual.x += 0.0008;
      globeGroup.rotation.y = mouseState.actual.x;
      globeGroup.rotation.x = mouseState.actual.y;

      cityMeshes.forEach((m, i) => m.scale.setScalar(0.7 + Math.sin(t * 2 + i * 0.5) * 0.3));

      // Shenzhen rings visibility
      const szFacing = szPos.clone().applyMatrix4(globeGroup.matrixWorld).normalize().dot(camera.position.clone().normalize());
      szGroup.visible = szFacing > 0.1;

      rings.forEach((r, i) => {
        const p = (t * 0.5 + i * 0.33) % 1;
        r.scale.setScalar(0.015 + p * 0.12);
        (r.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.35;
      });
      arcData.forEach((a) => {
        const p = ((t * a.speed + a.delay) % 2) / 2;
        const pos = a.curve.getPointAt(p);
        a.particle.position.set(pos.x, pos.y, pos.z);
        (a.particle.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(p * Math.PI) * 0.6;
      });

      // Update Shenzhen label - only show when facing camera
      const szWorld = szPos.clone().applyMatrix4(globeGroup.matrixWorld);
      const camDir = camera.position.clone().normalize();
      const szNormal = szWorld.clone().normalize();
      const facing = szNormal.dot(camDir);
      if (facing > 0.1) {
        const ssp = szWorld.project(camera);
        szLabel.style.display = 'flex';
        szLabel.style.left = `${(ssp.x * 0.5 + 0.5) * container!.clientWidth}px`;
        szLabel.style.top = `${(-ssp.y * 0.5 + 0.5) * container!.clientHeight - 16}px`;
      } else {
        szLabel.style.display = 'none';
      }

      renderer.render(scene, camera);
    }
    animate();

    cleanupRef.current = () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mousedown', onDown);
      container.removeEventListener('mouseup', onUp);
      container.removeEventListener('mouseleave', onUp);
      container.removeEventListener('dblclick', onDbl);
      renderer.domElement.removeEventListener('click', onClick);
      if (overlay.parentElement) overlay.remove();
      if (labelTimer) clearTimeout(labelTimer);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    setup();
    return () => { if (cleanupRef.current) cleanupRef.current(); };
  }, [setup]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className || ''}`}
      style={{ cursor: 'grab', width: '100%', height: '100%' }}
    />
  );
}
