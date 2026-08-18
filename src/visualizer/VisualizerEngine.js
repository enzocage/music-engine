/**
 * VisualizerEngine: GPU-Accelerated 3D Mathematical Visualization.
 * Uses Three.js with custom geometries, dynamic particle systems, phase trajectories,
 * 4D tesseract projections, cellular voxel grids, and hyper-dimensional deforming meshes
 * for all 22 sound synthesis engines.
 */
import * as THREE from 'three';

export class VisualizerEngine {
  constructor(canvasContainer, audioEngine) {
    this.container = canvasContainer;
    this.audioEngine = audioEngine;

    this.viewMode = 'interplay'; // 'interplay', 'matrix16', 'deepdive'
    this.selectedChannel = 0;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrameId = null;

    // View Groups
    this.interplayGroup = new THREE.Group();
    this.matrixGroup = new THREE.Group();
    this.deepDiveGroup = new THREE.Group();

    // Interplay 3D Objects
    this.hyperSphere = null;
    this.channelSatellites = [];

    // Deep-Dive Specific 3D Handles
    this.activeDeepDiveObjects = {};
    this.attractorHistory = [];
    this.cellularVoxels = [];
    this.fractalPoints = null;
    this.scannedMassMeshes = [];
    this.stochasticRibbon = null;
    this.terrainMesh = null;
    this.tesseractEdges = null;
    this.tesseractNodes = [];
    this.pulsarRings = [];
    this.vortexParticles = null;
    this.spectralPrismBars = [];

    // Camera interaction
    this.isDragging = false;
    this.prevMousePos = { x: 0, y: 0 };
    this.cameraRotation = { x: 0.35, y: 0.0 };
    this.cameraDistance = 38.0;

    this.initThree();
    this.buildInterplayView();
    this.buildMatrixView();
    this.buildDeepDiveView();
    this.setupEvents();
    this.animate();
  }

  initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || (window.innerHeight - 300);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x060814, 0.015);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.updateCameraTransform();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x060814, 1);
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 2.5);
    dirLight1.position.set(25, 45, 25);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf72585, 2.0);
    dirLight2.position.set(-25, -20, -25);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffb703, 1.5, 50);
    pointLight.position.set(0, 10, 0);
    this.scene.add(pointLight);

    this.scene.add(this.interplayGroup);
    this.scene.add(this.matrixGroup);
    this.scene.add(this.deepDiveGroup);

    this.matrixGroup.visible = false;
    this.deepDiveGroup.visible = false;
  }

  updateCameraTransform() {
    const x = this.cameraDistance * Math.sin(this.cameraRotation.y) * Math.cos(this.cameraRotation.x);
    const y = this.cameraDistance * Math.sin(this.cameraRotation.x);
    const z = this.cameraDistance * Math.cos(this.cameraRotation.y) * Math.cos(this.cameraRotation.x);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  setupEvents() {
    const el = this.renderer.domElement;

    el.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMousePos.x;
      const dy = e.clientY - this.prevMousePos.y;
      this.cameraRotation.y += dx * 0.006;
      this.cameraRotation.x = Math.max(-1.4, Math.min(1.4, this.cameraRotation.x + dy * 0.006));
      this.prevMousePos = { x: e.clientX, y: e.clientY };
      this.updateCameraTransform();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraDistance = Math.max(8.0, Math.min(90.0, this.cameraDistance + e.deltaY * 0.05));
      this.updateCameraTransform();
    }, { passive: false });

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setViewMode(mode, channelIdx = 0) {
    this.viewMode = mode;
    this.selectedChannel = channelIdx;

    this.interplayGroup.visible = (mode === 'interplay');
    this.matrixGroup.visible = (mode === 'matrix16');
    this.deepDiveGroup.visible = (mode === 'deepdive');

    if (mode === 'deepdive') {
      this.rebuildDeepDiveView(channelIdx);
    }
  }

  // --- View 1: Master Interplay & 16-Ch Hyper-Sphere ---
  buildInterplayView() {
    const sphereGeo = new THREE.IcosahedronGeometry(6.5, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x112244,
      emissive: 0x004488,
      emissiveIntensity: 0.6,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8
    });
    this.hyperSphere = new THREE.Mesh(sphereGeo, sphereMat);
    this.hyperSphere.basePositions = sphereGeo.attributes.position.array.slice();
    this.interplayGroup.add(this.hyperSphere);

    const coreGeo = new THREE.SphereGeometry(3.8, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    this.hyperSphere.add(new THREE.Mesh(coreGeo, coreMat));

    // 16 Orbital Channel Satellites
    this.channelSatellites = [];
    const radius = 17.0;
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const satGeo = new THREE.OctahedronGeometry(0.9, 1);
      const satMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.4,
        roughness: 0.3
      });
      const satMesh = new THREE.Mesh(satGeo, satMat);
      satMesh.position.set(x, 0, z);

      const ringGeo = new THREE.RingGeometry(1.1, 1.3, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      satMesh.add(ring);

      this.interplayGroup.add(satMesh);
      this.channelSatellites.push(satMesh);
    }

    const gridHelper = new THREE.GridHelper(50, 40, 0x00f0ff, 0x112244);
    gridHelper.position.y = -8;
    this.interplayGroup.add(gridHelper);
  }

  // --- View 2: 16-Channel 3D Matrix Overview ---
  buildMatrixView() {
    this.matrixWidgets = [];
    const cols = 4, rows = 4, spacing = 9.5;

    for (let i = 0; i < 16; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - (cols - 1) * 0.5) * spacing;
      const z = (row - (rows - 1) * 0.5) * spacing;

      const widgetGroup = new THREE.Group();
      widgetGroup.position.set(x, 0, z);

      const baseGeo = new THREE.CylinderGeometry(3.0, 3.2, 0.4, 16);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x0a1020, roughness: 0.5, metalness: 0.7 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = -2.0;
      widgetGroup.add(base);

      const shapeGeo = new THREE.TorusGeometry(1.5, 0.4, 16, 32);
      const shapeMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, wireframe: true });
      const shape = new THREE.Mesh(shapeGeo, shapeMat);
      widgetGroup.add(shape);

      this.matrixGroup.add(widgetGroup);
      this.matrixWidgets.push({ group: widgetGroup, shape: shape, material: shapeMat });
    }
  }

  // --- View 3: Single-Channel Deep-Dive 3D Math View ---
  buildDeepDiveView() {
    this.rebuildDeepDiveView(0);
  }

  rebuildDeepDiveView(channelIdx) {
    while (this.deepDiveGroup.children.length > 0) {
      this.deepDiveGroup.remove(this.deepDiveGroup.children[0]);
    }
    this.activeDeepDiveObjects = {};

    const ch = this.audioEngine.channels[channelIdx];
    const synthType = ch ? ch.synthTypeId : 'subtractive';
    const meta = ch ? ch.getSynthMeta() : { color: '#00f0ff' };
    const colorHex = parseInt(meta.color.replace('#', '0x'), 16);

    const bgGrid = new THREE.GridHelper(45, 30, colorHex, 0x112244);
    bgGrid.position.y = -7;
    this.deepDiveGroup.add(bgGrid);

    switch (synthType) {
      // 1. FM Torus Knot
      case 'fm': {
        const torusGeo = new THREE.TorusKnotGeometry(4.2, 1.3, 128, 32, 2, 3);
        const torusMat = new THREE.MeshStandardMaterial({ color: 0x7b2cbf, emissive: 0x3c096c, wireframe: true });
        const fmTorus = new THREE.Mesh(torusGeo, torusMat);
        this.deepDiveGroup.add(fmTorus);
        this.activeDeepDiveObjects.fmTorus = fmTorus;
        break;
      }

      // 2. Karplus-Strong Vibrating String
      case 'waveguide': {
        const stringGeo = new THREE.CylinderGeometry(0.18, 0.18, 22, 64, 64);
        stringGeo.rotateZ(Math.PI / 2);
        const stringMat = new THREE.MeshStandardMaterial({ color: 0x4cc9f0, emissive: 0x0077b6, wireframe: true });
        const stringMesh = new THREE.Mesh(stringGeo, stringMat);
        this.deepDiveGroup.add(stringMesh);
        this.activeDeepDiveObjects.stringMesh = stringMesh;
        break;
      }

      // 3. Modal Chladni Plate
      case 'modal': {
        const plateGeo = new THREE.PlaneGeometry(16, 16, 48, 48);
        plateGeo.rotateX(-Math.PI / 2);
        const plateMat = new THREE.MeshStandardMaterial({ color: 0x4361ee, emissive: 0x3f37c9, wireframe: true, side: THREE.DoubleSide });
        const chladniMesh = new THREE.Mesh(plateGeo, plateMat);
        chladniMesh.basePositions = plateGeo.attributes.position.array.slice();
        this.deepDiveGroup.add(chladniMesh);
        this.activeDeepDiveObjects.chladniMesh = chladniMesh;
        break;
      }

      // 4. Chaotic Attractors (Lorenz / Chua)
      case 'chaos': {
        const maxPoints = 700;
        const positions = new Float32Array(maxPoints * 3);
        const colors = new Float32Array(maxPoints * 3);
        const attrGeo = new THREE.BufferGeometry();
        attrGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        attrGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const attrMat = new THREE.PointsMaterial({ size: 0.4, vertexColors: true, transparent: true, opacity: 0.95 });
        const attractorPoints = new THREE.Points(attrGeo, attrMat);
        this.attractorHistory = [];
        this.deepDiveGroup.add(attractorPoints);
        this.activeDeepDiveObjects.attractorPoints = attractorPoints;
        break;
      }

      // 5. Additive Spinor Rings
      case 'additive': {
        const spinners = [];
        for (let k = 0; k < 16; k++) {
          const ringGeo = new THREE.TorusGeometry(1.0 + k * 0.4, 0.04, 8, 32);
          ringGeo.rotateX(Math.PI / 2);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0xffb703, wireframe: true, transparent: true, opacity: 0.45 });
          const ring = new THREE.Mesh(ringGeo, ringMat);

          const spinorGeo = new THREE.SphereGeometry(0.22, 8, 8);
          const spinorMat = new THREE.MeshBasicMaterial({ color: 0xfb8500 });
          const spinor = new THREE.Mesh(spinorGeo, spinorMat);
          ring.add(spinor);

          this.deepDiveGroup.add(ring);
          spinners.push({ ring, spinor, radius: 1.0 + k * 0.4 });
        }
        this.activeDeepDiveObjects.additiveSpinors = spinners;
        break;
      }

      // 6. Wavetable Waterfall
      case 'wavetable': {
        const wtGeo = new THREE.PlaneGeometry(16, 16, 32, 16);
        wtGeo.rotateX(-Math.PI / 3);
        const wtMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, wireframe: true, side: THREE.DoubleSide });
        const wavetableMesh = new THREE.Mesh(wtGeo, wtMat);
        this.deepDiveGroup.add(wavetableMesh);
        this.activeDeepDiveObjects.wavetableMesh = wavetableMesh;
        break;
      }

      // 7. Cellular Automata 3D Voxel Grid
      case 'cellular': {
        const voxels = [];
        const group = new THREE.Group();
        const boxGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        for (let i = 0; i < 32; i++) {
          const angle = (i / 32) * Math.PI * 2;
          const radius = 6.0;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const mat = new THREE.MeshStandardMaterial({ color: 0x06d6a0, emissive: 0x06d6a0, emissiveIntensity: 0.3, roughness: 0.3 });
          const mesh = new THREE.Mesh(boxGeo, mat);
          mesh.position.set(x, 0, z);
          group.add(mesh);
          voxels.push(mesh);
        }
        this.deepDiveGroup.add(group);
        this.activeDeepDiveObjects.cellularGroup = group;
        this.activeDeepDiveObjects.cellularVoxels = voxels;
        break;
      }

      // 8. Scanned Mass-Spring Mesh Lattice
      case 'scannedmesh': {
        const group = new THREE.Group();
        const massMeshes = [];
        const sphereGeo = new THREE.SphereGeometry(0.35, 12, 12);
        for (let i = 0; i < 16; i++) {
          const mat = new THREE.MeshStandardMaterial({ color: 0x118ab2, emissive: 0x073b4c, wireframe: false });
          const mesh = new THREE.Mesh(sphereGeo, mat);
          mesh.position.set((i - 7.5) * 1.1, 0, 0);
          group.add(mesh);
          massMeshes.push(mesh);
        }

        // Orbit scanner probe
        const probeGeo = new THREE.OctahedronGeometry(0.6, 0);
        const probeMat = new THREE.MeshBasicMaterial({ color: 0xffd166, wireframe: true });
        const probe = new THREE.Mesh(probeGeo, probeMat);
        group.add(probe);

        this.deepDiveGroup.add(group);
        this.activeDeepDiveObjects.scannedGroup = group;
        this.activeDeepDiveObjects.scannedMasses = massMeshes;
        this.activeDeepDiveObjects.scannedProbe = probe;
        break;
      }

      // 9. Fractal Julia & Mandelbrot Orbit Cloud
      case 'fractal': {
        const count = 600;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({ size: 0.45, vertexColors: true, transparent: true, opacity: 0.9 });
        const pts = new THREE.Points(geo, mat);
        this.deepDiveGroup.add(pts);
        this.activeDeepDiveObjects.fractalPoints = pts;
        break;
      }

      // 10. Neural Wave-Terrain 3D Landscape
      case 'neuralterrain': {
        const terrainGeo = new THREE.PlaneGeometry(18, 18, 40, 40);
        terrainGeo.rotateX(-Math.PI / 2.5);
        const terrainMat = new THREE.MeshStandardMaterial({ color: 0x8338ec, emissive: 0x3a0ca3, wireframe: true, side: THREE.DoubleSide });
        const terrain = new THREE.Mesh(terrainGeo, terrainMat);
        terrain.basePositions = terrainGeo.attributes.position.array.slice();

        // Laser scan head
        const headGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xff006e });
        const head = new THREE.Mesh(headGeo, headMat);

        this.deepDiveGroup.add(terrain);
        this.deepDiveGroup.add(head);
        this.activeDeepDiveObjects.terrainMesh = terrain;
        this.activeDeepDiveObjects.terrainHead = head;
        break;
      }

      // 11. Stochastic Gendyn Breakpoint Ribbon
      case 'stochasticgendyn': {
        const ribbonGeo = new THREE.BufferGeometry();
        const pos = new Float32Array(16 * 3);
        ribbonGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const ribbonMat = new THREE.LineBasicMaterial({ color: 0xff006e, linewidth: 3 });
        const ribbon = new THREE.Line(ribbonGeo, ribbonMat);

        // Elastic boundary planes
        const planeGeo = new THREE.PlaneGeometry(18, 8);
        const planeMat = new THREE.MeshBasicMaterial({ color: 0x3a0ca3, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
        const topPlane = new THREE.Mesh(planeGeo, planeMat);
        topPlane.position.y = 4.0;
        const botPlane = new THREE.Mesh(planeGeo, planeMat);
        botPlane.position.y = -4.0;

        this.deepDiveGroup.add(ribbon);
        this.deepDiveGroup.add(topPlane);
        this.deepDiveGroup.add(botPlane);
        this.activeDeepDiveObjects.gendynRibbon = ribbon;
        break;
      }

      // 12. Bowed String Stick-Slip
      case 'bowedstring': {
        const stringGeo = new THREE.CylinderGeometry(0.15, 0.15, 20, 32);
        stringGeo.rotateZ(Math.PI / 2);
        const stringMat = new THREE.MeshStandardMaterial({ color: 0xff5400, emissive: 0x9d0208, wireframe: true });
        const string = new THREE.Mesh(stringGeo, stringMat);

        // Bow Indicator
        const bowGeo = new THREE.BoxGeometry(0.4, 6.0, 0.4);
        const bowMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.2 });
        const bow = new THREE.Mesh(bowGeo, bowMat);
        bow.position.set(-3.0, 0, 0);

        this.deepDiveGroup.add(string);
        this.deepDiveGroup.add(bow);
        this.activeDeepDiveObjects.bowedString = string;
        this.activeDeepDiveObjects.bow = bow;
        break;
      }

      // 13. Vortex Fluidics & Swirling Eddies
      case 'vortexfluid': {
        const pCount = 250;
        const pos = new Float32Array(pCount * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ size: 0.5, color: 0x3a86ff, transparent: true, opacity: 0.85 });
        const pts = new THREE.Points(geo, mat);

        // Obstacle cylinder
        const cylGeo = new THREE.CylinderGeometry(1.2, 1.2, 10, 16);
        const cylMat = new THREE.MeshStandardMaterial({ color: 0x03045e, wireframe: true });
        const cyl = new THREE.Mesh(cylGeo, cylMat);
        cyl.position.set(-6, 0, 0);

        this.deepDiveGroup.add(pts);
        this.deepDiveGroup.add(cyl);
        this.activeDeepDiveObjects.vortexPoints = pts;
        this.activeDeepDiveObjects.vortexCyl = cyl;
        break;
      }

      // 14. Spectral Freeze Prism Bars
      case 'spectralfreeze': {
        const group = new THREE.Group();
        const bars = [];
        const barGeo = new THREE.BoxGeometry(0.4, 4.0, 0.4);
        for (let k = 0; k < 24; k++) {
          const mat = new THREE.MeshStandardMaterial({ color: 0x00b4d8, emissive: 0x0077b6, wireframe: false });
          const bar = new THREE.Mesh(barGeo, mat);
          bar.position.set((k - 11.5) * 0.7, 0, 0);
          group.add(bar);
          bars.push(bar);
        }
        this.deepDiveGroup.add(group);
        this.activeDeepDiveObjects.spectralBars = bars;
        break;
      }

      // 15. Pulsar Wavelet Emission Cone
      case 'pulsartrain': {
        const group = new THREE.Group();
        const rings = [];
        for (let i = 0; i < 8; i++) {
          const rGeo = new THREE.TorusGeometry(1.0 + i * 1.2, 0.08, 12, 32);
          const rMat = new THREE.MeshBasicMaterial({ color: 0xffbe0b, wireframe: true, transparent: true, opacity: 0.8 });
          const ring = new THREE.Mesh(rGeo, rMat);
          ring.position.z = -i * 2.0;
          group.add(ring);
          rings.push(ring);
        }
        this.deepDiveGroup.add(group);
        this.activeDeepDiveObjects.pulsarRings = rings;
        break;
      }

      // 16. Polytopic 4D Hypercube Vector (Tesseract)
      case 'polytopicvector': {
        const group = new THREE.Group();
        const nodes = [];
        const sphereGeo = new THREE.SphereGeometry(0.35, 12, 12);
        for (let i = 0; i < 16; i++) {
          const mat = new THREE.MeshStandardMaterial({ color: 0x9d4edd, emissive: 0x7b2cbf, wireframe: false });
          const node = new THREE.Mesh(sphereGeo, mat);
          group.add(node);
          nodes.push(node);
        }

        // Tesseract wireframe edges
        const edgeIndices = [
          // 4D hypercube connections between 16 vertices
          0,1, 1,3, 3,2, 2,0,  4,5, 5,7, 7,6, 6,4,  0,4, 1,5, 2,6, 3,7,
          8,9, 9,11, 11,10, 10,8,  12,13, 13,15, 15,14, 14,12,  8,12, 9,13, 10,14, 11,15,
          0,8, 1,9, 2,10, 3,11,  4,12, 5,13, 6,14, 7,15
        ];
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgeIndices.length * 3), 3));
        const lineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.6 });
        const edges = new THREE.LineSegments(lineGeo, lineMat);
        group.add(edges);

        this.deepDiveGroup.add(group);
        this.activeDeepDiveObjects.tesseractGroup = group;
        this.activeDeepDiveObjects.tesseractNodes = nodes;
        this.activeDeepDiveObjects.tesseractEdges = edges;
        this.activeDeepDiveObjects.edgeIndices = edgeIndices;
        break;
      }

      // Default & Classic
      default: {
        const oscGeo = new THREE.IcosahedronGeometry(4.5, 4);
        const oscMat = new THREE.MeshStandardMaterial({ color: colorHex, wireframe: true });
        const mesh = new THREE.Mesh(oscGeo, oscMat);
        this.deepDiveGroup.add(mesh);
        this.activeDeepDiveObjects.defaultMesh = mesh;
        break;
      }
    }
  }

  // --- Real-Time Render & Animation Loop ---
  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    const telemetry = this.audioEngine.getTelemetry();
    const time = performance.now() * 0.001;

    if (this.viewMode === 'interplay') {
      this.updateInterplayAnimation(telemetry, time);
    } else if (this.viewMode === 'matrix16') {
      this.updateMatrixAnimation(telemetry, time);
    } else if (this.viewMode === 'deepdive') {
      this.updateDeepDiveAnimation(telemetry, time);
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateInterplayAnimation(telemetry, time) {
    if (!this.hyperSphere) return;

    this.hyperSphere.rotation.y += 0.004;
    this.hyperSphere.rotation.x = Math.sin(time * 0.5) * 0.2;

    const posAttr = this.hyperSphere.geometry.attributes.position;
    const base = this.hyperSphere.basePositions;
    const count = posAttr.count;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const bx = base[idx];
      const by = base[idx + 1];
      const bz = base[idx + 2];

      const chIdx = i % 16;
      const chPeak = telemetry.channels[chIdx] ? telemetry.channels[chIdx].peak : 0;
      const chWave = (telemetry.channels[chIdx] && telemetry.channels[chIdx].recentWave) ? telemetry.channels[chIdx].recentWave[i % 128] : 0;

      const displacement = 1.0 + chPeak * 0.8 + chWave * 0.4 + Math.sin(bx * 0.5 + time * 3.0) * 0.08;
      posAttr.setXYZ(i, bx * displacement, by * displacement, bz * displacement);
    }
    posAttr.needsUpdate = true;

    telemetry.channels.forEach((ch, idx) => {
      const sat = this.channelSatellites[idx];
      if (!sat) return;

      const scale = 1.0 + ch.peak * 2.5;
      sat.scale.set(scale, scale, scale);
      sat.material.emissiveIntensity = 0.3 + ch.peak * 2.0;

      if (ch.meta && ch.meta.color) {
        sat.material.color.set(ch.meta.color);
        sat.material.emissive.set(ch.meta.color);
      }

      const angle = (idx / 16) * Math.PI * 2 + time * 0.15;
      const r = 17.0 + Math.sin(time * 2.0 + idx) * (ch.peak * 3.0);
      sat.position.x = Math.cos(angle) * r;
      sat.position.z = Math.sin(angle) * r;
      sat.position.y = Math.sin(time * 3.0 + idx) * 2.0;
      sat.rotation.y += 0.02;
    });
  }

  updateMatrixAnimation(telemetry, time) {
    this.matrixWidgets.forEach((w, idx) => {
      const ch = telemetry.channels[idx];
      if (!ch) return;

      const scale = 1.0 + ch.peak * 1.5;
      w.shape.scale.set(scale, scale, scale);
      w.shape.rotation.x += 0.01 + ch.peak * 0.05;
      w.shape.rotation.y += 0.015 + ch.peak * 0.08;

      if (ch.meta && ch.meta.color) {
        w.material.color.set(ch.meta.color);
      }
    });
  }

  updateDeepDiveAnimation(telemetry, time) {
    const ch = telemetry.channels[this.selectedChannel];
    if (!ch) return;
    const math = ch.math || {};
    const objs = this.activeDeepDiveObjects;

    // 1. FM Torus
    if (objs.fmTorus) {
      objs.fmTorus.rotation.x += 0.01;
      objs.fmTorus.rotation.y += 0.015;
      const modScale = 1.0 + (math.modIndex || 0) * 0.15 + ch.peak * 0.5;
      objs.fmTorus.scale.set(modScale, modScale, modScale);
    }

    // 2. Waveguide String
    if (objs.stringMesh && math.stringProfile) {
      const posAttr = objs.stringMesh.geometry.attributes.position;
      const profile = math.stringProfile;
      for (let i = 0; i < posAttr.count; i++) {
        const waveDisp = profile[i % profile.length] * 4.0;
        posAttr.setY(i, waveDisp);
      }
      posAttr.needsUpdate = true;
    }

    // 3. Chladni Plate
    if (objs.chladniMesh) {
      const posAttr = objs.chladniMesh.geometry.attributes.position;
      const base = objs.chladniMesh.basePositions;
      for (let i = 0; i < posAttr.count; i++) {
        const idx = i * 3;
        const bx = base[idx], bz = base[idx + 2];
        const w = Math.sin(3 * bx * 0.3) * Math.sin(5 * bz * 0.3) - Math.sin(5 * bx * 0.3) * Math.sin(3 * bz * 0.3);
        posAttr.setY(i, w * ch.peak * 3.5);
      }
      posAttr.needsUpdate = true;
      objs.chladniMesh.rotation.y += 0.005;
    }

    // 4. Chaos Strange Attractor
    if (objs.attractorPoints && math.state) {
      const [x, y, z] = math.state;
      this.attractorHistory.push({ x: x * 0.4, y: y * 0.4, z: (z - 25) * 0.4 });
      if (this.attractorHistory.length > 700) this.attractorHistory.shift();

      const posAttr = objs.attractorPoints.geometry.attributes.position;
      const colAttr = objs.attractorPoints.geometry.attributes.color;

      for (let i = 0; i < this.attractorHistory.length; i++) {
        const pt = this.attractorHistory[i];
        posAttr.setXYZ(i, pt.x, pt.y, pt.z);
        const p = i / this.attractorHistory.length;
        colAttr.setXYZ(i, 0.2 + p * 0.8, 1.0 - p * 0.5, p);
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      objs.attractorPoints.rotation.y += 0.01;
    }

    // 5. Cellular Automata Voxels
    if (objs.cellularVoxels && math.cells) {
      objs.cellularGroup.rotation.y += 0.008;
      math.cells.forEach((c, i) => {
        if (objs.cellularVoxels[i]) {
          const v = objs.cellularVoxels[i];
          const scale = c ? (1.0 + ch.peak * 1.5) : 0.2;
          v.scale.set(scale, scale, scale);
          v.material.emissiveIntensity = c ? (0.6 + ch.peak * 1.5) : 0.05;
        }
      });
    }

    // 6. Scanned Mass-Spring Mesh
    if (objs.scannedMasses && math.positions) {
      math.positions.forEach((pos, i) => {
        if (objs.scannedMasses[i]) {
          objs.scannedMasses[i].position.y = pos * 3.5;
        }
      });
      if (objs.scannedProbe && math.scanPos !== undefined) {
        objs.scannedProbe.position.x = (math.scanPos - 7.5) * 1.1;
        objs.scannedProbe.position.y = Math.sin(time * 8.0) * 1.5;
        objs.scannedProbe.rotation.y += 0.05;
      }
    }

    // 7. Fractal Julia Orbit Point Cloud
    if (objs.fractalPoints && math.lastZr !== undefined) {
      const posAttr = objs.fractalPoints.geometry.attributes.position;
      const colAttr = objs.fractalPoints.geometry.attributes.color;
      const count = posAttr.count;

      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + time * 0.5;
        const r = 4.0 + Math.sin(a * 5.0 + math.lastZr) * 2.0;
        const x = Math.cos(a) * r;
        const y = Math.sin(a * 3.0 + math.lastZi) * (1.5 + ch.peak * 2.0);
        const z = Math.sin(a) * r;

        posAttr.setXYZ(i, x, y, z);
        colAttr.setXYZ(i, 0.9, (math.lastEscape / 12.0), 0.2);
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      objs.fractalPoints.rotation.y += 0.006;
    }

    // 8. Neural Wave-Terrain Landscape
    if (objs.terrainMesh) {
      const posAttr = objs.terrainMesh.geometry.attributes.position;
      const base = objs.terrainMesh.basePositions;
      for (let i = 0; i < posAttr.count; i++) {
        const idx = i * 3;
        const bx = base[idx], bz = base[idx + 2];
        const h = Math.sin(bx * 0.5 + time * 2.0) * Math.cos(bz * 0.5) * (1.0 + ch.peak * 1.5);
        posAttr.setY(i, h);
      }
      posAttr.needsUpdate = true;

      if (objs.terrainHead && math.orbitX !== undefined) {
        objs.terrainHead.position.set(math.orbitX * 3.0, (math.orbitZ || 0) * 2.0 + 1.0, math.orbitY * 3.0);
      }
    }

    // 9. Stochastic Gendyn Ribbon
    if (objs.gendynRibbon && math.xPoints && math.yPoints) {
      const posAttr = objs.gendynRibbon.geometry.attributes.position;
      const n = math.xPoints.length;
      for (let i = 0; i < n; i++) {
        const x = (i - n * 0.5) * 1.8;
        const y = math.yPoints[i] * 5.0;
        const z = Math.sin(i + time * 3.0) * 1.5;
        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
    }

    // 10. Bowed String
    if (objs.bowedString) {
      objs.bowedString.rotation.y = Math.sin(time * 4.0) * (0.05 + ch.peak * 0.15);
      if (objs.bow) {
        objs.bow.position.y = (math.isSticking ? 0.8 : -0.8) * Math.sin(time * 12.0) * (ch.peak + 0.2);
      }
    }

    // 11. Vortex Fluidics
    if (objs.vortexPoints) {
      const posAttr = objs.vortexPoints.geometry.attributes.position;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        const progress = (i / count + time * 0.4) % 1.0;
        const x = -6.0 + progress * 16.0;
        const swirl = Math.sin(progress * 12.0 + (i % 2 === 0 ? 0 : Math.PI)) * (1.0 + progress * 3.0);
        const y = swirl * (0.8 + ch.peak * 1.5);
        const z = Math.cos(progress * 12.0) * swirl * 0.5;
        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
    }

    // 12. Spectral Freeze Bars
    if (objs.spectralBars && math.binGains) {
      math.binGains.forEach((g, k) => {
        if (objs.spectralBars[k]) {
          const h = Math.max(0.2, g * 12.0 + ch.peak * 2.0);
          objs.spectralBars[k].scale.y = h;
          objs.spectralBars[k].position.y = h * 0.5 - 2.0;
          objs.spectralBars[k].material.emissiveIntensity = math.freezeHold > 0.5 ? 0.8 : 0.3;
        }
      });
    }

    // 13. Pulsar Wavelet Rings
    if (objs.pulsarRings) {
      objs.pulsarRings.forEach((ring, i) => {
        const p = ((math.pulsarPhase || 0) + i * 0.125) % 1.0;
        const scale = 0.5 + p * 2.5 + ch.peak * 1.5;
        ring.scale.set(scale, scale, 1.0);
        ring.material.opacity = (1.0 - p) * 0.9;
        ring.rotation.z += 0.02;
      });
    }

    // 14. Polytopic 4D Tesseract (Hypercube)
    if (objs.tesseractNodes && math.rotatedVertices) {
      objs.tesseractGroup.rotation.y += 0.005;
      objs.tesseractGroup.rotation.x += 0.003;

      // 3D stereographic perspective projection of 4D points
      const d = 2.5; // 4D camera distance
      const proj3D = [];

      for (let i = 0; i < 16; i++) {
        const [x, y, z, w] = math.rotatedVertices[i];
        const factor = 4.0 / (d - w * 0.5);
        const px = x * factor;
        const py = y * factor;
        const pz = z * factor;
        proj3D.push([px, py, pz]);

        if (objs.tesseractNodes[i]) {
          const node = objs.tesseractNodes[i];
          node.position.set(px, py, pz);
          const weight = math.vertexWeights ? math.vertexWeights[i] : 0.06;
          const nScale = 0.6 + weight * 4.0 + ch.peak * 1.5;
          node.scale.set(nScale, nScale, nScale);
          node.material.emissiveIntensity = 0.2 + weight * 2.0;
        }
      }

      if (objs.tesseractEdges && objs.edgeIndices) {
        const posAttr = objs.tesseractEdges.geometry.attributes.position;
        const indices = objs.edgeIndices;
        for (let k = 0; k < indices.length; k++) {
          const vIdx = indices[k];
          const [px, py, pz] = proj3D[vIdx];
          posAttr.setXYZ(k, px, py, pz);
        }
        posAttr.needsUpdate = true;
      }
    }

    // Default Oscilloscope
    if (objs.defaultMesh) {
      objs.defaultMesh.rotation.x += 0.01;
      objs.defaultMesh.rotation.y += 0.015;
      const s = 1.0 + ch.peak * 1.2;
      objs.defaultMesh.scale.set(s, s, s);
    }
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
