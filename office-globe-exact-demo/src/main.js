import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import worldLines from "./world-lines.json";
import "./style.css";

const LOCATIONS = [
  // Hub: every robotics city points to Shenzhen.
  {
    label: "Shenzhen",
    lat: 22.543096,
    lng: 114.057865,
    labelPosition: "right",
    isHub: true,
  },

  // China robotics / manufacturing / AI hardware cities.
  { label: "Beijing", lat: 39.9042, lng: 116.4074, labelPosition: "right" },
  { label: "Shanghai", lat: 31.2304, lng: 121.4737, labelPosition: "right" },
  { label: "Suzhou", lat: 31.2989, lng: 120.5853, labelPosition: "right" },
  { label: "Hangzhou", lat: 30.2741, lng: 120.1551, labelPosition: "right" },
  { label: "Guangzhou", lat: 23.1291, lng: 113.2644, labelPosition: "right" },
  { label: "Dongguan", lat: 23.0207, lng: 113.7518, labelPosition: "right" },
  { label: "Hong Kong", lat: 22.3193, lng: 114.1694, labelPosition: "right" },
  { label: "Taipei", lat: 25.033, lng: 121.5654, labelPosition: "right" },

  // Asia-Pacific robotics hubs.
  { label: "Tokyo", lat: 35.6762, lng: 139.6503, labelPosition: "right" },
  { label: "Nagoya", lat: 35.1815, lng: 136.9066, labelPosition: "right" },
  { label: "Osaka", lat: 34.6937, lng: 135.5023, labelPosition: "right" },
  { label: "Seoul", lat: 37.5665, lng: 126.978, labelPosition: "right" },
  { label: "Daejeon", lat: 36.3504, lng: 127.3845, labelPosition: "right" },
  { label: "Singapore", lat: 1.3521, lng: 103.8198, labelPosition: "right" },
  { label: "Bengaluru", lat: 12.9716, lng: 77.5946, labelPosition: "right" },

  // North America robotics / autonomy / hardware cities.
  { label: "Boston • Cambridge", lat: 42.3601, lng: -71.0589, labelPosition: "right" },
  { label: "Pittsburgh", lat: 40.4406, lng: -79.9959, labelPosition: "right" },
  { label: "Detroit • Ann Arbor", lat: 42.3314, lng: -83.0458, labelPosition: "right" },
  { label: "San Francisco • Palo Alto", lat: 37.614546, lng: -122.394524, labelPosition: "right" },
  { label: "Seattle", lat: 47.604240372625654, lng: -122.33458146977614, labelPosition: "top-right" },
  { label: "Austin", lat: 30.2672, lng: -97.7431, labelPosition: "right" },
  { label: "Toronto • Waterloo", lat: 43.6532, lng: -79.3832, labelPosition: "right" },
  { label: "Montreal", lat: 45.5017, lng: -73.5673, labelPosition: "right" },
  { label: "Memphis", lat: 35.149532, lng: -90.048981, labelPosition: "right" },

  // Europe / Middle East robotics and research cities.
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
  backgroundColor: "#0a0a0a",
  markerColor: "#FF6308",
  canvasSize: 800,
  autoRotate: true,
  showLatLngLabels: true,
  globeRadius: 5.65,
  offset: { y: -1.25 },
};

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="page-shell">
    <figure class="globe-figure">
      <div class="globe-mask">
        <div id="globeCanvasHost" class="canvas-host"></div>
        <div id="labelsLayer"></div>
      </div>
    </figure>
  </main>
`;

const host = document.querySelector("#globeCanvasHost");
const labelsLayer = document.querySelector("#labelsLayer");
const numberFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 4,
  signDisplay: "never",
});

// Keep label positions smooth while the globe rotates.
const LABEL_LAYOUT_STATE = new Map();

function formatLatLng(location) {
  return `${numberFormatter.format(location.lat)}°${location.lat > 0 ? "N" : "S"},<br>${numberFormatter.format(location.lng)}°${location.lng > 0 ? "E" : "W"}`;
}

function createLabels() {
  labelsLayer.innerHTML = LOCATIONS.map((location, index) => {
    const labelClass = location.labelPosition === "top-right" ? "top-right" : "right";
    const hubClass = location.isHub ? "hub-label" : "";

    return `
      <div class="office-label ${hubClass}" data-label-index="${index}" style="display:none;">
        <div class="label-leader" aria-hidden="true"></div>
        <div class="label-stack">
          <div class="label-dot" style="background:${OPTIONS.markerColor};"></div>
          <div class="label-text ${labelClass}">
            <span class="label-name">${location.label}</span><br>
            <span class="label-coordinates">${formatLatLng(location)}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function applyAxisOffset(vector) {
  const { offset } = OPTIONS;
  vector.applyAxisAngle(new THREE.Vector3(0, 1, 0), offset.y || 0);
  vector.applyAxisAngle(new THREE.Vector3(1, 0, 0), offset.x || 0);
  vector.applyAxisAngle(new THREE.Vector3(0, 0, 1), offset.z || 0);
  return vector;
}

function latLngToVector3(lat, lng, radius = OPTIONS.globeRadius) {
  const phi = (Math.PI / 180) * (90 - lat);
  const theta = (Math.PI / 180) * (lng + 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return applyAxisOffset(new THREE.Vector3(x, y, z));
}

function isLargeJump(previous, current) {
  const lngDiff = Math.abs(current[0] - previous[0]);
  const latDiff = Math.abs(current[1] - previous[1]);
  return lngDiff > 5 || latDiff > 5;
}

function midpoint(a, b) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function densifyLine(coordinates) {
  let output = [];
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

function getGeometries(geoJson) {
  if (geoJson.type === "Feature") return [geoJson.geometry];
  if (geoJson.type === "FeatureCollection") return geoJson.features.map((feature) => feature.geometry);
  if (geoJson.type === "GeometryCollection") return geoJson.geometries;
  throw new Error("The geoJSON is not valid.");
}

function createLineFromLngLat(coordinates, radius, parent) {
  const points = [];
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
    color: "#888888",
    linewidth: 1,
    fog: false,
  });
  material.resolution.set(OPTIONS.canvasSize, OPTIONS.canvasSize);

  const line = new Line2(geometry, material);
  line.computeLineDistances();

  const dashSpeed = 0.0002 * Math.random();
  line.userData.update = (time) => {
    material.dashOffset = time * dashSpeed;
  };

  parent.add(line);
}

function createWorldLines({ json, radius }) {
  const group = new THREE.Group();
  group.userData.update = (time) => {
    for (const child of group.children) {
      child.userData.update?.(time);
    }
  };
  group.rotation.x = -0.5 * Math.PI;

  const geometries = getGeometries(json);

  for (const geometry of geometries) {
    if (geometry.type === "LineString") {
      createLineFromLngLat(geometry.coordinates, radius, group);
    } else if (geometry.type === "MultiLineString") {
      for (const line of geometry.coordinates) {
        createLineFromLngLat(line, radius, group);
      }
    }
  }

  return group;
}

function createArcPoints(start, end, segments = 50) {
  const points = [];
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

function createArrowHead(points, material) {
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

function getLabelSize(label, location) {
  if (location.isHub) return { width: 240, height: 64 };

  const text = label.querySelector(".label-text");
  const width = Math.max(168, Math.min(260, text?.offsetWidth || 190));
  const height = Math.max(42, Math.min(72, text?.offsetHeight || 50));
  return { width, height };
}

function getLabelBox(item) {
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

function resolveLabelCollisions(items, width, height) {
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

          // Most dense robotics clusters are vertical on screen, so prefer vertical separation.
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
      // A weak spring keeps each label close to its city, while still allowing spread.
      item.x += (item.targetX - item.x) * 0.018;
      item.y += (item.targetY - item.y) * 0.028;
      item.x = Math.min(maxX, Math.max(minX, item.x));
      item.y = Math.min(maxY, Math.max(minY, item.y));
    }
  }
}

function positionLeader(label, anchorX, anchorY, labelX, labelY) {
  const leader = label.querySelector(".label-leader");
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

function updateLabels(camera) {
  const labels = [...labelsLayer.querySelectorAll(".office-label")];
  const width = host.clientWidth || OPTIONS.canvasSize;
  const height = host.clientHeight || OPTIONS.canvasSize;
  const centerX = width / 2;
  const centerY = height / 2;
  const visibleItems = [];

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

    const isHub = location.isHub;
    const angle = Math.atan2(anchorY - centerY, anchorX - centerX);
    const spread = isHub ? 14 : 0;
    const ringOffsetX = Math.cos(angle) * spread;
    const ringOffsetY = Math.sin(angle) * spread;
    const staggerY = 0;

    const size = getLabelSize(label, location);
    const targetX = anchorX + ringOffsetX;
    const targetY = anchorY + ringOffsetY + staggerY;
    const alignLeft = !isHub && targetX > width * 0.58;

    label.style.display = "block";
    label.classList.toggle("align-left", alignLeft);

    const cached = LABEL_LAYOUT_STATE.get(index);
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
      isHub: location.isHub,
    });
  });

  const hubItems = visibleItems.filter((item) => item.isHub);
  resolveLabelCollisions(hubItems, width, height);

  for (const item of visibleItems) {
    if (item.isHub) {
      const cached = LABEL_LAYOUT_STATE.get(item.index) || { x: item.x, y: item.y };
      cached.x += (item.x - cached.x) * 0.22;
      cached.y += (item.y - cached.y) * 0.22;
      LABEL_LAYOUT_STATE.set(item.index, cached);

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

function initOfficeGlobe() {
  createLabels();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 10;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(OPTIONS.canvasSize, OPTIONS.canvasSize);
  renderer.domElement.style.width = `${OPTIONS.canvasSize}px`;
  renderer.domElement.style.height = `${OPTIONS.canvasSize}px`;
  renderer.domElement.dataset.engine = "three.js r172";
  host.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = OPTIONS.autoRotate;
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

  const lineOffsetGroup = new THREE.Group();
  lineOffsetGroup.rotation.x = OPTIONS.offset.x || 0;
  lineOffsetGroup.rotation.y = OPTIONS.offset.y || 0;
  lineOffsetGroup.rotation.z = OPTIONS.offset.z || 0;

  const worldGroup = createWorldLines({ json: worldLines, radius: OPTIONS.globeRadius });
  lineOffsetGroup.add(worldGroup);
  scene.add(lineOffsetGroup);

  const officeArc = createOfficeArc();
  scene.add(officeArc);

  // 3D marker sphere at Shenzhen hub
  const hub = LOCATIONS.find((l) => l.isHub);
  let hubGlowMat = null;
  if (hub) {
    const hubPos = latLngToVector3(hub.lat, hub.lng, OPTIONS.globeRadius);
    const markerGeo = new THREE.SphereGeometry(0.16, 32, 32);
    const markerMat = new THREE.MeshBasicMaterial({ color: OPTIONS.markerColor });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.copy(hubPos);
    scene.add(marker);

    const glowGeo = new THREE.SphereGeometry(0.28, 32, 32);
    hubGlowMat = new THREE.MeshBasicMaterial({
      color: OPTIONS.markerColor,
      transparent: true,
      opacity: 0.28,
    });
    const glow = new THREE.Mesh(glowGeo, hubGlowMat);
    glow.position.copy(hubPos);
    scene.add(glow);
  }

  function animate(time = 0) {
    requestAnimationFrame(animate);
    updateLabels(camera);
    worldGroup.userData.update?.(time);
    if (hubGlowMat) {
      hubGlowMat.opacity = 0.18 + 0.2 * Math.abs(Math.sin(time * 0.0018));
    }
    renderer.render(scene, camera);
    controls.update();
  }

  animate();
}

initOfficeGlobe();
