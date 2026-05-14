"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import worldLines from "@/data/office-globe-world-lines.json";

type LabelPosition = "right" | "top-right";

type Location = {
  label: string;
  lat: number;
  lng: number;
  labelPosition: LabelPosition;
  isHub?: boolean;
};

type LineStringGeometry = {
  type: "LineString";
  coordinates: [number, number][];
};

type MultiLineStringGeometry = {
  type: "MultiLineString";
  coordinates: [number, number][][];
};

type SupportedGeometry = LineStringGeometry | MultiLineStringGeometry;

type GeoJson =
  | { type: "Feature"; geometry: SupportedGeometry }
  | { type: "FeatureCollection"; features: { type: "Feature"; geometry: SupportedGeometry }[] }
  | { type: "GeometryCollection"; geometries: SupportedGeometry[] };

type LabelLayoutItem = {
  index: number;
  label: HTMLElement;
  location: Location;
  anchorX: number;
  anchorY: number;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  alignLeft: boolean;
  isHub: boolean;
};

const LOCATIONS: Location[] = [
  { label: "Shenzhen", lat: 22.543096, lng: 114.057865, labelPosition: "right", isHub: true },
  { label: "Beijing", lat: 39.9042, lng: 116.4074, labelPosition: "right" },
  { label: "Shanghai", lat: 31.2304, lng: 121.4737, labelPosition: "right" },
  { label: "Suzhou", lat: 31.2989, lng: 120.5853, labelPosition: "right" },
  { label: "Hangzhou", lat: 30.2741, lng: 120.1551, labelPosition: "right" },
  { label: "Guangzhou", lat: 23.1291, lng: 113.2644, labelPosition: "right" },
  { label: "Dongguan", lat: 23.0207, lng: 113.7518, labelPosition: "right" },
  { label: "Hong Kong", lat: 22.3193, lng: 114.1694, labelPosition: "right" },
  { label: "Taipei", lat: 25.033, lng: 121.5654, labelPosition: "right" },
  { label: "Tokyo", lat: 35.6762, lng: 139.6503, labelPosition: "right" },
  { label: "Nagoya", lat: 35.1815, lng: 136.9066, labelPosition: "right" },
  { label: "Osaka", lat: 34.6937, lng: 135.5023, labelPosition: "right" },
  { label: "Seoul", lat: 37.5665, lng: 126.978, labelPosition: "right" },
  { label: "Daejeon", lat: 36.3504, lng: 127.3845, labelPosition: "right" },
  { label: "Singapore", lat: 1.3521, lng: 103.8198, labelPosition: "right" },
  { label: "Bengaluru", lat: 12.9716, lng: 77.5946, labelPosition: "right" },
  { label: "Boston - Cambridge", lat: 42.3601, lng: -71.0589, labelPosition: "right" },
  { label: "Pittsburgh", lat: 40.4406, lng: -79.9959, labelPosition: "right" },
  { label: "Detroit - Ann Arbor", lat: 42.3314, lng: -83.0458, labelPosition: "right" },
  { label: "San Francisco - Palo Alto", lat: 37.614546, lng: -122.394524, labelPosition: "right" },
  { label: "Seattle", lat: 47.604240372625654, lng: -122.33458146977614, labelPosition: "top-right" },
  { label: "Austin", lat: 30.2672, lng: -97.7431, labelPosition: "right" },
  { label: "Toronto - Waterloo", lat: 43.6532, lng: -79.3832, labelPosition: "right" },
  { label: "Montreal", lat: 45.5017, lng: -73.5673, labelPosition: "right" },
  { label: "Memphis", lat: 35.149532, lng: -90.048981, labelPosition: "right" },
  { label: "Munich", lat: 48.1351, lng: 11.582, labelPosition: "right" },
  { label: "Stuttgart", lat: 48.7758, lng: 9.1829, labelPosition: "right" },
  { label: "Zurich", lat: 47.3769, lng: 8.5417, labelPosition: "right" },
  { label: "Odense", lat: 55.4038, lng: 10.4024, labelPosition: "right" },
  { label: "Eindhoven", lat: 51.4416, lng: 5.4697, labelPosition: "right" },
  { label: "London", lat: 51.50527, lng: -0.120968, labelPosition: "right" },
  { label: "Bristol", lat: 51.4545, lng: -2.5879, labelPosition: "right" },
  { label: "Paris", lat: 48.8566, lng: 2.3522, labelPosition: "right" },
  { label: "Tel Aviv", lat: 32.0853, lng: 34.7818, labelPosition: "right" },
];

const OPTIONS = {
  backgroundColor: "#061a3d",
  markerColor: "#3b82f6",
  autoRotate: true,
  globeRadius: 5.65,
  offset: { y: -1.25, x: 0, z: 0 },
};

const numberFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 4,
  signDisplay: "never",
});

export default function OfficeGlobe() {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const labelsLayer = labelsRef.current;

    if (!host || !labelsLayer) return;

    const hostElement = host;
    const labelsElement = labelsLayer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.domElement.dataset.engine = "three.js r172";
    hostElement.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.enableDamping = true;
    controls.autoRotate = OPTIONS.autoRotate && !prefersReducedMotion;
    controls.autoRotateSpeed = 0.4;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.rotateSpeed = 0.25;
    controls.minPolarAngle = 0.35 * Math.PI;
    controls.maxPolarAngle = 0.35 * Math.PI;

    const globeGeometry = new THREE.SphereGeometry(OPTIONS.globeRadius, 64, 64);
    const globeMaterial = new THREE.MeshBasicMaterial({
      color: OPTIONS.backgroundColor,
      wireframe: false,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    const lineMaterials: LineMaterial[] = [];
    const lineOffsetGroup = new THREE.Group();
    lineOffsetGroup.rotation.x = OPTIONS.offset.x;
    lineOffsetGroup.rotation.y = OPTIONS.offset.y;
    lineOffsetGroup.rotation.z = OPTIONS.offset.z;

    const worldGroup = createWorldLines({
      json: worldLines as unknown as GeoJson,
      radius: OPTIONS.globeRadius,
      lineMaterials,
    });
    lineOffsetGroup.add(worldGroup);
    scene.add(lineOffsetGroup);

    const officeArc = createOfficeArc();
    scene.add(officeArc);

    const hubGlowMaterial = createHubMarker(scene);
    const labelLayoutState = new Map<number, { x: number; y: number }>();
    let frameId = 0;
    let isMounted = true;
    let isVisible = true;

    function resize() {
      const width = Math.max(280, hostElement.clientWidth || 560);
      const height = Math.max(280, hostElement.clientHeight || width);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      for (const material of lineMaterials) {
        material.resolution.set(width, height);
      }
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(hostElement);
    resize();

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry?.isIntersecting ?? true;
    });
    intersectionObserver.observe(hostElement);

    function animate(time = 0) {
      if (!isMounted) return;

      if (isVisible) {
        controls.update();
        updateLabels(camera, hostElement, labelsElement, labelLayoutState);
        worldGroup.userData.update?.(time);

        if (hubGlowMaterial && !prefersReducedMotion) {
          hubGlowMaterial.opacity = 0.18 + 0.2 * Math.abs(Math.sin(time * 0.0018));
        }

        renderer.render(scene, camera);
      }

      frameId = window.requestAnimationFrame(animate);
    }

    frameId = window.requestAnimationFrame(animate);

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(frameId);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      controls.dispose();
      disposeScene(scene);
      renderer.dispose();
      renderer.domElement.remove();
      labelLayoutState.clear();
    };
  }, []);

  return (
    <figure className="office-globe" aria-label="Global robotics innovation connections centered on Shenzhen">
      <div className="office-globe__mask">
        <div ref={hostRef} className="office-globe__canvas-host" />
        <div ref={labelsRef} className="office-globe__labels">
          {LOCATIONS.map((location, index) => (
            <div
              key={location.label}
              className={`office-globe__label ${location.isHub ? "office-globe__label--hub" : ""}`}
              data-label-index={index}
              style={{ display: "none" }}
            >
              <div className="office-globe__label-leader" aria-hidden="true" />
              <div className="office-globe__label-stack">
                <div className="office-globe__label-dot" style={{ background: OPTIONS.markerColor }} />
                <div className={`office-globe__label-text office-globe__label-text--${location.labelPosition}`}>
                  <span className="office-globe__label-name">{location.label}</span>
                  <br />
                  <span className="office-globe__label-coordinates">{formatLatLng(location)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}

function formatLatLng(location: Location) {
  return `${numberFormatter.format(location.lat)}deg${location.lat > 0 ? "N" : "S"}, ${numberFormatter.format(
    location.lng,
  )}deg${location.lng > 0 ? "E" : "W"}`;
}

function applyAxisOffset(vector: THREE.Vector3) {
  vector.applyAxisAngle(new THREE.Vector3(0, 1, 0), OPTIONS.offset.y);
  vector.applyAxisAngle(new THREE.Vector3(1, 0, 0), OPTIONS.offset.x);
  vector.applyAxisAngle(new THREE.Vector3(0, 0, 1), OPTIONS.offset.z);
  return vector;
}

function latLngToVector3(lat: number, lng: number, radius = OPTIONS.globeRadius) {
  const phi = (Math.PI / 180) * (90 - lat);
  const theta = (Math.PI / 180) * (lng + 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return applyAxisOffset(new THREE.Vector3(x, y, z));
}

function isLargeJump(previous: [number, number], current: [number, number]) {
  const lngDiff = Math.abs(current[0] - previous[0]);
  const latDiff = Math.abs(current[1] - previous[1]);
  return lngDiff > 5 || latDiff > 5;
}

function midpoint(a: [number, number], b: [number, number]): [number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function densifyLine(coordinates: [number, number][]): [number, number][] {
  const output: [number, number][] = [];

  for (let i = 0; i < coordinates.length; i += 1) {
    const current = coordinates[i];
    const previous = coordinates[i - 1];

    if (i > 0) {
      if (isLargeJump(previous, current)) {
        const segment = densifyLine([previous, midpoint(previous, current), current]);
        output.push(...segment);
      } else {
        output.push(current);
      }
    } else {
      output.push(current);
    }
  }

  return output;
}

function getGeometries(geoJson: GeoJson): SupportedGeometry[] {
  if (geoJson.type === "Feature") return [geoJson.geometry];
  if (geoJson.type === "FeatureCollection") return geoJson.features.map((feature) => feature.geometry);
  if (geoJson.type === "GeometryCollection") return geoJson.geometries;
  return [];
}

function createLineFromLngLat({
  coordinates,
  lineMaterials,
  parent,
  radius,
}: {
  coordinates: [number, number][];
  lineMaterials: LineMaterial[];
  parent: THREE.Group;
  radius: number;
}) {
  const points: number[] = [];
  const denseCoordinates = densifyLine(coordinates);

  for (const coordinate of denseCoordinates) {
    const lng = coordinate[0];
    const lat = coordinate[1];

    points.push(
      Math.cos((lat * Math.PI) / 180) * Math.cos((lng * Math.PI) / 180) * radius,
      Math.cos((lat * Math.PI) / 180) * Math.sin((lng * Math.PI) / 180) * radius,
      Math.sin((lat * Math.PI) / 180) * radius,
    );
  }

  const geometry = new LineGeometry();
  geometry.setPositions(points);

  const material = new LineMaterial({
    color: "#7fb0ff",
    linewidth: 1,
    fog: false,
  });
  lineMaterials.push(material);

  const line = new Line2(geometry, material);
  line.computeLineDistances();

  const dashSpeed = 0.0002 * Math.random();
  line.userData.update = (time: number) => {
    material.dashOffset = time * dashSpeed;
  };

  parent.add(line);
}

function createWorldLines({
  json,
  lineMaterials,
  radius,
}: {
  json: GeoJson;
  lineMaterials: LineMaterial[];
  radius: number;
}) {
  const group = new THREE.Group();
  group.userData.update = (time: number) => {
    for (const child of group.children) {
      child.userData.update?.(time);
    }
  };
  group.rotation.x = -0.5 * Math.PI;

  for (const geometry of getGeometries(json)) {
    if (geometry.type === "LineString") {
      createLineFromLngLat({ coordinates: geometry.coordinates, lineMaterials, radius, parent: group });
    } else {
      for (const line of geometry.coordinates) {
        createLineFromLngLat({ coordinates: line, lineMaterials, radius, parent: group });
      }
    }
  }

  return group;
}

function createArcPoints(start: THREE.Vector3, end: THREE.Vector3, segments = 50) {
  const points: THREE.Vector3[] = [];
  const radius = start.length();
  const startDir = start.clone().normalize();
  const endDir = end.clone().normalize();
  const cosAngle = Math.max(-1, Math.min(1, startDir.dot(endDir)));
  const angle = Math.acos(cosAngle);

  if (angle < 1e-9) {
    points.push(start.clone(), end.clone());
    return points;
  }

  const maxHeight = 0.06 * radius * angle;

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const a = Math.sin((1 - t) * angle) / Math.sin(angle);
    const b = Math.sin(t * angle) / Math.sin(angle);
    const dir = new THREE.Vector3(
      a * startDir.x + b * endDir.x,
      a * startDir.y + b * endDir.y,
      a * startDir.z + b * endDir.z,
    );
    const lift = Math.sin(t * Math.PI) * maxHeight;
    points.push(dir.multiplyScalar(radius + lift));
  }

  return points;
}

function createArrowHead(points: THREE.Vector3[], material: THREE.Material) {
  const arrowGeometry = new THREE.ConeGeometry(0.09, 0.24, 16);
  const arrow = new THREE.Mesh(arrowGeometry, material);
  const end = points[points.length - 1];
  const beforeEnd = points[points.length - 3] || points[points.length - 2];
  const direction = end.clone().sub(beforeEnd).normalize();

  arrow.position.copy(end.clone().lerp(beforeEnd, 0.08));
  arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  return arrow;
}

function createOfficeArc() {
  const group = new THREE.Group();
  const hub = LOCATIONS.find((location) => location.isHub);
  const sources = LOCATIONS.filter((location) => !location.isHub);

  if (!hub) return group;

  const hubPoint = latLngToVector3(hub.lat, hub.lng, OPTIONS.globeRadius);
  const arcMaterial = new THREE.LineBasicMaterial({ color: OPTIONS.markerColor });
  const arrowMaterial = new THREE.MeshBasicMaterial({ color: OPTIONS.markerColor });

  for (const source of sources) {
    const sourcePoint = latLngToVector3(source.lat, source.lng, OPTIONS.globeRadius);
    const points = createArcPoints(sourcePoint, hubPoint, 64);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, arcMaterial);

    group.add(line);
    group.add(createArrowHead(points, arrowMaterial));
  }

  return group;
}

function createHubMarker(scene: THREE.Scene) {
  const hub = LOCATIONS.find((location) => location.isHub);
  if (!hub) return null;

  const hubPos = latLngToVector3(hub.lat, hub.lng, OPTIONS.globeRadius);
  const markerGeo = new THREE.SphereGeometry(0.16, 32, 32);
  const markerMat = new THREE.MeshBasicMaterial({ color: OPTIONS.markerColor });
  const marker = new THREE.Mesh(markerGeo, markerMat);
  marker.position.copy(hubPos);
  scene.add(marker);

  const glowGeo = new THREE.SphereGeometry(0.28, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: OPTIONS.markerColor,
    transparent: true,
    opacity: 0.28,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.copy(hubPos);
  scene.add(glow);

  return glowMat;
}

function getLabelSize(label: HTMLElement, location: Location) {
  if (location.isHub) return { width: 240, height: 64 };

  const text = label.querySelector<HTMLElement>(".office-globe__label-text");
  const width = Math.max(168, Math.min(260, text?.offsetWidth || 190));
  const height = Math.max(42, Math.min(72, text?.offsetHeight || 50));
  return { width, height };
}

function getLabelBox(item: LabelLayoutItem) {
  const dotPadding = item.isHub ? 18 : 10;
  const left = item.alignLeft ? item.x - item.width - dotPadding : item.x + dotPadding;
  const right = item.alignLeft ? item.x - dotPadding : item.x + item.width + dotPadding;
  const top = item.y - 10;
  const bottom = item.y + item.height + 8;

  return {
    left,
    right,
    top,
    bottom,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
  };
}

function resolveLabelCollisions(items: LabelLayoutItem[], width: number, height: number) {
  const padding = 8;
  const minX = -170;
  const maxX = width + 170;
  const minY = -70;
  const maxY = height + 70;

  for (let iteration = 0; iteration < 76; iteration += 1) {
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const a = items[i];
        const b = items[j];
        const aBox = getLabelBox(a);
        const bBox = getLabelBox(b);
        const overlapX = Math.min(aBox.right, bBox.right) - Math.max(aBox.left, bBox.left);
        const overlapY = Math.min(aBox.bottom, bBox.bottom) - Math.max(aBox.top, bBox.top);

        if (overlapX > -padding && overlapY > -padding) {
          const pushX = (overlapX + padding) / 2;
          const pushY = (overlapY + padding) / 2;
          const directionX = aBox.centerX <= bBox.centerX ? -1 : 1;
          const directionY = aBox.centerY <= bBox.centerY ? -1 : 1;

          if (pushY <= pushX * 1.35) {
            a.y += directionY * pushY;
            b.y -= directionY * pushY;
          } else {
            a.x += directionX * pushX;
            b.x -= directionX * pushX;
          }
        }
      }
    }

    for (const item of items) {
      item.x += (item.targetX - item.x) * 0.018;
      item.y += (item.targetY - item.y) * 0.028;
      item.x = Math.min(maxX, Math.max(minX, item.x));
      item.y = Math.min(maxY, Math.max(minY, item.y));
    }
  }
}

function positionLeader(label: HTMLElement, anchorX: number, anchorY: number, labelX: number, labelY: number) {
  const leader = label.querySelector<HTMLElement>(".office-globe__label-leader");
  if (!leader) return;

  const dx = anchorX - labelX;
  const dy = anchorY - labelY;
  const length = Math.hypot(dx, dy);

  if (length < 18) {
    leader.style.display = "none";
    return;
  }

  leader.style.display = "block";
  leader.style.width = `${length}px`;
  leader.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
}

function updateLabels(
  camera: THREE.Camera,
  host: HTMLElement,
  labelsLayer: HTMLElement,
  labelLayoutState: Map<number, { x: number; y: number }>,
) {
  const labels = [...labelsLayer.querySelectorAll<HTMLElement>(".office-globe__label")];
  const width = host.clientWidth || 560;
  const height = host.clientHeight || width;
  const centerX = width / 2;
  const centerY = height / 2;
  const visibleItems: LabelLayoutItem[] = [];

  labels.forEach((label, index) => {
    const location = LOCATIONS[index];
    const point = latLngToVector3(location.lat, location.lng, OPTIONS.globeRadius);
    const cameraDirection = camera.position.clone().normalize();
    const normalDot = point.clone().normalize().dot(cameraDirection);

    if (normalDot < 0.5) {
      label.style.display = "none";
      return;
    }

    const projected = point.clone().project(camera);
    const anchorX = (0.5 * projected.x + 0.5) * width;
    const anchorY = (-(0.5 * projected.y) + 0.5) * height;
    const isHub = Boolean(location.isHub);
    const angle = Math.atan2(anchorY - centerY, anchorX - centerX);
    const spread = isHub ? 14 : 0;
    const ringOffsetX = Math.cos(angle) * spread;
    const ringOffsetY = Math.sin(angle) * spread;
    const size = getLabelSize(label, location);
    const targetX = anchorX + ringOffsetX;
    const targetY = anchorY + ringOffsetY;
    const alignLeft = !isHub && targetX > width * 0.58;
    const cached = labelLayoutState.get(index);

    label.style.display = "block";
    label.classList.toggle("office-globe__label--align-left", alignLeft);

    visibleItems.push({
      index,
      label,
      location,
      anchorX,
      anchorY,
      targetX,
      targetY,
      x: cached?.x ?? targetX,
      y: cached?.y ?? targetY,
      width: size.width,
      height: size.height,
      alignLeft,
      isHub,
    });
  });

  resolveLabelCollisions(
    visibleItems.filter((item) => item.isHub),
    width,
    height,
  );

  for (const item of visibleItems) {
    if (item.isHub) {
      const cached = labelLayoutState.get(item.index) || { x: item.x, y: item.y };
      cached.x += (item.x - cached.x) * 0.22;
      cached.y += (item.y - cached.y) * 0.22;
      labelLayoutState.set(item.index, cached);

      item.label.style.left = `${cached.x}px`;
      item.label.style.top = `${cached.y}px`;
      item.label.style.transform = "translate(-0.5rem, -0.5rem)";
      item.label.style.zIndex = "30";
      positionLeader(item.label, item.anchorX, item.anchorY, cached.x, cached.y);
    } else {
      item.label.style.left = `${item.x}px`;
      item.label.style.top = `${item.y}px`;
      item.label.style.transform = "translate(-0.3rem, -0.3rem)";
      item.label.style.zIndex = `${10 + Math.round(item.anchorY / 30)}`;
    }
  }
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    const disposable = object as THREE.Object3D & {
      geometry?: { dispose: () => void };
      material?: THREE.Material | THREE.Material[];
    };

    disposable.geometry?.dispose();

    if (Array.isArray(disposable.material)) {
      for (const material of disposable.material) {
        material.dispose();
      }
    } else {
      disposable.material?.dispose();
    }
  });
}
