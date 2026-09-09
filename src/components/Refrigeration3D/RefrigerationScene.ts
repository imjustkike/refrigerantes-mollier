import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ComponentInfo } from './ComponentDetailsCard';

export interface SceneOptions {
  theme: 'dark' | 'light';
  viewMode: 'standard' | 'thermal' | 'xray';
  isFlowing: boolean;
  flowSpeed: number;
}

export interface CycleThermodynamics {
  fluid: string;
  p_evap: number; // bar
  t_evap: number; // °C
  p_cond: number; // bar
  t_cond: number; // °C
  t_discharge?: number; // °C
  t_subcooling?: number; // K
  t_superheat?: number; // K
  cop?: number;
  cop_heat?: number;
  q_evap_kj?: number;
  w_comp_kj?: number;
  q_cond_kj?: number;
  compression_ratio?: number;
  v_suction_m3_kg?: number;
  v_discharge_m3_kg?: number;
  delta_v_m3_kg?: number;
  v_ratio?: number;
  energy_balance_err?: number;
}

/**
 * Utility to round off sharp polygonal waypoints into smooth filleted curves (like copper pipe benders)
 */
function createFilletedCurvePoints(waypoints: THREE.Vector3[], bendRadius = 0.5, arcSamples = 8): THREE.Vector3[] {
  if (waypoints.length < 3) return waypoints;

  const result: THREE.Vector3[] = [];
  result.push(waypoints[0].clone());

  for (let i = 1; i < waypoints.length - 1; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const next = waypoints[i + 1];

    const vPrev = new THREE.Vector3().subVectors(prev, curr);
    const vNext = new THREE.Vector3().subVectors(next, curr);

    const lenPrev = vPrev.length();
    const lenNext = vNext.length();

    if (lenPrev < 0.001 || lenNext < 0.001) {
      result.push(curr.clone());
      continue;
    }

    const r = Math.min(bendRadius, lenPrev * 0.45, lenNext * 0.45);
    const startPoint = new THREE.Vector3().addVectors(curr, vPrev.clone().normalize().multiplyScalar(r));
    const endPoint = new THREE.Vector3().addVectors(curr, vNext.clone().normalize().multiplyScalar(r));

    // Quadratic Bézier curve through the corner
    const qCurve = new THREE.QuadraticBezierCurve3(startPoint, curr, endPoint);
    const curvePoints = qCurve.getPoints(arcSamples);

    // Append curve points (avoiding duplicate start point if already at end)
    for (let j = 0; j < curvePoints.length; j++) {
      result.push(curvePoints[j]);
    }
  }

  result.push(waypoints[waypoints.length - 1].clone());
  return result;
}

export class RefrigerationSceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private animFrameId: number | null = null;
  private isDestroyed = false;

  // Interactive objects & raycasting
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private interactiveMeshes: { mesh: THREE.Object3D; id: string }[] = [];
  private hoveredMesh: THREE.Object3D | null = null;

  // Dynamic animated parts
  private fans: THREE.Object3D[] = [];
  private flowParticles: THREE.Points | null = null;
  private particleSplinePoints: THREE.Vector3[] = [];
  private particleProgresses: Float32Array = new Float32Array(0);

  // Heat flow visual indicators
  private heatArrowsOut: THREE.Object3D[] = [];
  private heatArrowsIn: THREE.Object3D[] = [];

  // Options & Data
  private options: SceneOptions;
  private thermoData: CycleThermodynamics;
  private onSelectComponent: (info: ComponentInfo | null) => void;

  constructor(
    container: HTMLElement,
    options: SceneOptions,
    thermoData: CycleThermodynamics,
    onSelectComponent: (info: ComponentInfo | null) => void
  ) {
    this.container = container;
    this.options = options;
    this.thermoData = thermoData;
    this.onSelectComponent = onSelectComponent;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.updateBackgroundColor();

    // 2. Camera setup
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 3.5, 14.5);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.sortObjects = true;
    container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 30;
    this.controls.minDistance = 3;
    this.controls.target.set(0.5, 0.2, 0);

    // 5. Lighting
    this.setupLighting();

    // 6. Build ground and loop
    this.buildGroundAndGrid();
    this.buildRefrigerationLoop();

    // 7. Event listeners
    this.setupEvents();

    // 8. Start loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  private updateBackgroundColor() {
    if (this.options.theme === 'dark') {
      this.scene.background = new THREE.Color('#0e1117');
      this.scene.fog = new THREE.FogExp2(0x0e1117, 0.025);
    } else {
      this.scene.background = new THREE.Color('#f0f4f8');
      this.scene.fog = new THREE.FogExp2(0xf0f4f8, 0.025);
    }
  }

  private setupLighting() {
    const ambientColor = this.options.theme === 'dark' ? 0x283042 : 0xedf0f7;
    const ambient = new THREE.AmbientLight(ambientColor, 1.5);
    this.scene.add(ambient);

    // Key Directional Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
    keyLight.position.set(8, 12, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 35;
    const d = 10;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // Fill Light
    const fillLight = new THREE.DirectionalLight(0x90caf9, 0.7);
    fillLight.position.set(-10, 6, -8);
    this.scene.add(fillLight);

    // Cold accent light on Evaporator
    const coldAccent = new THREE.PointLight(0x00d2ff, 1.8, 14);
    coldAccent.position.set(-2.5, 3.5, 1.5);
    this.scene.add(coldAccent);

    // Hot accent light on Condenser
    const hotAccent = new THREE.PointLight(0xff3d00, 2.0, 14);
    hotAccent.position.set(2.5, -1.0, 1.5);
    this.scene.add(hotAccent);
  }

  private buildGroundAndGrid() {
    const groundGeo = new THREE.PlaneGeometry(35, 35);
    const groundMat = new THREE.ShadowMaterial({
      opacity: this.options.theme === 'dark' ? 0.4 : 0.15,
      depthWrite: false,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3.8;
    ground.receiveShadow = true;
    ground.renderOrder = 0;
    this.scene.add(ground);

    const gridColor1 = this.options.theme === 'dark' ? 0x222938 : 0xd1d9e6;
    const gridColor2 = this.options.theme === 'dark' ? 0x161b26 : 0xe4ebf5;
    const grid = new THREE.GridHelper(30, 30, gridColor1, gridColor2);
    grid.position.y = -3.79;
    grid.renderOrder = 0;
    this.scene.add(grid);
  }

  // ==========================================
  // 3D REFRIGERATION CIRCUIT BUILDER
  // ==========================================
  private buildRefrigerationLoop() {
    const isThermal = this.options.viewMode === 'thermal';
    const isXray = this.options.viewMode === 'xray';
    const shellOpacity = isXray ? 0.35 : 1.0;
    const transparent = isXray;
    const depthWrite = !isXray;

    // Layout coordinates
    const posCompressor = new THREE.Vector3(-4.2, -2.2, 0);
    const posCondenser = new THREE.Vector3(1.8, -1.2, 0);
    const posReceiver = new THREE.Vector3(1.8, -3.1, 0);
    const posExpValve = new THREE.Vector3(4.5, 2.5, 0);
    const posEvaporator = new THREE.Vector3(-1.8, 2.5, 0);

    // 1. Compressor
    this.buildCompressor(posCompressor, shellOpacity, transparent, depthWrite, isXray);

    // 2. Condenser
    this.buildCondenser(posCondenser, isXray);

    // 3. Liquid Receiver
    this.buildLiquidReceiver(posReceiver, shellOpacity, transparent, depthWrite, isXray);

    // 4. Thermostatic Expansion Valve
    this.buildExpansionValve(posExpValve, shellOpacity, transparent, depthWrite);

    // 5. Evaporator
    this.buildEvaporator(posEvaporator, isXray);

    // 6. Smooth Curved Piping Circuit (Always solid and high priority in X-Ray)
    this.buildPipingCircuit(posCompressor, posCondenser, posReceiver, posExpValve, posEvaporator, isThermal, isXray);

    // 7. Animated Flow Particles
    this.buildFlowParticles();
  }

  // --- 1. COMPRESSOR ---
  private buildCompressor(
    pos: THREE.Vector3,
    opacity: number,
    transparent: boolean,
    depthWrite: boolean,
    isXray: boolean
  ) {
    const compGroup = new THREE.Group();
    compGroup.position.copy(pos);

    // Body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: isXray ? 0x22c55e : 0x1b7340,
      metalness: 0.6,
      roughness: 0.35,
      opacity,
      transparent,
      depthWrite,
      side: isXray ? THREE.DoubleSide : THREE.FrontSide,
    });

    const bodyGeo = new THREE.CylinderGeometry(1.0, 1.0, 2.2, 32);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    body.castShadow = !isXray;
    body.receiveShadow = true;
    compGroup.add(body);

    // Bell end
    const bellGeo = new THREE.SphereGeometry(1.0, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const bell = new THREE.Mesh(bellGeo, bodyMat);
    bell.rotation.z = -Math.PI / 2;
    bell.position.x = -1.1;
    compGroup.add(bell);

    // Cylinder Head
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x145a32,
      metalness: 0.7,
      roughness: 0.3,
      opacity: isXray ? 0.45 : 1.0,
      transparent,
      depthWrite,
    });
    const headGeo = new THREE.BoxGeometry(1.2, 1.4, 1.4);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0.6, 0.4, 0);
    head.castShadow = !isXray;
    compGroup.add(head);

    // Cooling fins
    const finMat = new THREE.MeshStandardMaterial({
      color: 0x114627,
      metalness: 0.5,
      roughness: 0.4,
      opacity: isXray ? 0.3 : 1.0,
      transparent,
      depthWrite,
    });
    for (let i = -0.7; i <= 0.4; i += 0.22) {
      const finGeo = new THREE.TorusGeometry(1.08, 0.04, 8, 32);
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.rotation.y = Math.PI / 2;
      fin.position.x = i;
      compGroup.add(fin);
    }

    // Terminal Box
    const tBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, opacity, transparent, depthWrite })
    );
    tBox.position.set(-0.2, 1.15, 0.4);
    compGroup.add(tBox);

    // Mounting Base
    const feetMat = new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.8, roughness: 0.4, opacity, transparent, depthWrite });
    const foot1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.4), feetMat);
    foot1.position.set(0, -1.05, 0.7);
    compGroup.add(foot1);

    const foot2 = foot1.clone();
    foot2.position.z = -0.7;
    compGroup.add(foot2);

    // Valves
    const valveBrass = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
    const suctionValve = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.6, 16), valveBrass);
    suctionValve.position.set(-1.1, 0.5, 0.6);
    compGroup.add(suctionValve);

    const dischargeValve = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.6, 16), valveBrass);
    dischargeValve.position.set(1.1, 0.8, 0);
    compGroup.add(dischargeValve);

    this.scene.add(compGroup);
    this.registerInteractive(compGroup, 'compressor');
  }

  // --- 2. CONDENSER ---
  private buildCondenser(
    pos: THREE.Vector3,
    isXray: boolean
  ) {
    const condGroup = new THREE.Group();
    condGroup.position.copy(pos);

    // Open Industrial Sheet Metal Chassis (Top, Bottom, Left, Right panels)
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x546e7a,
      metalness: 0.6,
      roughness: 0.4,
      opacity: isXray ? 0.35 : 1.0,
      transparent: isXray,
      depthWrite: !isXray,
    });

    // Top & Bottom panels
    const topPanel = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.06, 0.75), chassisMat);
    topPanel.position.set(0, 1.1, 0);
    condGroup.add(topPanel);

    const bottomPanel = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.06, 0.75), chassisMat);
    bottomPanel.position.set(0, -1.1, 0);
    condGroup.add(bottomPanel);

    // Side header plates
    const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.2, 0.75), chassisMat);
    leftPanel.position.set(-2.15, 0, 0);
    condGroup.add(leftPanel);

    const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.2, 0.75), chassisMat);
    rightPanel.position.set(2.15, 0, 0);
    condGroup.add(rightPanel);

    // Internal copper tubes
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xd85c35,
      metalness: 0.85,
      roughness: 0.25,
      emissive: isXray ? 0xd85c35 : 0x000000,
      emissiveIntensity: isXray ? 0.25 : 0.0,
    });

    const tubeRadius = 0.08;
    const numRows = 5;
    for (let r = 0; r < numRows; r++) {
      const y = -0.8 + r * 0.4;
      const straightGeo = new THREE.CylinderGeometry(tubeRadius, tubeRadius, 3.6, 16);
      const tube = new THREE.Mesh(straightGeo, copperMat);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(0, y, 0.15);
      condGroup.add(tube);

      if (r < numRows - 1) {
        const uBend = new THREE.Mesh(new THREE.TorusGeometry(0.2, tubeRadius, 12, 16, Math.PI), copperMat);
        const isRight = r % 2 === 0;
        uBend.position.set(isRight ? 1.8 : -1.8, y + 0.2, 0.15);
        uBend.rotation.z = isRight ? -Math.PI / 2 : Math.PI / 2;
        condGroup.add(uBend);
      }
    }

    // Aluminum Cooling Fins Pack
    const finMat = new THREE.MeshStandardMaterial({
      color: 0xb0bec5,
      metalness: 0.7,
      roughness: 0.3,
      opacity: isXray ? 0.25 : 0.85,
      transparent: true,
      depthWrite: false,
    });
    for (let f = -1.6; f <= 1.6; f += 0.14) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.8, 0.4), finMat);
      fin.position.set(f, 0, 0.15);
      condGroup.add(fin);
    }

    // 2 Realistic Industrial Axial Fans (Prominently mounted and fully visible in all modes)
    this.createRealisticAxialFan(condGroup, new THREE.Vector3(-0.95, 0, -0.22), 0.78, isXray);
    this.createRealisticAxialFan(condGroup, new THREE.Vector3(0.95, 0, -0.22), 0.78, isXray);

    // Heat Out Arrows
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 3; i++) {
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 16), arrowMat);
      arrow.rotation.z = -Math.PI / 2;
      arrow.position.set(2.8 + i * 0.5, -0.2 + (i - 1) * 0.3, 0);
      condGroup.add(arrow);
      this.heatArrowsOut.push(arrow);
    }

    this.scene.add(condGroup);
    this.registerInteractive(condGroup, 'condenser');
  }

  // --- 3. LIQUID RECEIVER (CALDERÍN) ---
  private buildLiquidReceiver(
    pos: THREE.Vector3,
    opacity: number,
    transparent: boolean,
    depthWrite: boolean,
    isXray: boolean
  ) {
    const recvGroup = new THREE.Group();
    recvGroup.position.copy(pos);

    const tankMat = new THREE.MeshStandardMaterial({
      color: isXray ? 0xef4444 : 0xb71c1c,
      metalness: 0.5,
      roughness: 0.35,
      opacity,
      transparent,
      depthWrite,
      side: isXray ? THREE.DoubleSide : THREE.FrontSide,
    });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.6, 24), tankMat);
    body.rotation.z = Math.PI / 2;
    recvGroup.add(body);

    const capGeo = new THREE.SphereGeometry(0.45, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const capL = new THREE.Mesh(capGeo, tankMat);
    capL.rotation.z = Math.PI / 2;
    capL.position.x = -1.3;
    recvGroup.add(capL);

    const capR = new THREE.Mesh(capGeo, tankMat);
    capR.rotation.z = -Math.PI / 2;
    capR.position.x = 1.3;
    recvGroup.add(capR);

    // Sight Glass with visible liquid column inside in X-Ray
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x4fc3f7,
      transmission: 0.85,
      roughness: 0.1,
      ior: 1.5,
    });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 16), glassMat);
    glass.rotation.x = Math.PI / 2;
    glass.position.set(0.2, 0.2, 0.42);
    recvGroup.add(glass);

    // Internal liquid core in X-Ray
    if (isXray) {
      const liquidCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.38, 2.4, 16),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.7, emissive: 0xf59e0b, emissiveIntensity: 0.3 })
      );
      liquidCore.rotation.z = Math.PI / 2;
      recvGroup.add(liquidCore);
    }

    const valveMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 });
    const inletValve = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 16), valveMat);
    inletValve.position.set(-0.8, 0.55, 0);
    recvGroup.add(inletValve);

    const outletValve = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 16), valveMat);
    outletValve.position.set(0.8, 0.55, 0);
    recvGroup.add(outletValve);

    this.scene.add(recvGroup);
    this.registerInteractive(recvGroup, 'receiver');
  }

  // --- 4. THERMOSTATIC EXPANSION VALVE (TXV / VET) ---
  private buildExpansionValve(
    pos: THREE.Vector3,
    opacity: number,
    transparent: boolean,
    depthWrite: boolean
  ) {
    const valveGroup = new THREE.Group();
    valveGroup.position.copy(pos);

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.2,
      opacity,
      transparent,
      depthWrite,
    });

    const stainlessMat = new THREE.MeshStandardMaterial({
      color: 0xdcdde1,
      metalness: 0.9,
      roughness: 0.15,
      opacity,
      transparent,
      depthWrite,
    });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.55, 16), brassMat);
    valveGroup.add(body);

    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.35, 0.28, 24), stainlessMat);
    head.position.y = 0.42;
    valveGroup.add(head);

    const headDome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), stainlessMat);
    headDome.position.y = 0.56;
    valveGroup.add(headDome);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 16), brassMat);
    stem.position.y = -0.42;
    valveGroup.add(stem);

    // Smooth Capillary Tube
    const capillaryMat = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.8 });
    const capilCurvePoints = [
      new THREE.Vector3(0, 0.65, 0),
      new THREE.Vector3(-0.4, 0.9, 0.2),
      new THREE.Vector3(-1.4, 1.05, -0.1),
      new THREE.Vector3(-2.8, 1.15, 0.1),
      new THREE.Vector3(-3.8, 1.05, 0),
    ];
    const smoothCapil = createFilletedCurvePoints(capilCurvePoints, 0.3, 6);
    const capilCurve = new THREE.CatmullRomCurve3(smoothCapil, false, 'catmullrom', 0.1);
    const capilGeo = new THREE.TubeGeometry(capilCurve, 32, 0.035, 8, false);
    const capilMesh = new THREE.Mesh(capilGeo, capillaryMat);
    valveGroup.add(capilMesh);

    const bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.65, 16), capillaryMat);
    bulb.rotation.z = Math.PI / 2;
    bulb.position.set(-3.8, 1.05, 0);
    valveGroup.add(bulb);

    this.scene.add(valveGroup);
    this.registerInteractive(valveGroup, 'expansion_valve');
  }

  // --- 5. EVAPORATOR ---
  private buildEvaporator(
    pos: THREE.Vector3,
    isXray: boolean
  ) {
    const evapGroup = new THREE.Group();
    evapGroup.position.copy(pos);

    // Open Industrial Sheet Metal Chassis (Top, Bottom, Left, Right panels)
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x455a64,
      metalness: 0.5,
      roughness: 0.4,
      opacity: isXray ? 0.35 : 1.0,
      transparent: isXray,
      depthWrite: !isXray,
    });

    const topPanel = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.06, 0.75), chassisMat);
    topPanel.position.set(0, 1.1, 0);
    evapGroup.add(topPanel);

    const bottomPanel = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.06, 0.75), chassisMat);
    bottomPanel.position.set(0, -1.1, 0);
    evapGroup.add(bottomPanel);

    const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.2, 0.75), chassisMat);
    leftPanel.position.set(-2.25, 0, 0);
    evapGroup.add(leftPanel);

    const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.2, 0.75), chassisMat);
    rightPanel.position.set(2.25, 0, 0);
    evapGroup.add(rightPanel);

    const coldTubeMat = new THREE.MeshStandardMaterial({
      color: 0x00b0ff,
      metalness: 0.7,
      roughness: 0.25,
      emissive: isXray ? 0x00b0ff : 0x000000,
      emissiveIntensity: isXray ? 0.25 : 0.0,
    });

    const tubeRadius = 0.08;
    const numRows = 5;
    for (let r = 0; r < numRows; r++) {
      const y = -0.8 + r * 0.4;
      const straightGeo = new THREE.CylinderGeometry(tubeRadius, tubeRadius, 3.8, 16);
      const tube = new THREE.Mesh(straightGeo, coldTubeMat);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(0, y, 0.15);
      evapGroup.add(tube);

      if (r < numRows - 1) {
        const uBend = new THREE.Mesh(new THREE.TorusGeometry(0.2, tubeRadius, 12, 16, Math.PI), coldTubeMat);
        const isRight = r % 2 === 0;
        uBend.position.set(isRight ? 1.9 : -1.9, y + 0.2, 0.15);
        uBend.rotation.z = isRight ? -Math.PI / 2 : Math.PI / 2;
        evapGroup.add(uBend);
      }
    }

    const frostFinMat = new THREE.MeshStandardMaterial({
      color: 0x90caf9,
      metalness: 0.4,
      roughness: 0.6,
      opacity: isXray ? 0.25 : 0.85,
      transparent: true,
      depthWrite: false,
    });
    for (let f = -1.8; f <= 1.8; f += 0.14) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.8, 0.4), frostFinMat);
      fin.position.set(f, 0, 0.15);
      evapGroup.add(fin);
    }

    // 2 Realistic Evaporator Fans (Prominently mounted and fully visible in all modes)
    this.createRealisticAxialFan(evapGroup, new THREE.Vector3(-0.95, 0, -0.22), 0.78, isXray);
    this.createRealisticAxialFan(evapGroup, new THREE.Vector3(0.95, 0, -0.22), 0.78, isXray);

    // Heat In Absorption Arrows
    const inArrowMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 3; i++) {
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 16), inArrowMat);
      arrow.rotation.z = Math.PI / 2;
      arrow.position.set(-3.2 - i * 0.5, -0.2 + (i - 1) * 0.3, 0);
      evapGroup.add(arrow);
      this.heatArrowsIn.push(arrow);
    }

    this.scene.add(evapGroup);
    this.registerInteractive(evapGroup, 'evaporator');
  }

  // --- REALISTIC INDUSTRIAL AXIAL FAN BUILDER ---
  private createRealisticAxialFan(
    parent: THREE.Group,
    pos: THREE.Vector3,
    radius: number,
    isXray: boolean
  ) {
    const fanAssembly = new THREE.Group();
    fanAssembly.position.copy(pos);

    // 1. Aerodynamic Venturi Bellmouth / Shroud Ring
    const shroudMat = new THREE.MeshStandardMaterial({
      color: 0x263238,
      metalness: 0.6,
      roughness: 0.4,
      opacity: isXray ? 0.35 : 1.0,
      transparent: isXray,
      depthWrite: !isXray,
    });
    const shroudGeo = new THREE.CylinderGeometry(radius * 1.04, radius * 1.01, 0.32, 32, 1, true);
    const shroud = new THREE.Mesh(shroudGeo, shroudMat);
    shroud.rotation.x = Math.PI / 2;
    fanAssembly.add(shroud);

    // Outer flared inlet ring
    const flareGeo = new THREE.TorusGeometry(radius * 1.04, 0.045, 12, 32);
    const flare = new THREE.Mesh(flareGeo, shroudMat);
    flare.position.z = 0.16;
    fanAssembly.add(flare);

    // 2. Fixed Motor Housing & Rear Stator Struts
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x1c1e22, metalness: 0.8, roughness: 0.3 });
    const motorBody = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.28, radius * 0.28, 0.28, 20), motorMat);
    motorBody.rotation.x = Math.PI / 2;
    motorBody.position.z = -0.06;
    fanAssembly.add(motorBody);

    // 4 Rear Stator Support Arms (Spider legs)
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x607d8b, metalness: 0.7, roughness: 0.3 });
    for (let s = 0; s < 4; s++) {
      const angle = (s * Math.PI) / 2 + Math.PI / 4;
      const strutLen = radius * 0.82;
      const strutGeo = new THREE.CylinderGeometry(0.02, 0.02, strutLen, 8);
      const strut = new THREE.Mesh(strutGeo, strutMat);
      strut.position.set((Math.cos(angle) * strutLen) / 2, (Math.sin(angle) * strutLen) / 2, -0.06);
      strut.rotation.z = angle + Math.PI / 2;
      fanAssembly.add(strut);
    }

    // 3. Rotating Impeller with 7 Sickle Aerodynamic Blades
    const rotatingImpeller = new THREE.Group();
    rotatingImpeller.position.z = 0.05;

    // Streamlined Spinner Nose Cone
    const hubCone = new THREE.Mesh(
      new THREE.ConeGeometry(radius * 0.26, 0.22, 24),
      new THREE.MeshStandardMaterial({ color: 0x15181c, metalness: 0.7, roughness: 0.25 })
    );
    hubCone.rotation.x = Math.PI / 2;
    hubCone.position.z = 0.08;
    rotatingImpeller.add(hubCone);

    // 7 Aerodynamic Curved Sickle Blades
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x1f242b,
      metalness: 0.45,
      roughness: 0.35,
      side: THREE.DoubleSide,
    });

    const numBlades = 7;
    for (let b = 0; b < numBlades; b++) {
      const angle = (b * Math.PI * 2) / numBlades;

      // Realistic 3D Sickle Blade Curve Shape
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.bezierCurveTo(radius * 0.25, radius * 0.08, radius * 0.55, radius * 0.22, radius * 0.75, radius * 0.12);
      shape.bezierCurveTo(radius * 0.82, radius * 0.05, radius * 0.65, -radius * 0.1, radius * 0.35, -radius * 0.08);
      shape.closePath();

      const extrudeSettings = {
        depth: 0.015,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.005,
        bevelThickness: 0.005,
      };

      const bladeGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);

      bladeMesh.rotation.z = angle;
      bladeMesh.rotation.x = 0.42; // Pitch angle (aerofoil twist)
      bladeMesh.position.set((Math.cos(angle) * radius * 0.22), (Math.sin(angle) * radius * 0.22), 0);
      rotatingImpeller.add(bladeMesh);
    }

    fanAssembly.add(rotatingImpeller);
    this.fans.push(rotatingImpeller);

    // 4. Heavy-duty Wire Grille (Finger guard)
    const grillMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.85, roughness: 0.2 });
    for (let gr = 0.38; gr <= 1.02; gr += 0.32) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * gr, 0.018, 8, 32), grillMat);
      ring.position.z = 0.18;
      fanAssembly.add(ring);
    }

    parent.add(fanAssembly);
  }

  // --- 6. SMOOTH CURVED PIPING CIRCUIT ---
  private buildPipingCircuit(
    pComp: THREE.Vector3,
    pCond: THREE.Vector3,
    pRecv: THREE.Vector3,
    pExp: THREE.Vector3,
    pEvap: THREE.Vector3,
    isThermal: boolean,
    isXray: boolean
  ) {
    // 1. Discharge Line (Compressor -> Condenser)
    const waypointsDischarge = [
      new THREE.Vector3(pComp.x + 1.1, pComp.y + 0.8, 0),
      new THREE.Vector3(-1.0, pComp.y + 0.8, 0),
      new THREE.Vector3(-1.0, pCond.y + 0.8, 0),
      new THREE.Vector3(pCond.x - 2.1, pCond.y + 0.8, 0),
    ];
    this.createSmoothPipe(waypointsDischarge, isThermal ? 0xff1744 : 0xd32f2f, 0.09, 'Línea de Descarga', isXray);

    // 2. Condenser to Liquid Receiver
    const waypointsCondToRecv = [
      new THREE.Vector3(pCond.x - 1.8, pCond.y - 0.8, 0),
      new THREE.Vector3(pCond.x - 1.8, pCond.y - 1.6, 0),
      new THREE.Vector3(pRecv.x - 0.8, pCond.y - 1.6, 0),
      new THREE.Vector3(pRecv.x - 0.8, pRecv.y + 0.55, 0),
    ];
    this.createSmoothPipe(waypointsCondToRecv, isThermal ? 0xff5722 : 0xe64a19, 0.075, 'Línea de Condensado', isXray);

    // 3. Liquid Line (Receiver -> TXV)
    const waypointsLiquid = [
      new THREE.Vector3(pRecv.x + 0.8, pRecv.y + 0.55, 0),
      new THREE.Vector3(5.6, pRecv.y + 0.55, 0),
      new THREE.Vector3(5.6, pExp.y, 0),
      new THREE.Vector3(pExp.x + 0.22, pExp.y, 0),
    ];
    this.createSmoothPipe(waypointsLiquid, isThermal ? 0xff9800 : 0xf57c00, 0.075, 'Línea de Líquido', isXray);

    // 4. Injection Line (TXV -> Evaporator)
    const waypointsInjection = [
      new THREE.Vector3(pExp.x - 0.22, pExp.y, 0),
      new THREE.Vector3(pEvap.x + 2.2, pEvap.y + 0.8, 0),
    ];
    this.createSmoothPipe(waypointsInjection, isThermal ? 0x00e5ff : 0x00bcd4, 0.075, 'Línea de Inyección', isXray);

    // 5. Suction Line (Evaporator -> Compressor)
    const waypointsSuction = [
      new THREE.Vector3(pEvap.x - 2.2, pEvap.y - 0.8, 0),
      new THREE.Vector3(-5.8, pEvap.y - 0.8, 0),
      new THREE.Vector3(-5.8, pComp.y + 0.5, 0),
      new THREE.Vector3(pComp.x - 1.1, pComp.y + 0.5, 0.6),
    ];
    this.createSmoothPipe(waypointsSuction, isThermal ? 0x2979ff : 0x03a9f4, 0.09, 'Línea de Aspiración', isXray);

    // Complete smooth continuous spline for fluid particle animation
    const completeWaypoints = [
      ...waypointsDischarge,
      ...waypointsCondToRecv,
      ...waypointsLiquid,
      ...waypointsInjection,
      ...waypointsSuction,
    ];
    const smoothedLoop = createFilletedCurvePoints(completeWaypoints, 0.55, 8);
    const loopCurve = new THREE.CatmullRomCurve3(smoothedLoop, true, 'centripetal', 0.1);
    this.particleSplinePoints = loopCurve.getSpacedPoints(500);
  }

  private createSmoothPipe(
    waypoints: THREE.Vector3[],
    colorHex: number,
    radius: number,
    name: string,
    isXray: boolean
  ) {
    // Generate filleted curved path
    const smoothPoints = createFilletedCurvePoints(waypoints, 0.5, 8);
    const curve = new THREE.CatmullRomCurve3(smoothPoints, false, 'catmullrom', 0.05);
    const pipeGeo = new THREE.TubeGeometry(curve, 64, radius, 16, false);

    // Ensure pipes never disappear or get occluded by transparent hulls in X-Ray
    const pipeMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.85,
      roughness: 0.2,
      emissive: colorHex,
      emissiveIntensity: isXray ? 0.35 : 0.12,
      depthWrite: true,
      depthTest: true,
    });

    const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
    pipeMesh.name = name;
    pipeMesh.renderOrder = 10; // High render priority
    this.scene.add(pipeMesh);
  }

  // --- 7. FLOW PARTICLES SYSTEM ---
  private buildFlowParticles() {
    if (this.particleSplinePoints.length === 0) return;

    const count = 140;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.particleProgresses = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const progress = i / count;
      this.particleProgresses[i] = progress;
      const pointIndex = Math.floor(progress * (this.particleSplinePoints.length - 1));
      const pt = this.particleSplinePoints[pointIndex] || new THREE.Vector3();

      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;

      if (progress < 0.25) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.2;
        colors[i * 3 + 2] = 0.2;
      } else if (progress < 0.5) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.6;
        colors[i * 3 + 2] = 0.0;
      } else if (progress < 0.75) {
        colors[i * 3] = 0.0;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 0.2;
        colors[i * 3 + 1] = 0.5;
        colors[i * 3 + 2] = 1.0;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pMaterial = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.flowParticles = new THREE.Points(geometry, pMaterial);
    this.flowParticles.renderOrder = 20;
    this.scene.add(this.flowParticles);
  }

  // ==========================================
  // INTERACTIVITY & RAYCASTING
  // ==========================================
  private registerInteractive(object: THREE.Object3D, id: string) {
    this.interactiveMeshes.push({ mesh: object, id });
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.userData.componentId = id;
      }
    });
  }

  private setupEvents() {
    const onPointerMove = (e: MouseEvent) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const allMeshes: THREE.Object3D[] = [];
      this.interactiveMeshes.forEach((item) => {
        item.mesh.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) allMeshes.push(c);
        });
      });

      const intersects = this.raycaster.intersectObjects(allMeshes, false);
      if (intersects.length > 0) {
        this.container.style.cursor = 'pointer';
        const hit = intersects[0].object;
        if (this.hoveredMesh !== hit) {
          this.hoveredMesh = hit;
        }
      } else {
        this.container.style.cursor = 'default';
        this.hoveredMesh = null;
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const allMeshes: THREE.Object3D[] = [];
      this.interactiveMeshes.forEach((item) => {
        item.mesh.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) allMeshes.push(c);
        });
      });

      const intersects = this.raycaster.intersectObjects(allMeshes, false);
      if (intersects.length > 0) {
        const compId = intersects[0].object.userData.componentId;
        if (compId) {
          const info = this.getComponentInfo(compId);
          this.onSelectComponent(info);
        }
      }
    };

    const onResize = () => {
      if (!this.container || this.isDestroyed) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      if (w > 0 && h > 0) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      }
    };

    this.container.addEventListener('pointermove', onPointerMove);
    this.container.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);
  }

  private getComponentInfo(id: string): ComponentInfo {
    const t = this.thermoData;
    switch (id) {
      case 'compressor':
        return {
          id,
          name: 'Compresor Frigorífico',
          category: 'compression',
          description:
            'Aspira vapor sobrecalentado a baja presión y baja temperatura (Punto 3) desde el evaporador, comprimiéndolo mecánicamente hasta la alta presión de descarga (Punto 4) hacia el condensador.',
          thermoProcess: 'Compresión Isoentrópica / Real (3 → 4)',
          parameters: [
            { label: 'Presión Aspiración (P₃)', value: t.p_evap.toFixed(2), unit: 'bar' },
            { label: 'Temp. Aspiración (T₃)', value: (t.t_evap + (t.t_superheat || 5)).toFixed(1), unit: '°C' },
            { label: 'Vol. Específico Aspiración (v₃)', value: t.v_suction_m3_kg ? t.v_suction_m3_kg.toFixed(4) : '0.0994', unit: 'm³/kg' },
            { label: 'Presión Descarga (P₄)', value: t.p_cond.toFixed(2), unit: 'bar' },
            { label: 'Temp. Descarga (T₄)', value: (t.t_discharge || t.t_cond + 25).toFixed(1), unit: '°C' },
            { label: 'Vol. Específico Descarga (v₄)', value: t.v_discharge_m3_kg ? t.v_discharge_m3_kg.toFixed(4) : '0.0211', unit: 'm³/kg' },
            { label: 'Relación Compresión (P₄/P₃)', value: (t.compression_ratio || t.p_cond / Math.max(0.1, t.p_evap)).toFixed(2), unit: ': 1' },
            { label: 'Variación Volumen (|v₃-v₄|)', value: (t.delta_v_m3_kg || 0.078).toFixed(4), unit: 'm³/kg' },
            { label: 'Trabajo Específico (w_comp = h₄ - h₃)', value: (t.w_comp_kj || 38.4).toFixed(1), unit: 'kJ/kg' },
          ],
        };
      case 'condenser':
        return {
          id,
          name: 'Condensador de Aire',
          category: 'condensation',
          description:
            'Disipa el calor de desecho hacia el ambiente exterior (q_cond = h₄ - h₆), desrecalentando el gas caliente de descarga (Punto 4), condensándolo a líquido saturado y subenfriándolo (Punto 6).',
          thermoProcess: 'Condensación y Subenfriamiento Isobárico (4 → 6)',
          parameters: [
            { label: 'Presión Condensación (P₄ = P₆)', value: t.p_cond.toFixed(2), unit: 'bar' },
            { label: 'Temp. Condensación (T_k)', value: t.t_cond.toFixed(1), unit: '°C' },
            { label: 'Subenfriamiento (ΔT_sub)', value: (t.t_subcooling || 3.0).toFixed(1), unit: 'K' },
            { label: 'Calor Disipado (q_cond = h₄ - h₆)', value: (t.q_cond_kj || (t.q_evap_kj || 153.2) + (t.w_comp_kj || 38.4)).toFixed(1), unit: 'kJ/kg' },
            { label: 'Balance Energético', value: 'q_evap + w_comp = q_cond' },
          ],
        };
      case 'receiver':
        return {
          id,
          name: 'Recipiente de Líquido (Calderín)',
          category: 'storage',
          description:
            'Almacena el refrigerante líquido condensado a alta presión (Punto 6), garantizando alimentación continua a la válvula de expansión.',
          thermoProcess: 'Almacenamiento Isobárico Líquido',
          parameters: [
            { label: 'Presión Almacenamiento (P₆)', value: t.p_cond.toFixed(2), unit: 'bar' },
            { label: 'Estado', value: '100% Líquido Subenfriado' },
            { label: 'Nivel Visor', value: '65 %' },
          ],
        };
      case 'expansion_valve':
        return {
          id,
          name: 'Válvula de Expansión Termostática (TXV)',
          category: 'expansion',
          description:
            'Regula el caudal de refrigerante hacia el evaporador provocando una caída brusca de presión (flash gas) manteniendo entalpía constante (h₆ = h₁).',
          thermoProcess: 'Expansión Isoentálpica (6 → 1)',
          parameters: [
            { label: 'Presión Entrada (P₆)', value: t.p_cond.toFixed(2), unit: 'bar' },
            { label: 'Presión Salida (P₁)', value: t.p_evap.toFixed(2), unit: 'bar' },
            { label: 'Pérdida Carga (ΔP = P₆ - P₁)', value: (t.p_cond - t.p_evap).toFixed(2), unit: 'bar' },
            { label: 'Entalpía Isoentálpica', value: 'Constante (h₆ = h₁)' },
          ],
        };
      case 'evaporator':
      default:
        return {
          id: 'evaporator',
          name: 'Evaporador de Tiro Forzado',
          category: 'evaporation',
          description:
            'Absorbe calor del recinto refrigerado (q_evap = h₃ - h₁), evaporando la mezcla líquida a baja presión (Punto 1) y sobrecalentando el vapor hacia la aspiración (Punto 3).',
          thermoProcess: 'Evaporación y Sobrecalentamiento Isobárico (1 → 3)',
          parameters: [
            { label: 'Presión Evaporación (P₁ = P₃)', value: t.p_evap.toFixed(2), unit: 'bar' },
            { label: 'Temp. Evaporación (T_o)', value: t.t_evap.toFixed(1), unit: '°C' },
            { label: 'Sobrecalentamiento Útil', value: (t.t_superheat || 5.0).toFixed(1), unit: 'K' },
            { label: 'Efecto Frigorífico (q_evap = h₃ - h₁)', value: (t.q_evap_kj || 153.2).toFixed(1), unit: 'kJ/kg' },
            { label: 'Coef. Operación (COP = q_evap / w_comp)', value: (t.cop || 3.99).toFixed(2) },
          ],
        };
    }
  }

  // ==========================================
  // PUBLIC CONTROLS & UPDATES
  // ==========================================
  public setOptions(options: Partial<SceneOptions>) {
    this.options = { ...this.options, ...options };
    if (options.theme) {
      this.updateBackgroundColor();
    }
  }

  public setThermoData(data: CycleThermodynamics) {
    this.thermoData = data;
  }

  public resetCamera(view: 'iso' | 'front' | 'top' = 'iso') {
    if (view === 'iso') {
      this.camera.position.set(0, 3.5, 14.5);
      this.controls.target.set(0.5, 0.2, 0);
    } else if (view === 'front') {
      this.camera.position.set(0, 0.5, 15);
      this.controls.target.set(0, 0, 0);
    } else if (view === 'top') {
      this.camera.position.set(0, 16, 0.1);
      this.controls.target.set(0, 0, 0);
    }
    this.controls.update();
  }

  // ==========================================
  // ANIMATION LOOP
  // ==========================================
  private animate() {
    if (this.isDestroyed) return;
    this.animFrameId = requestAnimationFrame(this.animate);

    // 1. Rotate axial fan impellers
    if (this.options.isFlowing) {
      this.fans.forEach((fan) => {
        fan.rotation.z += 0.2 * this.options.flowSpeed;
      });
    }

    // 2. Animate heat arrows
    const time = Date.now() * 0.003;
    this.heatArrowsOut.forEach((arrow, i) => {
      arrow.position.x = 2.8 + ((time + i * 0.4) % 1.2);
    });
    this.heatArrowsIn.forEach((arrow, i) => {
      arrow.position.x = -3.8 + ((time + i * 0.4) % 1.2);
    });

    // 3. Animate fluid particles along the continuous spline
    if (this.flowParticles && this.particleSplinePoints.length > 0 && this.options.isFlowing) {
      const posAttr = this.flowParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const count = this.particleProgresses.length;
      const speed = 0.0018 * this.options.flowSpeed;

      for (let i = 0; i < count; i++) {
        let p = this.particleProgresses[i] + speed;
        if (p > 1.0) p -= 1.0;
        this.particleProgresses[i] = p;

        const idx = Math.floor(p * (this.particleSplinePoints.length - 1));
        const pt = this.particleSplinePoints[idx];
        if (pt) {
          posAttr.setXYZ(i, pt.x, pt.y, pt.z);
        }
      }
      posAttr.needsUpdate = true;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // ==========================================
  // DISPOSAL & CLEANUP
  // ==========================================
  public destroy() {
    this.isDestroyed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
