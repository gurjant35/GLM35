(() => {
  'use strict';

  if (!window.THREE) {
    document.body.innerHTML = '<p style="color:white;padding:24px;font-family:sans-serif">The 3D engine could not start.</p>';
    return;
  }

  document.body.className = 'si2';
  document.body.innerHTML = `
    <canvas id="si-game" aria-label="Safe Inside first-person survival game"></canvas>
    <div id="si-vignette"></div>
    <div id="si-damage"></div>
    <div id="si-rain-glass"></div>

    <div id="si-hud" aria-live="polite">
      <div class="si-top-left">
        <div id="si-clock" class="si-glass">
          <span id="si-day">DAY 1</span><span id="si-time">08:00</span><span id="si-weather">OVERCAST</span>
        </div>
        <div id="si-vitals" class="si-glass">
          <div class="si-vital-row health"><span>HEALTH</span><div class="si-track"><div id="si-health-fill" class="si-fill"></div></div><span id="si-health-number">100</span></div>
          <div class="si-vital-row"><span>FOOD</span><div class="si-track"><div id="si-food-fill" class="si-fill"></div></div><span id="si-food-number">100</span></div>
          <div class="si-vital-row water"><span>WATER</span><div class="si-track"><div id="si-water-fill" class="si-fill"></div></div><span id="si-water-number">100</span></div>
          <div class="si-vital-row stamina"><span>ENERGY</span><div class="si-track"><div id="si-stamina-fill" class="si-fill"></div></div><span id="si-stamina-number">100</span></div>
        </div>
      </div>
      <div class="si-top-center"><div id="si-objective" class="si-glass">Prepare inside the RV, then collect supplies before dark.</div></div>
      <div class="si-top-right">
        <div id="si-zone" class="si-glass safe"><span id="si-zone-dot"></span><span id="si-zone-text">RV SAFE ZONE</span></div>
        <div id="si-ammo" class="si-glass"><span id="si-mag">30</span><span id="si-reserve"> / 48</span></div>
        <div id="si-pack-readout" class="si-glass">BACKPACK <span id="si-pack-count">6 / 20</span></div>
      </div>
      <div id="si-compass">N&nbsp;&nbsp;&nbsp;NE&nbsp;&nbsp;&nbsp;E</div>
      <div id="si-crosshair"><span></span></div>
      <div id="si-hitmarker"></div>
      <div id="si-prompt" class="si-glass"></div>
      <div id="si-toast-stack"></div>
    </div>

    <div id="si-look-zone" aria-label="Swipe to look"></div>
    <div id="si-stick" aria-label="Movement joystick"><div id="si-knob"></div></div>
    <div id="si-mobile-buttons">
      <div class="si-button-column">
        <button id="si-pack-button" class="si-touch-button" aria-label="Open backpack">PACK</button>
        <button id="si-rv-button" class="si-touch-button" aria-label="Go outside">OUTSIDE</button>
      </div>
      <div class="si-button-column">
        <button id="si-reload" class="si-touch-button" aria-label="Reload weapon">RELOAD</button>
        <button id="si-use" class="si-touch-button" aria-label="Use nearby object">USE<span id="si-action-ring"></span></button>
      </div>
      <button id="si-fire" class="si-touch-button" aria-label="Fire weapon">FIRE</button>
    </div>
    <div id="si-desktop-help" class="si-glass">WASD MOVE · MOUSE LOOK · SHIFT RUN · CLICK FIRE · E USE · V RV · B PACK · R RELOAD · F LIGHT</div>
    <div id="si-fps">60 FPS · BALANCED</div>

    <div id="si-start" class="si-overlay">
      <div class="si-card">
        <p class="si-kicker">First-person mobile survival</p>
        <h1>Safe <span>Inside</span></h1>
        <p class="si-lead">Your RV is the only place nothing can harm you. Search the dark forest for food, water, wood, medicine, and ammunition. Get back inside before the long night becomes dangerous.</p>
        <div class="si-feature-grid">
          <div class="si-feature"><b>Instant safety</b><span>Tap INSIDE near the RV. The doors lock and enemies cannot damage you.</span></div>
          <div class="si-feature"><b>Working RV</b><span>Walk through the kitchen, washroom, bedroom, storage, and TV area.</span></div>
          <div class="si-feature"><b>Long nights</b><span>Dim days are short. Nights are darker, longer, and filled with stronger enemies.</span></div>
        </div>
        <div class="si-row">
          <button id="si-new-game" class="si-primary">START NEW CAMP</button>
          <button id="si-continue" class="si-secondary">CONTINUE</button>
          <button id="si-quality" class="si-secondary">QUALITY: BALANCED</button>
        </div>
        <p class="si-fine">Built for landscape Android play. The game saves on this device. Tap the screen once after starting to enable sound.</p>
      </div>
    </div>

    <div id="si-rotate" class="si-overlay">
      <div><div class="si-phone-icon"></div><p class="si-kicker">Rotate your phone</p><h2>Play in landscape</h2></div>
    </div>

    <div id="si-modal" class="si-overlay hidden">
      <div class="si-card">
        <div class="si-modal-head"><div><p id="si-modal-kicker" class="si-kicker">BACKPACK</p><h2 id="si-modal-title">Supplies</h2></div><button id="si-modal-close" class="si-close" aria-label="Close">×</button></div>
        <div id="si-modal-body"></div>
      </div>
    </div>

    <div id="si-interaction-card" class="si-overlay hidden">
      <div class="si-card">
        <p id="si-interaction-kicker" class="si-kicker">RV INTERIOR</p>
        <h2 id="si-interaction-title">Object</h2>
        <p id="si-interaction-text"></p>
        <div id="si-interaction-actions"></div>
        <div class="si-row" style="margin-top:10px"><button id="si-interaction-close" class="si-secondary">CLOSE</button></div>
      </div>
    </div>
  `;

  const $ = (id) => document.getElementById(id);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;
  const smooth = (rate, dt) => 1 - Math.exp(-rate * dt);
  const TAU = Math.PI * 2;
  const SAVE_KEY = 'safe-inside-fps-rv-v2';
  const WORLD_SIZE = 190;
  const CYCLE_SECONDS = 300;
  const DAY_START = 0.08;
  const DAY_END = 0.42;
  const RV = { x: 0, z: 0, width: 3.6, length: 8.8, doorX: 2.05, doorZ: 1.55 };
  const coarsePointer = matchMedia('(pointer: coarse)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const UI = {
    start: $('si-start'), continueButton: $('si-continue'), qualityButton: $('si-quality'),
    modal: $('si-modal'), modalKicker: $('si-modal-kicker'), modalTitle: $('si-modal-title'), modalBody: $('si-modal-body'),
    interaction: $('si-interaction-card'), interactionKicker: $('si-interaction-kicker'), interactionTitle: $('si-interaction-title'), interactionText: $('si-interaction-text'), interactionActions: $('si-interaction-actions'),
    healthFill: $('si-health-fill'), foodFill: $('si-food-fill'), waterFill: $('si-water-fill'), staminaFill: $('si-stamina-fill'),
    healthNumber: $('si-health-number'), foodNumber: $('si-food-number'), waterNumber: $('si-water-number'), staminaNumber: $('si-stamina-number'),
    day: $('si-day'), time: $('si-time'), weather: $('si-weather'), objective: $('si-objective'),
    zone: $('si-zone'), zoneText: $('si-zone-text'), mag: $('si-mag'), reserve: $('si-reserve'), packCount: $('si-pack-count'),
    compass: $('si-compass'), prompt: $('si-prompt'), toast: $('si-toast-stack'), hitmarker: $('si-hitmarker'), damage: $('si-damage'),
    rvButton: $('si-rv-button'), packButton: $('si-pack-button'), reloadButton: $('si-reload'), useButton: $('si-use'), fireButton: $('si-fire'),
    fps: $('si-fps')
  };

  let qualityMode = 'balanced';
  let renderScale = coarsePointer ? 1.28 : 1.5;
  let gameStarted = false;
  let paused = true;
  let modalOpen = false;
  let currentPrompt = '';
  let currentInteractable = null;
  let selectedSlot = -1;
  let saveTimer = 0;
  let elapsed = 0;

  const canvas = $('si-game');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    precision: 'highp'
  });
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(devicePixelRatio, renderScale));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1d2a30);
  scene.fog = new THREE.FogExp2(0x1d2a30, 0.009);

  const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.06, 430);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  function resize() {
    const width = Math.max(1, innerWidth);
    const height = Math.max(1, innerHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize, { passive: true });
  resize();

  const hemisphere = new THREE.HemisphereLight(0xaec1c5, 0x172019, 0.54);
  scene.add(hemisphere);
  const sun = new THREE.DirectionalLight(0xd7d0bc, 0.65);
  sun.position.set(-28, 52, 24);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -36;
  sun.shadow.camera.right = 36;
  sun.shadow.camera.top = 36;
  sun.shadow.camera.bottom = -36;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 115;
  sun.shadow.bias = -0.001;
  scene.add(sun, sun.target);

  const moonLight = new THREE.DirectionalLight(0x6e89ac, 0.1);
  moonLight.position.set(30, 40, -24);
  scene.add(moonLight);

  const flashlight = new THREE.SpotLight(0xfff1d7, 2.5, 42, 0.42, 0.55, 1.4);
  flashlight.position.set(0.18, -0.08, -0.05);
  const flashlightTarget = new THREE.Object3D();
  flashlightTarget.position.set(0, -0.04, -12);
  camera.add(flashlight, flashlightTarget);
  flashlight.target = flashlightTarget;

  const SKY = {
    night: new THREE.Color(0x020509),
    dawn: new THREE.Color(0x493b36),
    day: new THREE.Color(0x56666b),
    storm: new THREE.Color(0x29353a),
    current: new THREE.Color()
  };

  function makeCanvasTexture(size, painter, repeatX = 1, repeatY = 1) {
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = textureCanvas.height = size;
    const context = textureCanvas.getContext('2d');
    painter(context, size);
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return texture;
  }

  const textures = {
    ground: makeCanvasTexture(256, (g, size) => {
      g.fillStyle = '#293127';
      g.fillRect(0, 0, size, size);
      for (let i = 0; i < 4300; i += 1) {
        const shade = 35 + Math.floor(Math.random() * 25);
        g.fillStyle = `rgb(${shade},${shade + 10},${Math.max(26, shade - 4)})`;
        g.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 3, 1 + Math.random() * 3);
      }
      for (let i = 0; i < 28; i += 1) {
        g.strokeStyle = 'rgba(103,91,67,.12)';
        g.lineWidth = 2 + Math.random() * 3;
        g.beginPath();
        g.moveTo(Math.random() * size, Math.random() * size);
        g.lineTo(Math.random() * size, Math.random() * size);
        g.stroke();
      }
    }, 70, 70),
    wood: makeCanvasTexture(256, (g, size) => {
      g.fillStyle = '#664936';
      g.fillRect(0, 0, size, size);
      for (let y = 0; y < size; y += 32) {
        g.fillStyle = y % 64 === 0 ? '#72513b' : '#5c4232';
        g.fillRect(0, y, size, 30);
        g.strokeStyle = 'rgba(24,14,9,.45)';
        g.strokeRect(0, y, size, 31);
        for (let x = 0; x < size; x += 80) {
          g.fillStyle = 'rgba(28,17,11,.18)';
          g.beginPath();
          g.ellipse(x + (y % 64), y + 14, 11, 3, 0, 0, TAU);
          g.fill();
        }
      }
    }, 2, 5),
    fabric: makeCanvasTexture(128, (g, size) => {
      g.fillStyle = '#5a625d';
      g.fillRect(0, 0, size, size);
      g.fillStyle = 'rgba(230,235,230,.08)';
      for (let i = 0; i < size; i += 4) {
        g.fillRect(i, 0, 1, size);
        g.fillRect(0, i, size, 1);
      }
    }, 3, 3)
  };

  const materials = {
    ground: new THREE.MeshStandardMaterial({ map: textures.ground, color: 0x879181, roughness: 1 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x4d3828, roughness: 1 }),
    needles: new THREE.MeshStandardMaterial({ color: 0x1c3527, roughness: 1 }),
    rock: new THREE.MeshStandardMaterial({ color: 0x555c59, roughness: 0.95 }),
    cabin: new THREE.MeshStandardMaterial({ color: 0x574b3c, roughness: 0.95 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x282c2c, roughness: 0.85 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x727b79, metalness: 0.72, roughness: 0.42 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x1a2022, metalness: 0.78, roughness: 0.36 }),
    rvBody: new THREE.MeshStandardMaterial({ color: 0xc5c4b8, metalness: 0.22, roughness: 0.4 }),
    rvTrim: new THREE.MeshStandardMaterial({ color: 0x334c45, metalness: 0.42, roughness: 0.38 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x172b33, metalness: 0.1, roughness: 0.18, emissive: 0x071018, emissiveIntensity: 0.7 }),
    interiorWall: new THREE.MeshStandardMaterial({ color: 0xd4cdbd, roughness: 0.76, side: THREE.DoubleSide }),
    floor: new THREE.MeshStandardMaterial({ map: textures.wood, color: 0xb9a08c, roughness: 0.76 }),
    fabric: new THREE.MeshStandardMaterial({ map: textures.fabric, color: 0xa9b1aa, roughness: 0.9 }),
    white: new THREE.MeshStandardMaterial({ color: 0xd9ddd6, roughness: 0.75 }),
    black: new THREE.MeshStandardMaterial({ color: 0x111617, roughness: 0.55 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x6d4d36, roughness: 0.8 }),
    counter: new THREE.MeshStandardMaterial({ color: 0x252b2a, roughness: 0.36, metalness: 0.08 })
  };

  const colliders = [];
  const colliderGrid = new Map();
  const gridKey = (x, z) => `${Math.floor(x / 12)},${Math.floor(z / 12)}`;
  function addCollider(collider) {
    colliders.push(collider);
    for (let gx = -1; gx <= 1; gx += 1) {
      for (let gz = -1; gz <= 1; gz += 1) {
        const key = `${Math.floor(collider.x / 12) + gx},${Math.floor(collider.z / 12) + gz}`;
        if (!colliderGrid.has(key)) colliderGrid.set(key, []);
        colliderGrid.get(key).push(collider);
      }
    }
    return collider;
  }

  function nearbyColliders(x, z) {
    return colliderGrid.get(gridKey(x, z)) || [];
  }

  const world = {
    trees: [],
    crates: [],
    enemies: [],
    enemyHitMeshes: [],
    interactables: [],
    rain: null,
    rainVelocity: null,
    stars: null,
    moon: null,
    treeTrunks: null,
    treeCrowns: null,
    rvGroup: null,
    rvDoor: null,
    rvLockLight: null,
    tvScreen: null,
    tvContext: null,
    tvTexture: null,
    interiorLights: [],
    nightWaveDay: 0
  };

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function addBox(parent, size, position, material, rotation = null, shadow = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
    mesh.position.set(position[0], position[1], position[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = shadow;
    mesh.receiveShadow = shadow;
    parent.add(mesh);
    return mesh;
  }

  function addCylinder(parent, radiusTop, radiusBottom, height, segments, position, material, rotation = null, shadow = true) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
    mesh.position.set(position[0], position[1], position[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = shadow;
    mesh.receiveShadow = shadow;
    parent.add(mesh);
    return mesh;
  }

  function toast(text, type = '') {
    const node = document.createElement('div');
    node.className = `si-toast ${type}`;
    node.textContent = text;
    UI.toast.appendChild(node);
    while (UI.toast.children.length > 4) UI.toast.firstElementChild.remove();
    setTimeout(() => node.remove(), 3300);
  }

  const audio = {
    context: null,
    master: null,
    rainGain: null,
    rainSource: null,
    unlock() {
      if (this.context) {
        if (this.context.state === 'suspended') this.context.resume();
        return;
      }
      try {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioClass();
        this.master = this.context.createGain();
        this.master.gain.value = 0.42;
        this.master.connect(this.context.destination);
      } catch (error) {
        this.context = null;
      }
    },
    tone(from, to, duration, type = 'sine', volume = 0.12) {
      if (!this.context) return;
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(from, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), now + duration);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      oscillator.connect(gain).connect(this.master);
      oscillator.start(now);
      oscillator.stop(now + duration);
    },
    noise(duration = 0.1, volume = 0.12, cutoff = 1800) {
      if (!this.context) return;
      const samples = Math.ceil(this.context.sampleRate * duration);
      const buffer = this.context.createBuffer(1, samples, this.context.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < samples; i += 1) channel[i] = Math.random() * 2 - 1;
      const source = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      filter.type = 'lowpass';
      filter.frequency.value = cutoff;
      gain.gain.setValueAtTime(volume, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
      source.buffer = buffer;
      source.connect(filter).connect(gain).connect(this.master);
      source.start();
    },
    shot() { this.noise(0.13, 0.34, 2600); this.tone(190, 58, 0.15, 'square', 0.18); },
    reload() { this.tone(680, 430, 0.06, 'square', 0.08); setTimeout(() => this.tone(420, 760, 0.07, 'square', 0.08), 470); },
    pickup() { this.tone(520, 880, 0.11, 'sine', 0.1); },
    door() { this.noise(0.18, 0.16, 500); this.tone(120, 65, 0.2, 'sine', 0.1); },
    lock() { setTimeout(() => this.tone(900, 1350, 0.07, 'square', 0.09), 120); },
    hit() { this.tone(210, 95, 0.09, 'square', 0.08); },
    enemy() { this.tone(115, 62, 0.7, 'sawtooth', 0.045); },
    cook() { this.tone(330, 520, 0.3, 'sine', 0.07); },
    switch() { this.tone(440, 520, 0.05, 'square', 0.06); }
  };

  function buildEnvironment(seed) {
    const rng = seededRandom(seed);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_SIZE * 2.35, WORLD_SIZE * 2.35),
      materials.ground
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const mountainMaterial = new THREE.MeshStandardMaterial({ color: 0x313b3c, roughness: 1, flatShading: true });
    for (let i = 0; i < 24; i += 1) {
      const angle = i / 24 * TAU + rng() * 0.08;
      const distance = 205 + rng() * 30;
      const height = 34 + rng() * 42;
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(28 + rng() * 20, height, 6), mountainMaterial);
      mountain.position.set(Math.sin(angle) * distance, height * 0.47 - 3, Math.cos(angle) * distance);
      mountain.rotation.y = rng() * TAU;
      scene.add(mountain);
    }

    const starCount = 620;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      const angle = rng() * TAU;
      const elevation = 0.16 + rng() * 1.18;
      const distance = 330;
      starPositions[i * 3] = Math.cos(angle) * Math.cos(elevation) * distance;
      starPositions[i * 3 + 1] = Math.sin(elevation) * distance;
      starPositions[i * 3 + 2] = Math.sin(angle) * Math.cos(elevation) * distance;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    world.stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
      color: 0xdde7f1,
      size: 1.25,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      fog: false
    }));
    scene.add(world.stars);

    world.moon = new THREE.Mesh(
      new THREE.SphereGeometry(9, 20, 16),
      new THREE.MeshBasicMaterial({ color: 0xc8d4e1, transparent: true, opacity: 0, fog: false })
    );
    world.moon.position.set(120, 145, -185);
    scene.add(world.moon);

    const rainCount = coarsePointer ? 680 : 1000;
    const rainPositions = new Float32Array(rainCount * 3);
    world.rainVelocity = new Float32Array(rainCount);
    for (let i = 0; i < rainCount; i += 1) {
      rainPositions[i * 3] = (rng() - 0.5) * 62;
      rainPositions[i * 3 + 1] = rng() * 30;
      rainPositions[i * 3 + 2] = (rng() - 0.5) * 62;
      world.rainVelocity[i] = 17 + rng() * 13;
    }
    const rainGeometry = new THREE.BufferGeometry();
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    world.rain = new THREE.Points(rainGeometry, new THREE.PointsMaterial({
      color: 0xa9c5d2,
      size: 0.075,
      transparent: true,
      opacity: 0.58,
      depthWrite: false
    }));
    world.rain.visible = false;
    scene.add(world.rain);

    const treeCount = coarsePointer ? 310 : 390;
    const trunkGeometry = new THREE.CylinderGeometry(0.16, 0.3, 2.6, 7);
    const crownGeometry = new THREE.ConeGeometry(1.55, 4.1, 8);
    world.treeTrunks = new THREE.InstancedMesh(trunkGeometry, materials.trunk, treeCount);
    world.treeCrowns = new THREE.InstancedMesh(crownGeometry, materials.needles, treeCount);
    world.treeTrunks.castShadow = true;
    world.treeCrowns.castShadow = true;
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    world.trees.length = 0;
    for (let i = 0; i < treeCount; i += 1) {
      let x;
      let z;
      do {
        x = (rng() * 2 - 1) * WORLD_SIZE;
        z = (rng() * 2 - 1) * WORLD_SIZE;
      } while (Math.abs(x) < 13 && Math.abs(z) < 15);
      const treeScale = 0.8 + rng() * 1.15;
      quaternion.setFromAxisAngle(up, rng() * TAU);
      scale.set(treeScale, treeScale, treeScale);
      position.set(x, 1.3 * treeScale, z);
      matrix.compose(position, quaternion, scale);
      world.treeTrunks.setMatrixAt(i, matrix);
      position.set(x, 4.1 * treeScale, z);
      matrix.compose(position, quaternion, scale);
      world.treeCrowns.setMatrixAt(i, matrix);
      const tree = { id: i, x, z, scale: treeScale, wood: 3, active: true };
      tree.collider = addCollider({ x, z, r: 0.42 * treeScale, active: true, type: 'tree', ref: tree });
      world.trees.push(tree);
    }
    world.treeTrunks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    world.treeCrowns.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(world.treeTrunks, world.treeCrowns);

    const rockCount = 72;
    const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), materials.rock, rockCount);
    rocks.castShadow = true;
    rocks.receiveShadow = true;
    for (let i = 0; i < rockCount; i += 1) {
      let x;
      let z;
      do {
        x = (rng() * 2 - 1) * (WORLD_SIZE - 8);
        z = (rng() * 2 - 1) * (WORLD_SIZE - 8);
      } while (Math.abs(x) < 10 && Math.abs(z) < 13);
      const rockScale = 0.45 + rng() * 1.35;
      quaternion.setFromAxisAngle(up, rng() * TAU);
      scale.set(rockScale, rockScale * (0.55 + rng() * 0.2), rockScale);
      position.set(x, rockScale * 0.48, z);
      matrix.compose(position, quaternion, scale);
      rocks.setMatrixAt(i, matrix);
      addCollider({ x, z, r: rockScale * 0.82, active: true, type: 'rock' });
    }
    scene.add(rocks);

    const cabinGeometry = new THREE.BoxGeometry(6.5, 3.4, 5.2);
    const roofGeometry = new THREE.ConeGeometry(4.9, 2.3, 4);
    for (let i = 0; i < 7; i += 1) {
      let x;
      let z;
      do {
        x = (rng() * 2 - 1) * (WORLD_SIZE - 22);
        z = (rng() * 2 - 1) * (WORLD_SIZE - 22);
      } while (Math.abs(x) < 30 && Math.abs(z) < 30);
      const cabin = new THREE.Mesh(cabinGeometry, materials.cabin);
      cabin.position.set(x, 1.7, z);
      cabin.rotation.y = rng() * TAU;
      cabin.castShadow = true;
      cabin.receiveShadow = true;
      scene.add(cabin);
      const roof = new THREE.Mesh(roofGeometry, materials.roof);
      roof.position.set(x, 4.35, z);
      roof.rotation.y = cabin.rotation.y + Math.PI / 4;
      roof.castShadow = true;
      scene.add(roof);
      addCollider({ x, z, r: 4.25, active: true, type: 'cabin' });
      makeCrate(x + (rng() - 0.5) * 10, z + (rng() - 0.5) * 9, rng, i % 3 === 0 ? 'food' : 'supply');
      makeCrate(x + (rng() - 0.5) * 11, z + (rng() - 0.5) * 10, rng, i % 2 === 0 ? 'water' : 'supply');
    }

    for (let i = 0; i < 17; i += 1) {
      let x;
      let z;
      do {
        x = (rng() * 2 - 1) * (WORLD_SIZE - 12);
        z = (rng() * 2 - 1) * (WORLD_SIZE - 12);
      } while (x * x + z * z < 420);
      const roll = rng();
      makeCrate(x, z, rng, roll < 0.26 ? 'food' : roll < 0.45 ? 'water' : 'supply');
    }

    buildRV();
    buildWeapon();
  }

  function makeCrate(x, z, rng, type) {
    const group = new THREE.Group();
    const color = type === 'food' ? 0x6e7c55 : type === 'water' ? 0x456d7c : 0x7a6042;
    const baseMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.12 });
    const lidMaterial = baseMaterial.clone();
    lidMaterial.color.offsetHSL(0, 0, 0.07);
    const base = addBox(group, [1.25, 0.62, 0.82], [0, 0.34, 0], baseMaterial);
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.68, -0.36);
    const lid = addBox(lidPivot, [1.25, 0.18, 0.82], [0, 0, 0.36], lidMaterial);
    group.add(lidPivot);
    group.position.set(x, 0, z);
    group.rotation.y = rng() * TAU;
    scene.add(group);
    const crate = { id: world.crates.length, x, z, type, opened: false, group, base, lid, lidPivot };
    world.crates.push(crate);
    addCollider({ x, z, r: 0.65, active: true, type: 'crate', ref: crate });
    return crate;
  }

  function buildRV() {
    const rv = new THREE.Group();
    world.rvGroup = rv;
    rv.position.set(RV.x, 0, RV.z);

    addBox(rv, [RV.width, 3.25, RV.length], [0, 1.84, 0], materials.rvBody);
    addBox(rv, [RV.width + 0.08, 0.34, 5.1], [0, 0.67, -0.35], materials.rvTrim);
    addBox(rv, [RV.width - 0.2, 0.94, 1.15], [0, 1.17, 4.72], materials.rvBody);
    addBox(rv, [RV.width - 0.34, 0.76, 0.08], [0, 2.05, 4.16], materials.glass, null, false);
    addBox(rv, [0.08, 0.72, 2.0], [-1.83, 2.05, 1.7], materials.glass, null, false);
    addBox(rv, [0.08, 0.72, 1.65], [-1.83, 2.05, -1.65], materials.glass, null, false);
    addBox(rv, [0.08, 0.72, 1.15], [1.83, 2.05, -2.1], materials.glass, null, false);

    const wheelGeometry = new THREE.CylinderGeometry(0.55, 0.55, 0.32, 16);
    for (const wheel of [[-1.78, 0.62, 2.35], [1.78, 0.62, 2.35], [-1.78, 0.62, -2.55], [1.78, 0.62, -2.55]]) {
      const mesh = new THREE.Mesh(wheelGeometry, materials.black);
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set(wheel[0], wheel[1], wheel[2]);
      mesh.castShadow = true;
      rv.add(mesh);
    }

    addBox(rv, [2.8, 0.12, 4.8], [0, 3.55, -0.15], materials.darkMetal);
    addBox(rv, [0.18, 0.18, 3.15], [1.92, 3.2, 0.2], materials.rvTrim);
    addBox(rv, [1.0, 0.22, 1.0], [-0.75, 3.68, -1.2], materials.darkMetal);

    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0xb6b5a9, roughness: 0.48, metalness: 0.16 });
    world.rvDoor = addBox(rv, [0.09, 2.35, 1.18], [1.84, 1.69, RV.doorZ], doorMaterial);
    const handle = addBox(rv, [0.12, 0.08, 0.24], [1.92, 1.75, RV.doorZ + 0.31], materials.darkMetal, null, false);
    handle.userData.name = 'RV door handle';
    const lockMaterial = new THREE.MeshStandardMaterial({ color: 0x69d395, emissive: 0x2e9c5d, emissiveIntensity: 1.6 });
    world.rvLockLight = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), lockMaterial);
    world.rvLockLight.position.set(1.92, 2.25, RV.doorZ + 0.34);
    rv.add(world.rvLockLight);

    const floor = addBox(rv, [3.1, 0.12, 8.05], [0, 0.45, -0.08], materials.floor);
    floor.receiveShadow = true;
    addBox(rv, [3.08, 0.1, 8.02], [0, 3.25, -0.08], materials.interiorWall, null, false);
    addBox(rv, [0.08, 2.72, 8.0], [-1.56, 1.85, -0.08], materials.interiorWall, null, false);
    addBox(rv, [0.08, 2.72, 4.62], [1.56, 1.85, -1.76], materials.interiorWall, null, false);
    addBox(rv, [0.08, 2.72, 1.22], [1.56, 1.85, 3.25], materials.interiorWall, null, false);
    addBox(rv, [3.05, 2.72, 0.08], [0, 1.85, -4.05], materials.interiorWall, null, false);
    addBox(rv, [3.05, 2.72, 0.08], [0, 1.85, 3.94], materials.interiorWall, null, false);

    const warmLightA = new THREE.PointLight(0xffd7a0, 1.15, 6.5, 2);
    warmLightA.position.set(0, 2.85, 2.1);
    const warmLightB = new THREE.PointLight(0xffd7a0, 1.05, 6.5, 2);
    warmLightB.position.set(0, 2.85, -2.25);
    rv.add(warmLightA, warmLightB);
    world.interiorLights.push(warmLightA, warmLightB);
    addBox(rv, [0.72, 0.06, 0.23], [0, 3.14, 2.05], materials.white, null, false);
    addBox(rv, [0.72, 0.06, 0.23], [0, 3.14, -2.15], materials.white, null, false);

    addBox(rv, [0.58, 1.05, 2.1], [-1.22, 1.0, 1.8], materials.wood);
    addBox(rv, [0.73, 0.12, 2.14], [-1.18, 1.57, 1.8], materials.counter);
    addBox(rv, [0.04, 0.3, 0.04], [-1.14, 1.77, 2.28], materials.metal, [0, 0, -0.65], false);
    const sink = addCylinder(rv, 0.25, 0.25, 0.05, 20, [-1.15, 1.65, 2.35], materials.metal, [Math.PI / 2, 0, 0], false);
    sink.scale.z = 1.4;
    for (const z of [1.18, 1.62]) {
      addCylinder(rv, 0.15, 0.15, 0.035, 20, [-1.16, 1.67, z], materials.black, [Math.PI / 2, 0, 0], false);
    }
    addBox(rv, [0.65, 1.85, 0.92], [-1.2, 1.4, -0.05], materials.white);
    addBox(rv, [0.69, 0.04, 0.78], [-0.84, 1.5, -0.05], materials.metal, [0, 0, Math.PI / 2], false);

    addBox(rv, [1.05, 0.72, 2.2], [1.0, 0.88, 2.3], materials.fabric);
    addBox(rv, [0.3, 0.95, 2.2], [1.43, 1.25, 2.3], materials.fabric);
    addBox(rv, [0.14, 1.12, 1.55], [-1.47, 2.12, -1.45], materials.black, null, false);

    const tvCanvas = document.createElement('canvas');
    tvCanvas.width = 512;
    tvCanvas.height = 288;
    world.tvContext = tvCanvas.getContext('2d');
    world.tvTexture = new THREE.CanvasTexture(tvCanvas);
    world.tvTexture.encoding = THREE.sRGBEncoding;
    const tvMaterial = new THREE.MeshBasicMaterial({ map: world.tvTexture, color: 0x111111 });
    world.tvScreen = addBox(rv, [0.035, 0.88, 1.4], [-1.54, 2.15, -1.42], tvMaterial, null, false);

    addBox(rv, [2.85, 0.58, 2.0], [0, 0.78, -2.93], materials.wood);
    addBox(rv, [2.77, 0.34, 1.92], [0, 1.2, -2.93], materials.fabric);
    addBox(rv, [0.72, 0.23, 0.48], [-0.7, 1.48, -3.35], materials.white, null, false);
    addBox(rv, [0.72, 0.23, 0.48], [0.7, 1.48, -3.35], materials.white, null, false);

    addBox(rv, [1.35, 2.55, 0.08], [0.87, 1.72, -0.65], materials.interiorWall, null, false);
    addBox(rv, [0.08, 2.55, 1.42], [0.2, 1.72, -1.32], materials.interiorWall, null, false);
    const showerMaterial = new THREE.MeshStandardMaterial({ color: 0x8fb2b9, transparent: true, opacity: 0.3, roughness: 0.1, side: THREE.DoubleSide });
    addBox(rv, [0.05, 2.15, 1.05], [1.18, 1.55, -1.95], showerMaterial, null, false);
    addCylinder(rv, 0.3, 0.38, 0.48, 18, [0.72, 0.72, -0.85], materials.white);
    addBox(rv, [0.68, 0.17, 0.72], [0.72, 1.05, -0.85], materials.white);
    addCylinder(rv, 0.04, 0.04, 1.4, 8, [1.42, 2.1, -2.1], materials.metal, null, false);
    addCylinder(rv, 0.18, 0.18, 0.04, 16, [1.32, 2.65, -2.1], materials.metal, [0, 0, Math.PI / 2], false);

    addBox(rv, [0.9, 1.2, 1.0], [1.05, 1.12, 0.25], materials.wood);
    addBox(rv, [0.92, 0.08, 1.02], [1.05, 1.75, 0.25], materials.counter);
    addBox(rv, [0.07, 0.6, 0.55], [0.58, 1.35, 0.25], materials.darkMetal, null, false);

    world.interactables = [
      { id: 'stove', x: -1.0, z: 1.35, radius: 2.15, label: 'USE STOVE', title: 'RV Kitchen', description: 'Cook a hot meal using one raw food and one wood.', type: 'rv' },
      { id: 'fridge', x: -1.0, z: -0.05, radius: 1.9, label: 'OPEN FRIDGE', title: 'Fridge', description: 'Check your food and water supplies.', type: 'rv' },
      { id: 'tv', x: -0.9, z: -1.42, radius: 2.1, label: 'USE TV', title: 'Weather Television', description: 'Watch the emergency weather and survival broadcast.', type: 'rv' },
      { id: 'bed', x: 0, z: -2.65, radius: 2.25, label: 'USE BED', title: 'Bedroom', description: 'Sleep safely until the next dim morning.', type: 'rv' },
      { id: 'shower', x: 0.95, z: -1.8, radius: 1.8, label: 'USE SHOWER', title: 'Washroom', description: 'Use one stored water to wash and recover a little health.', type: 'rv' },
      { id: 'storage', x: 0.95, z: 0.28, radius: 1.8, label: 'OPEN STORAGE', title: 'RV Storage', description: 'Manage the supplies in your backpack.', type: 'rv' }
    ];

    updateTVScreen(false);
    scene.add(rv);
  }

  function updateTVScreen(on) {
    if (!world.tvContext || !world.tvTexture) return;
    const g = world.tvContext;
    g.fillStyle = on ? '#102128' : '#050707';
    g.fillRect(0, 0, 512, 288);
    if (on) {
      const gradient = g.createLinearGradient(0, 0, 512, 288);
      gradient.addColorStop(0, '#1e5f68');
      gradient.addColorStop(1, '#172c36');
      g.fillStyle = gradient;
      g.fillRect(0, 0, 512, 288);
      g.fillStyle = '#f0b45f';
      g.fillRect(0, 0, 512, 34);
      g.fillStyle = '#121a1c';
      g.font = 'bold 19px sans-serif';
      g.fillText('VALLEY EMERGENCY NETWORK', 18, 24);
      g.fillStyle = '#eef4ef';
      g.font = 'bold 34px sans-serif';
      g.fillText(state && isNight() ? 'LONG NIGHT ACTIVE' : 'DIM DAYLIGHT', 26, 96);
      g.font = '21px sans-serif';
      g.fillStyle = '#cbd8d2';
      const weather = state ? state.weather.toUpperCase() : 'OVERCAST';
      g.fillText(`WEATHER: ${weather}`, 26, 138);
      g.fillText('THE RV REMAINS A SECURE SHELTER', 26, 177);
      g.fillStyle = '#83d3a4';
      g.fillRect(26, 211, 460, 3);
      g.font = '17px monospace';
      g.fillText('COLLECT WATER · FOOD · WOOD · AMMUNITION', 26, 249);
    }
    world.tvTexture.needsUpdate = true;
    if (world.tvScreen && world.tvScreen.material) world.tvScreen.material.color.setHex(on ? 0xffffff : 0x111111);
  }

  const weapon = {
    group: null,
    muzzle: null,
    muzzleLight: null,
    kick: 0,
    swayX: 0,
    swayY: 0,
    bob: 0,
    fireCooldown: 0,
    reloadTimer: 0,
    reloading: false
  };

  function buildWeapon() {
    const group = new THREE.Group();
    weapon.group = group;
    const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x24292b, metalness: 0.82, roughness: 0.32 });
    const gunEdge = new THREE.MeshStandardMaterial({ color: 0x4e5658, metalness: 0.7, roughness: 0.28 });
    const gripMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1d1c, roughness: 0.84 });
    const handMaterial = new THREE.MeshStandardMaterial({ color: 0xb98561, roughness: 0.9 });

    addBox(group, [0.18, 0.22, 0.94], [0, 0, -0.37], gunMaterial, null, false);
    addBox(group, [0.2, 0.13, 0.42], [0, 0.15, -0.42], gunEdge, null, false);
    addBox(group, [0.12, 0.32, 0.23], [0, -0.22, -0.16], gripMaterial, [-0.18, 0, 0], false);
    addBox(group, [0.13, 0.42, 0.18], [0, -0.29, -0.46], gunMaterial, [0.08, 0, 0], false);
    addBox(group, [0.08, 0.1, 0.34], [0, 0.2, -0.57], gunEdge, null, false);
    addBox(group, [0.055, 0.09, 0.05], [0, 0.27, -0.34], gunEdge, null, false);
    addBox(group, [0.055, 0.1, 0.05], [0, 0.27, -0.73], gunEdge, null, false);
    addCylinder(group, 0.055, 0.055, 0.7, 12, [0, 0.01, -1.17], gunMaterial, [Math.PI / 2, 0, 0], false);
    addCylinder(group, 0.072, 0.072, 0.16, 12, [0, 0.01, -1.59], gunEdge, [Math.PI / 2, 0, 0], false);
    addBox(group, [0.11, 0.08, 0.42], [-0.15, -0.04, -0.83], gripMaterial, null, false);

    addCylinder(group, 0.115, 0.09, 0.78, 10, [0.19, -0.43, 0.0], handMaterial, [1.08, 0, -0.2], false);
    addBox(group, [0.23, 0.19, 0.28], [0.06, -0.19, -0.11], handMaterial, [0.1, 0, 0], false);
    addCylinder(group, 0.11, 0.09, 0.82, 10, [-0.29, -0.39, -0.54], handMaterial, [1.16, 0, 0.24], false);
    addBox(group, [0.23, 0.18, 0.31], [-0.14, -0.11, -0.73], handMaterial, [0.05, 0, 0], false);

    weapon.muzzle = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.38, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0, depthWrite: false })
    );
    weapon.muzzle.rotation.x = -Math.PI / 2;
    weapon.muzzle.position.set(0, 0.01, -1.74);
    group.add(weapon.muzzle);
    weapon.muzzleLight = new THREE.PointLight(0xffbd67, 0, 4.5, 2);
    weapon.muzzleLight.position.set(0, 0, -1.65);
    group.add(weapon.muzzleLight);

    group.position.set(0.4, -0.41, -0.64);
    group.rotation.set(-0.035, -0.035, -0.015);
    group.traverse((object) => {
      if (object.isMesh) {
        object.frustumCulled = false;
        object.renderOrder = 20;
        if (object.material) {
          object.material.depthTest = false;
          object.material.depthWrite = false;
        }
      }
    });
    camera.add(group);
  }

  const ITEMS = {
    rawFood: { name: 'Raw food', icon: '🥫', max: 5, use: 'EAT' },
    cookedFood: { name: 'Cooked meal', icon: '🍲', max: 4, use: 'EAT' },
    water: { name: 'Clean water', icon: '💧', max: 5, use: 'DRINK' },
    wood: { name: 'Wood', icon: '🪵', max: 10 },
    scrap: { name: 'Scrap metal', icon: '🔩', max: 10 },
    cloth: { name: 'Cloth', icon: '🧵', max: 8 },
    ammo: { name: 'Rifle rounds', icon: '▰', max: 60 },
    bandage: { name: 'Bandage', icon: '✚', max: 5, use: 'USE' },
    battery: { name: 'Battery', icon: '🔋', max: 4 }
  };
  const SLOT_COUNT = 20;

  function createStartingSlots() {
    const slots = new Array(SLOT_COUNT).fill(null);
    slots[0] = { type: 'rawFood', count: 2 };
    slots[1] = { type: 'water', count: 3 };
    slots[2] = { type: 'wood', count: 2 };
    slots[3] = { type: 'scrap', count: 2 };
    slots[4] = { type: 'cloth', count: 2 };
    slots[5] = { type: 'ammo', count: 48 };
    slots[6] = { type: 'bandage', count: 1 };
    return slots;
  }

  function createState(seed) {
    return {
      version: 2,
      seed,
      day: 1,
      time: CYCLE_SECONDS * 0.14,
      weather: 'overcast',
      previousNight: false,
      player: {
        x: 0.15,
        y: 1.66,
        z: 2.55,
        yaw: Math.PI / 2,
        pitch: 0,
        inRV: true,
        health: 100,
        hunger: 100,
        thirst: 100,
        stamina: 100,
        hurt: 0
      },
      slots: createStartingSlots(),
      magazine: 30,
      tvOn: false,
      flashlightOn: true,
      stats: { eliminations: 0, crates: 0, nights: 0 },
      openedCrates: [],
      treeWood: {},
      lastSaved: Date.now()
    };
  }

  let state = createState((Math.random() * 0xffffffff) >>> 0);

  function countItem(type) {
    let total = 0;
    for (const slot of state.slots) if (slot && slot.type === type) total += slot.count;
    return total;
  }

  function occupiedSlots() {
    return state.slots.reduce((total, slot) => total + (slot ? 1 : 0), 0);
  }

  function addItem(type, amount, announce = true) {
    if (!ITEMS[type] || amount <= 0) return amount;
    let remaining = amount;
    for (const slot of state.slots) {
      if (slot && slot.type === type && slot.count < ITEMS[type].max) {
        const moved = Math.min(remaining, ITEMS[type].max - slot.count);
        slot.count += moved;
        remaining -= moved;
        if (!remaining) break;
      }
    }
    for (let i = 0; i < state.slots.length && remaining > 0; i += 1) {
      if (!state.slots[i]) {
        const moved = Math.min(remaining, ITEMS[type].max);
        state.slots[i] = { type, count: moved };
        remaining -= moved;
      }
    }
    const collected = amount - remaining;
    if (announce && collected > 0) toast(`+${collected} ${ITEMS[type].name}`, 'good');
    if (remaining > 0) toast('Your backpack is full.', 'warn');
    return remaining;
  }

  function removeItem(type, amount) {
    if (countItem(type) < amount) return false;
    let remaining = amount;
    for (let i = 0; i < state.slots.length && remaining > 0; i += 1) {
      const slot = state.slots[i];
      if (!slot || slot.type !== type) continue;
      const moved = Math.min(remaining, slot.count);
      slot.count -= moved;
      remaining -= moved;
      if (slot.count <= 0) state.slots[i] = null;
    }
    return true;
  }

  function useSlot(index) {
    const slot = state.slots[index];
    if (!slot) return;
    if (slot.type === 'rawFood') {
      removeItem('rawFood', 1);
      state.player.hunger = clamp(state.player.hunger + 20, 0, 100);
      toast('You eat the food cold.', 'good');
    } else if (slot.type === 'cookedFood') {
      removeItem('cookedFood', 1);
      state.player.hunger = clamp(state.player.hunger + 58, 0, 100);
      state.player.health = clamp(state.player.health + 8, 0, 100);
      toast('The hot meal restores you.', 'good');
    } else if (slot.type === 'water') {
      removeItem('water', 1);
      state.player.thirst = clamp(state.player.thirst + 55, 0, 100);
      toast('You drink clean water.', 'good');
    } else if (slot.type === 'bandage') {
      if (state.player.health >= 100) {
        toast('Your health is already full.');
        return;
      }
      removeItem('bandage', 1);
      state.player.health = clamp(state.player.health + 38, 0, 100);
      toast('Bandage applied.', 'good');
    }
    selectedSlot = -1;
    audio.pickup();
    renderInventory();
  }

  function dropSlot(index) {
    if (!state.slots[index]) return;
    const name = ITEMS[state.slots[index].type].name;
    state.slots[index] = null;
    selectedSlot = -1;
    toast(`${name} dropped.`);
    renderInventory();
  }

  const RECIPES = {
    ammo: { name: '15 rifle rounds', result: ['ammo', 15], cost: { scrap: 2, wood: 1 } },
    bandage: { name: 'Bandage', result: ['bandage', 1], cost: { cloth: 2 } },
    battery: { name: 'Battery', result: ['battery', 1], cost: { scrap: 2, cloth: 1 } }
  };

  function canCraft(recipe) {
    return Object.entries(recipe.cost).every(([type, amount]) => countItem(type) >= amount);
  }

  function craft(recipeId) {
    const recipe = RECIPES[recipeId];
    if (!recipe || !canCraft(recipe)) {
      toast('You do not have the required materials.', 'warn');
      return;
    }
    for (const [type, amount] of Object.entries(recipe.cost)) removeItem(type, amount);
    addItem(recipe.result[0], recipe.result[1]);
    audio.pickup();
    renderInventory();
  }

  function renderInventory() {
    if (!modalOpen || UI.modalKicker.textContent !== 'BACKPACK') return;
    const grid = document.createElement('div');
    grid.id = 'si-inventory-grid';
    state.slots.forEach((slot, index) => {
      const button = document.createElement('button');
      button.className = `si-slot${slot ? '' : ' empty'}${selectedSlot === index ? ' selected' : ''}`;
      if (slot) {
        const item = ITEMS[slot.type];
        button.innerHTML = `<span class="si-slot-icon">${item.icon}</span><span class="si-slot-name">${item.name}</span><span class="si-slot-count">${slot.count}</span>`;
        button.onclick = () => { selectedSlot = selectedSlot === index ? -1 : index; renderInventory(); };
      } else {
        button.innerHTML = '<span class="si-slot-icon">·</span>';
        button.disabled = true;
      }
      grid.appendChild(button);
    });

    const actions = document.createElement('div');
    actions.id = 'si-item-actions';
    const selected = state.slots[selectedSlot];
    if (!selected) {
      actions.textContent = 'Select an item to use or drop it.';
    } else {
      const label = document.createElement('span');
      label.textContent = `${ITEMS[selected.type].icon} ${ITEMS[selected.type].name} ×${selected.count}`;
      actions.appendChild(label);
      if (ITEMS[selected.type].use) {
        const use = document.createElement('button');
        use.className = 'si-mini-button';
        use.textContent = ITEMS[selected.type].use;
        use.onclick = () => useSlot(selectedSlot);
        actions.appendChild(use);
      }
      const drop = document.createElement('button');
      drop.className = 'si-mini-button';
      drop.textContent = 'DROP STACK';
      drop.onclick = () => dropSlot(selectedSlot);
      actions.appendChild(drop);
    }

    const craftTitle = document.createElement('div');
    craftTitle.className = 'si-craft-title';
    craftTitle.textContent = 'Craft supplies';
    const recipeList = document.createElement('div');
    recipeList.className = 'si-craft-list';
    for (const [id, recipe] of Object.entries(RECIPES)) {
      const recipeNode = document.createElement('div');
      recipeNode.className = 'si-recipe';
      const cost = Object.entries(recipe.cost).map(([type, amount]) => `${amount} ${ITEMS[type].name.toLowerCase()}`).join(' · ');
      recipeNode.innerHTML = `<b>${recipe.name}</b><span>${cost}</span>`;
      const button = document.createElement('button');
      button.className = 'si-mini-button';
      button.textContent = 'CRAFT';
      button.disabled = !canCraft(recipe);
      button.onclick = () => craft(id);
      recipeNode.appendChild(button);
      recipeList.appendChild(recipeNode);
    }

    UI.modalBody.replaceChildren(grid, actions, craftTitle, recipeList);
    UI.packCount.textContent = `${occupiedSlots()} / ${SLOT_COUNT}`;
  }

  function openInventory() {
    if (!gameStarted) return;
    modalOpen = true;
    paused = true;
    selectedSlot = -1;
    UI.modalKicker.textContent = 'BACKPACK';
    UI.modalTitle.textContent = `Supplies · ${occupiedSlots()} of ${SLOT_COUNT} slots`;
    UI.modal.classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
    renderInventory();
  }

  function closeModal() {
    UI.modal.classList.add('hidden');
    modalOpen = false;
    paused = false;
    selectedSlot = -1;
  }

  function showInteraction(interactable) {
    modalOpen = true;
    paused = true;
    UI.interactionKicker.textContent = interactable.type === 'rv' ? 'RV INTERIOR · DOORS LOCKED' : 'SURVIVAL ACTION';
    UI.interactionTitle.textContent = interactable.title;
    UI.interactionText.textContent = interactable.description;
    UI.interactionActions.replaceChildren();

    const addAction = (label, action, disabled = false) => {
      const button = document.createElement('button');
      button.className = 'si-primary';
      button.textContent = label;
      button.disabled = disabled;
      button.onclick = action;
      UI.interactionActions.appendChild(button);
    };

    if (interactable.id === 'stove') {
      addAction('COOK ONE HOT MEAL · 1 RAW FOOD + 1 WOOD', () => {
        if (countItem('rawFood') < 1 || countItem('wood') < 1) return;
        removeItem('rawFood', 1);
        removeItem('wood', 1);
        addItem('cookedFood', 1);
        audio.cook();
        closeInteraction();
      }, countItem('rawFood') < 1 || countItem('wood') < 1);
      addAction('EAT A COOKED MEAL', () => {
        const index = state.slots.findIndex((slot) => slot && slot.type === 'cookedFood');
        if (index >= 0) useSlot(index);
        closeInteraction();
      }, countItem('cookedFood') < 1);
    } else if (interactable.id === 'bed') {
      addAction('SLEEP SAFELY UNTIL DIM MORNING', () => {
        state.day += 1;
        state.stats.nights += 1;
        state.time = CYCLE_SECONDS * 0.13;
        state.player.health = 100;
        state.player.stamina = 100;
        state.player.hunger = clamp(state.player.hunger - 12, 10, 100);
        state.player.thirst = clamp(state.player.thirst - 15, 10, 100);
        startNewDay();
        saveGame();
        closeInteraction();
        toast('You wake to another dim morning. The RV kept you safe.', 'good');
      });
      addAction('REST AND RECOVER 25 HEALTH', () => {
        state.player.health = clamp(state.player.health + 25, 0, 100);
        state.time = (state.time + 20) % CYCLE_SECONDS;
        closeInteraction();
        toast('You rest inside the locked RV.', 'good');
      });
    } else if (interactable.id === 'tv') {
      addAction(state.tvOn ? 'TURN TELEVISION OFF' : 'WATCH WEATHER BROADCAST', () => {
        state.tvOn = !state.tvOn;
        updateTVScreen(state.tvOn);
        audio.switch();
        closeInteraction();
        toast(state.tvOn ? 'Emergency broadcast playing.' : 'Television switched off.');
      });
    } else if (interactable.id === 'shower') {
      addAction('USE SHOWER · 1 CLEAN WATER', () => {
        if (!removeItem('water', 1)) return;
        state.player.health = clamp(state.player.health + 12, 0, 100);
        state.player.stamina = 100;
        closeInteraction();
        toast('You wash and recover inside the safe RV.', 'good');
      }, countItem('water') < 1);
    } else if (interactable.id === 'fridge' || interactable.id === 'storage') {
      addAction('OPEN BACKPACK AND SUPPLIES', () => {
        closeInteraction();
        openInventory();
      });
    }

    UI.interaction.classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
  }

  function closeInteraction() {
    UI.interaction.classList.add('hidden');
    modalOpen = false;
    paused = false;
  }

  function saveGame() {
    if (!gameStarted) return;
    state.openedCrates = world.crates.filter((crate) => crate.opened).map((crate) => crate.id);
    state.treeWood = {};
    for (const tree of world.trees) if (tree.wood < 3) state.treeWood[tree.id] = tree.wood;
    state.lastSaved = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (error) {
      toast('This browser could not save the game.', 'warn');
    }
  }

  function loadSavedState() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!saved || saved.version !== 2 || !Array.isArray(saved.slots)) return null;
      return saved;
    } catch (error) {
      return null;
    }
  }

  function applySavedWorld() {
    const opened = new Set(state.openedCrates || []);
    for (const crate of world.crates) {
      if (opened.has(crate.id)) {
        crate.opened = true;
        crate.lidPivot.rotation.x = -1.3;
      }
    }
    for (const tree of world.trees) {
      if (Object.prototype.hasOwnProperty.call(state.treeWood || {}, tree.id)) {
        tree.wood = state.treeWood[tree.id];
        if (tree.wood <= 0) removeTreeVisual(tree);
      }
    }
    updateTVScreen(state.tvOn);
  }

  const enemyGeometry = {
    head: new THREE.SphereGeometry(0.23, 10, 8),
    torso: new THREE.BoxGeometry(0.48, 0.78, 0.3),
    arm: new THREE.CylinderGeometry(0.075, 0.09, 0.66, 7),
    leg: new THREE.CylinderGeometry(0.095, 0.11, 0.72, 7)
  };
  const enemyMaterials = {
    daySkin: new THREE.MeshStandardMaterial({ color: 0x65705c, roughness: 0.98 }),
    nightSkin: new THREE.MeshStandardMaterial({ color: 0x4f5363, roughness: 0.98 }),
    coat: new THREE.MeshStandardMaterial({ color: 0x3c453e, roughness: 1 }),
    nightCoat: new THREE.MeshStandardMaterial({ color: 0x2e303b, roughness: 1 }),
    eyes: new THREE.MeshBasicMaterial({ color: 0xff674a })
  };

  function createEnemy(x, z, night = false) {
    const group = new THREE.Group();
    const skin = night ? enemyMaterials.nightSkin : enemyMaterials.daySkin;
    const coat = night ? enemyMaterials.nightCoat : enemyMaterials.coat;
    const torso = new THREE.Mesh(enemyGeometry.torso, coat);
    torso.position.y = 1.15;
    const head = new THREE.Mesh(enemyGeometry.head, skin);
    head.position.y = 1.78;
    const leftArm = new THREE.Mesh(enemyGeometry.arm, skin);
    const rightArm = new THREE.Mesh(enemyGeometry.arm, skin);
    leftArm.position.set(-0.33, 1.3, -0.08);
    rightArm.position.set(0.33, 1.3, -0.08);
    leftArm.rotation.x = rightArm.rotation.x = -1.12;
    const leftLeg = new THREE.Mesh(enemyGeometry.leg, coat);
    const rightLeg = new THREE.Mesh(enemyGeometry.leg, coat);
    leftLeg.position.set(-0.13, 0.42, 0);
    rightLeg.position.set(0.13, 0.42, 0);
    const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.034, 6, 5), enemyMaterials.eyes);
    const eyeRight = eyeLeft.clone();
    eyeLeft.position.set(-0.075, 1.82, -0.205);
    eyeRight.position.set(0.075, 1.82, -0.205);
    group.add(torso, head, leftArm, rightArm, leftLeg, rightLeg, eyeLeft, eyeRight);
    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * TAU;
    scene.add(group);

    const enemy = {
      id: `${Date.now()}-${Math.random()}`,
      x,
      z,
      yaw: group.rotation.y,
      group,
      head,
      torso,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      night,
      health: night ? 125 : 92,
      speed: night ? 2.65 : 1.48,
      attackTimer: Math.random(),
      wanderTimer: Math.random() * 4,
      wanderYaw: Math.random() * TAU,
      alert: 0,
      dead: false,
      deadTimer: 0,
      phase: Math.random() * TAU,
      growlTimer: 4 + Math.random() * 10
    };
    for (const object of [torso, head, leftArm, rightArm, leftLeg, rightLeg]) {
      object.castShadow = true;
      object.userData.enemy = enemy;
      object.userData.hitPart = object === head ? 'head' : 'body';
      world.enemyHitMeshes.push(object);
    }
    world.enemies.push(enemy);
    return enemy;
  }

  function randomSpawnPoint(minDistance = 30, maxDistance = 72) {
    const originX = state.player.inRV ? RV.x : state.player.x;
    const originZ = state.player.inRV ? RV.z : state.player.z;
    for (let attempt = 0; attempt < 15; attempt += 1) {
      const angle = Math.random() * TAU;
      const distance = minDistance + Math.random() * (maxDistance - minDistance);
      const x = clamp(originX + Math.sin(angle) * distance, -WORLD_SIZE + 6, WORLD_SIZE - 6);
      const z = clamp(originZ + Math.cos(angle) * distance, -WORLD_SIZE + 6, WORLD_SIZE - 6);
      if (Math.abs(x) < 10 && Math.abs(z) < 13) continue;
      if (!isOutsideBlocked(x, z, 0.35)) return [x, z];
    }
    return [45 + Math.random() * 20, 45 + Math.random() * 20];
  }

  function ensureEnemyPopulation(force = false) {
    if (!gameStarted) return;
    const night = isNight();
    const living = world.enemies.filter((enemy) => !enemy.dead).length;
    const target = night ? (coarsePointer ? 18 : 22) : (coarsePointer ? 9 : 12);
    const addCount = force ? Math.max(0, target - living) : living < target ? 1 : 0;
    for (let i = 0; i < addCount; i += 1) {
      const [x, z] = randomSpawnPoint(night ? 24 : 36, night ? 62 : 82);
      createEnemy(x, z, night);
    }
  }

  function removeEnemy(enemy) {
    scene.remove(enemy.group);
    enemy.group.visible = false;
    world.enemyHitMeshes = world.enemyHitMeshes.filter((mesh) => mesh.userData.enemy !== enemy);
  }

  function updateEnemies(dt) {
    const player = state.player;
    const night = isNight();
    for (const enemy of world.enemies) {
      if (enemy.dead) {
        enemy.deadTimer += dt;
        enemy.group.rotation.z = lerp(enemy.group.rotation.z, Math.PI / 2, smooth(5, dt));
        enemy.group.position.y = -Math.min(0.5, enemy.deadTimer * 0.24);
        if (enemy.deadTimer > 2.2 && enemy.group.visible) removeEnemy(enemy);
        continue;
      }

      const dx = player.x - enemy.x;
      const dz = player.z - enemy.z;
      const distance = Math.hypot(dx, dz);
      enemy.attackTimer -= dt;
      enemy.growlTimer -= dt;

      if (player.inRV) {
        enemy.alert = Math.max(0, enemy.alert - dt * 2.2);
      } else if (distance < (night ? 36 : 19) || enemy.alert > 0) {
        enemy.alert = Math.max(enemy.alert, 6);
      }

      let moveYaw = enemy.wanderYaw;
      let speed = enemy.speed * 0.22;
      if (!player.inRV && enemy.alert > 0) {
        enemy.alert -= dt;
        moveYaw = Math.atan2(dx, dz);
        speed = enemy.speed * (night ? 1.24 : 1);
        if (distance < 1.45) {
          speed = 0;
          if (enemy.attackTimer <= 0) {
            enemy.attackTimer = night ? 0.92 : 1.2;
            damagePlayer(night ? 14 : 9);
          }
        }
      } else {
        enemy.wanderTimer -= dt;
        if (enemy.wanderTimer <= 0) {
          enemy.wanderTimer = 2.5 + Math.random() * 4.5;
          enemy.wanderYaw = Math.random() * TAU;
        }
      }

      enemy.yaw = angleLerp(enemy.yaw, moveYaw, smooth(4.5, dt));
      if (speed > 0) {
        let nextX = enemy.x + Math.sin(enemy.yaw) * speed * dt;
        let nextZ = enemy.z + Math.cos(enemy.yaw) * speed * dt;
        if (!isOutsideBlocked(nextX, nextZ, 0.32)) {
          enemy.x = nextX;
          enemy.z = nextZ;
        } else {
          enemy.wanderYaw += Math.PI * (0.35 + Math.random() * 0.3);
        }
      }

      enemy.phase += dt * (speed > enemy.speed * 0.5 ? 8.5 : 3.2);
      const swing = Math.sin(enemy.phase) * (speed > enemy.speed * 0.5 ? 0.65 : 0.24);
      enemy.leftLeg.rotation.x = swing;
      enemy.rightLeg.rotation.x = -swing;
      enemy.leftArm.rotation.x = -1.05 - swing * 0.25;
      enemy.rightArm.rotation.x = -1.05 + swing * 0.25;
      enemy.group.position.set(enemy.x, Math.abs(Math.sin(enemy.phase)) * 0.025, enemy.z);
      enemy.group.rotation.y = enemy.yaw;

      if (!player.inRV && distance < 11 && enemy.growlTimer <= 0) {
        enemy.growlTimer = 7 + Math.random() * 9;
        audio.enemy();
      }

      if (distance > 120 && !player.inRV) {
        removeEnemy(enemy);
        enemy.dead = true;
        enemy.deadTimer = 3;
      }
    }
    world.enemies = world.enemies.filter((enemy) => enemy.group.visible || enemy.deadTimer < 3);
  }

  function angleLerp(current, target, amount) {
    let delta = (target - current) % TAU;
    if (delta > Math.PI) delta -= TAU;
    if (delta < -Math.PI) delta += TAU;
    return current + delta * amount;
  }

  function damagePlayer(amount) {
    if (state.player.inRV) return;
    state.player.health = Math.max(0, state.player.health - amount);
    state.player.hurt = 0.55;
    UI.damage.style.opacity = '0.78';
    audio.hit();
    if (navigator.vibrate) navigator.vibrate(32);
    if (state.player.health <= 0) recoverInsideRV();
  }

  function recoverInsideRV() {
    state.player.inRV = true;
    state.player.x = 0.1;
    state.player.z = 2.45;
    state.player.yaw = Math.PI / 2;
    state.player.pitch = 0;
    state.player.health = 68;
    state.player.hunger = Math.max(24, state.player.hunger);
    state.player.thirst = Math.max(24, state.player.thirst);
    state.day += 1;
    state.time = CYCLE_SECONDS * 0.13;
    startNewDay();
    updateRVState();
    saveGame();
    toast('You recover inside the locked RV. Some time has passed.', 'warn');
  }

  const raycaster = new THREE.Raycaster();
  const rayOrigin = new THREE.Vector3();
  const rayDirection = new THREE.Vector3();
  let tracer = null;
  let tracerTimer = 0;

  function fireWeapon() {
    if (!gameStarted || paused || modalOpen || weapon.reloading || weapon.fireCooldown > 0) return;
    if (state.player.inRV) {
      weapon.fireCooldown = 0.35;
      toast('Weapon safety is active inside the RV.');
      return;
    }
    if (state.magazine <= 0) {
      weapon.fireCooldown = 0.3;
      audio.tone(280, 180, 0.05, 'square', 0.08);
      if (countItem('ammo') > 0) startReload();
      else toast('No ammunition. Search crates or craft rounds.', 'warn');
      return;
    }

    state.magazine -= 1;
    weapon.fireCooldown = 0.115;
    weapon.kick = Math.min(1, weapon.kick + 0.52);
    state.player.pitch = clamp(state.player.pitch + 0.006 + Math.random() * 0.006, -1.25, 1.25);
    weapon.muzzle.material.opacity = 1;
    weapon.muzzleLight.intensity = 3.5;
    document.body.classList.add('firing');
    setTimeout(() => document.body.classList.remove('firing'), 80);
    audio.shot();
    if (navigator.vibrate) navigator.vibrate(18);

    camera.getWorldPosition(rayOrigin);
    camera.getWorldDirection(rayDirection);
    if (coarsePointer) applyAimAssist(rayOrigin, rayDirection);
    raycaster.set(rayOrigin, rayDirection);
    raycaster.far = 95;
    const hits = raycaster.intersectObjects(world.enemyHitMeshes, false);
    let hitPoint = rayOrigin.clone().addScaledVector(rayDirection, 75);
    for (const hit of hits) {
      const enemy = hit.object.userData.enemy;
      if (!enemy || enemy.dead || !enemy.group.visible) continue;
      hitPoint = hit.point.clone();
      const damage = hit.object.userData.hitPart === 'head' ? 68 : 38;
      enemy.health -= damage;
      enemy.alert = 10;
      showHitmarker();
      if (enemy.health <= 0) eliminateEnemy(enemy);
      break;
    }
    showTracer(rayOrigin, hitPoint);
  }

  function applyAimAssist(origin, direction) {
    let best = null;
    let bestDot = 0.982;
    const targetDirection = new THREE.Vector3();
    for (const enemy of world.enemies) {
      if (enemy.dead || !enemy.group.visible) continue;
      targetDirection.set(enemy.x, 1.55, enemy.z).sub(origin);
      const distance = targetDirection.length();
      if (distance > 32 || distance < 1.2) continue;
      targetDirection.normalize();
      const dot = targetDirection.dot(direction);
      if (dot > bestDot) {
        bestDot = dot;
        best = targetDirection.clone();
      }
    }
    if (best) direction.lerp(best, 0.42).normalize();
  }

  function showTracer(start, end) {
    if (tracer) scene.remove(tracer);
    const geometry = new THREE.BufferGeometry().setFromPoints([start.clone(), end.clone()]);
    const material = new THREE.LineBasicMaterial({ color: 0xffdf9b, transparent: true, opacity: 0.78 });
    tracer = new THREE.Line(geometry, material);
    scene.add(tracer);
    tracerTimer = 0.075;
  }

  function showHitmarker() {
    UI.hitmarker.classList.remove('on');
    void UI.hitmarker.offsetWidth;
    UI.hitmarker.classList.add('on');
  }

  function eliminateEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    enemy.deadTimer = 0;
    state.stats.eliminations += 1;
    audio.enemy();
    toast('Threat stopped.', 'good');
    if (Math.random() < 0.24) addItem('cloth', 1);
  }

  function startReload() {
    if (!gameStarted || paused || weapon.reloading || state.magazine >= 30 || countItem('ammo') <= 0) return;
    weapon.reloading = true;
    weapon.reloadTimer = 1.42;
    audio.reload();
    toast('Reloading...');
  }

  function finishReload() {
    const needed = 30 - state.magazine;
    const moved = Math.min(needed, countItem('ammo'));
    if (moved > 0) {
      removeItem('ammo', moved);
      state.magazine += moved;
    }
    weapon.reloading = false;
    weapon.reloadTimer = 0;
  }

  function removeTreeVisual(tree) {
    tree.active = false;
    tree.collider.active = false;
    const matrix = new THREE.Matrix4();
    matrix.makeScale(0.001, 0.001, 0.001);
    matrix.setPosition(tree.x, -3, tree.z);
    world.treeTrunks.setMatrixAt(tree.id, matrix);
    world.treeCrowns.setMatrixAt(tree.id, matrix);
    world.treeTrunks.instanceMatrix.needsUpdate = true;
    world.treeCrowns.instanceMatrix.needsUpdate = true;
  }

  function lootCrate(crate) {
    if (!crate || crate.opened) return;
    crate.opened = true;
    crate.lidPivot.rotation.x = -1.3;
    state.stats.crates += 1;
    if (crate.type === 'food') {
      addItem('rawFood', 1 + (Math.random() < 0.45 ? 1 : 0));
      if (Math.random() < 0.5) addItem('cloth', 1);
    } else if (crate.type === 'water') {
      addItem('water', 1 + (Math.random() < 0.35 ? 1 : 0));
      if (Math.random() < 0.35) addItem('battery', 1);
    } else {
      const roll = Math.random();
      if (roll < 0.24) addItem('ammo', 10 + Math.floor(Math.random() * 9));
      else if (roll < 0.46) addItem('scrap', 2 + Math.floor(Math.random() * 2));
      else if (roll < 0.63) addItem('cloth', 2);
      else if (roll < 0.79) addItem('bandage', 1);
      else if (roll < 0.91) addItem('water', 1);
      else addItem('rawFood', 1);
      if (Math.random() < 0.42) addItem('wood', 1);
    }
    audio.pickup();
    saveGame();
  }

  function chopTree(tree) {
    if (!tree || !tree.active || tree.wood <= 0) return;
    tree.wood -= 1;
    addItem('wood', 1);
    audio.noise(0.09, 0.12, 850);
    if (tree.wood <= 0) {
      removeTreeVisual(tree);
      toast('The tree is fully harvested.');
    } else {
      toast(`${tree.wood} wood remains on this tree.`);
    }
  }

  function facingScore(x, z) {
    const dx = x - state.player.x;
    const dz = z - state.player.z;
    const distance = Math.hypot(dx, dz) || 1;
    const forwardX = -Math.sin(state.player.yaw);
    const forwardZ = -Math.cos(state.player.yaw);
    return (dx / distance) * forwardX + (dz / distance) * forwardZ;
  }

  function findInteractable() {
    const player = state.player;
    let best = null;
    let bestScore = Infinity;
    if (player.inRV) {
      for (const item of world.interactables) {
        const distance = Math.hypot(item.x - player.x, item.z - player.z);
        const facing = facingScore(item.x, item.z);
        if (distance <= item.radius && facing > -0.05) {
          const score = distance - facing * 0.5;
          if (score < bestScore) { bestScore = score; best = item; }
        }
      }
      return best;
    }

    const doorDistance = Math.hypot(RV.doorX - player.x, RV.doorZ - player.z);
    if (doorDistance < 4.8) {
      best = { id: 'rvDoor', type: 'door', x: RV.doorX, z: RV.doorZ, label: 'ENTER RV · INSTANT SAFE ZONE' };
      bestScore = doorDistance;
    }
    for (const crate of world.crates) {
      if (crate.opened) continue;
      const distance = Math.hypot(crate.x - player.x, crate.z - player.z);
      if (distance < 2.35 && facingScore(crate.x, crate.z) > -0.1 && distance < bestScore) {
        best = { id: 'crate', type: 'crate', x: crate.x, z: crate.z, label: `SEARCH ${crate.type.toUpperCase()} CRATE`, ref: crate };
        bestScore = distance;
      }
    }
    for (const collider of nearbyColliders(player.x, player.z)) {
      if (!collider.active || collider.type !== 'tree' || !collider.ref.active) continue;
      const distance = Math.hypot(collider.x - player.x, collider.z - player.z);
      if (distance < 2.25 && facingScore(collider.x, collider.z) > -0.15 && distance < bestScore) {
        best = { id: 'tree', type: 'tree', x: collider.x, z: collider.z, label: 'CHOP WOOD', ref: collider.ref };
        bestScore = distance;
      }
    }
    return best;
  }

  let useCooldown = 0;
  function useCurrentInteractable() {
    if (!gameStarted || paused || useCooldown > 0) return;
    useCooldown = 0.28;
    const item = findInteractable();
    if (!item) {
      toast('Nothing close enough to use.');
      return;
    }
    if (item.id === 'rvDoor') enterRV();
    else if (item.type === 'crate') lootCrate(item.ref);
    else if (item.type === 'tree') chopTree(item.ref);
    else if (item.type === 'rv') showInteraction(item);
  }

  const interiorBlockers = [
    { minX: -1.55, maxX: -0.72, minZ: 0.62, maxZ: 2.92 },
    { minX: -1.55, maxX: -0.78, minZ: -0.62, maxZ: 0.5 },
    { minX: 0.48, maxX: 1.55, minZ: 1.04, maxZ: 3.35 },
    { minX: -1.5, maxX: 1.5, minZ: -4.0, maxZ: -2.28 },
    { minX: 0.18, maxX: 1.55, minZ: -2.55, maxZ: -0.56 },
    { minX: 0.48, maxX: 1.55, minZ: -0.32, maxZ: 0.82 }
  ];

  function isInsideBlocked(x, z, radius = 0.25) {
    if (x < -1.31 + radius || x > 1.31 - radius || z < -3.72 + radius || z > 3.55 - radius) return true;
    return interiorBlockers.some((box) => x > box.minX - radius && x < box.maxX + radius && z > box.minZ - radius && z < box.maxZ + radius);
  }

  function isOutsideBlocked(x, z, radius = 0.34) {
    if (Math.abs(x) > WORLD_SIZE || Math.abs(z) > WORLD_SIZE) return true;
    if (x > -RV.width / 2 - radius && x < RV.width / 2 + radius && z > -RV.length / 2 - radius && z < RV.length / 2 + 0.95 + radius) return true;
    for (const collider of nearbyColliders(x, z)) {
      if (!collider.active) continue;
      const dx = x - collider.x;
      const dz = z - collider.z;
      const combined = radius + collider.r;
      if (dx * dx + dz * dz < combined * combined) return true;
    }
    return false;
  }

  function movePlayer(dx, dz) {
    const player = state.player;
    const blocked = player.inRV ? isInsideBlocked : isOutsideBlocked;
    const radius = player.inRV ? 0.22 : 0.34;
    const nextX = player.x + dx;
    if (!blocked(nextX, player.z, radius)) player.x = nextX;
    const nextZ = player.z + dz;
    if (!blocked(player.x, nextZ, radius)) player.z = nextZ;
  }

  function enterRV() {
    if (state.player.inRV) return;
    const distance = Math.hypot(RV.doorX - state.player.x, RV.doorZ - state.player.z);
    if (distance > 5.2) {
      toast('Move closer to the RV door.', 'warn');
      return;
    }
    state.player.inRV = true;
    state.player.x = 0.12;
    state.player.z = 1.55;
    state.player.yaw = Math.PI / 2;
    state.player.pitch = 0;
    for (const enemy of world.enemies) enemy.alert = 0;
    audio.door();
    audio.lock();
    updateRVState();
    saveGame();
    toast('Doors locked automatically. You are completely safe inside.', 'good');
  }

  function exitRV() {
    if (!state.player.inRV) return;
    state.player.inRV = false;
    state.player.x = RV.doorX + 0.78;
    state.player.z = RV.doorZ;
    state.player.yaw = Math.PI / 2;
    state.player.pitch = 0;
    audio.door();
    updateRVState();
    toast(isNight() ? 'Outside during the long night. Stay close to the RV.' : 'Outside. Collect supplies before the light fades.', 'warn');
  }

  function toggleRV() {
    if (!gameStarted || paused) return;
    if (state.player.inRV) exitRV();
    else enterRV();
  }

  function updateRVState() {
    const safe = state.player.inRV;
    UI.zone.classList.toggle('safe', safe);
    UI.zoneText.textContent = safe ? 'RV SAFE ZONE · INVULNERABLE' : 'OUTSIDE · EXPOSED';
    UI.rvButton.textContent = safe ? 'OUTSIDE' : 'INSIDE';
    UI.rvButton.setAttribute('aria-label', safe ? 'Go outside' : 'Enter RV');
    world.rvLockLight.material.color.setHex(safe ? 0x69d395 : 0xe0a255);
    world.rvLockLight.material.emissive.setHex(safe ? 0x2e9c5d : 0xa45b20);
    flashlight.intensity = safe ? 0 : (state.flashlightOn ? 2.5 : 0);
  }

  function isNight() {
    const fraction = state.time / CYCLE_SECONDS;
    return fraction < DAY_START || fraction > DAY_END;
  }

  function dayLightStrength() {
    const fraction = state.time / CYCLE_SECONDS;
    if (fraction < DAY_START - 0.035 || fraction > DAY_END + 0.045) return 0;
    if (fraction < DAY_START + 0.055) return clamp((fraction - (DAY_START - 0.035)) / 0.09, 0, 1);
    if (fraction > DAY_END - 0.055) return clamp(((DAY_END + 0.045) - fraction) / 0.1, 0, 1);
    return 1;
  }

  function startNewDay() {
    const roll = Math.random();
    state.weather = roll < 0.42 ? 'overcast' : roll < 0.7 ? 'rain' : roll < 0.9 ? 'fog' : 'clear';
    state.previousNight = false;
    world.nightWaveDay = 0;
    for (const crate of world.crates) {
      if (crate.opened && Math.random() < 0.28) {
        crate.opened = false;
        crate.lidPivot.rotation.x = 0;
      }
    }
    for (const tree of world.trees) {
      if (!tree.active && Math.random() < 0.06) {
        tree.active = true;
        tree.wood = 3;
        tree.collider.active = true;
        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), tree.id * 0.37);
        const scale = new THREE.Vector3(tree.scale, tree.scale, tree.scale);
        matrix.compose(new THREE.Vector3(tree.x, 1.3 * tree.scale, tree.z), quaternion, scale);
        world.treeTrunks.setMatrixAt(tree.id, matrix);
        matrix.compose(new THREE.Vector3(tree.x, 4.1 * tree.scale, tree.z), quaternion, scale);
        world.treeCrowns.setMatrixAt(tree.id, matrix);
        world.treeTrunks.instanceMatrix.needsUpdate = true;
        world.treeCrowns.instanceMatrix.needsUpdate = true;
      }
    }
    updateTVScreen(state.tvOn);
    toast(`Day ${state.day}. ${state.weather === 'rain' ? 'Rain is moving through the forest.' : state.weather === 'fog' ? 'Heavy fog covers the valley.' : 'The daylight remains dim and cold.'}`, 'good');
  }

  function updateTimeAndSurvival(dt) {
    const wasNight = isNight();
    state.time += dt;
    if (state.time >= CYCLE_SECONDS) {
      state.time -= CYCLE_SECONDS;
      state.day += 1;
      startNewDay();
    }
    const night = isNight();
    if (!wasNight && night && world.nightWaveDay !== state.day) {
      world.nightWaveDay = state.day;
      state.stats.nights += 1;
      toast('The long night has started. More threats are moving through the forest.', 'warn');
      ensureEnemyPopulation(true);
      updateTVScreen(state.tvOn);
    }

    const safeMultiplier = state.player.inRV ? 0.14 : 1;
    state.player.hunger = Math.max(0, state.player.hunger - dt * 0.105 * safeMultiplier);
    state.player.thirst = Math.max(0, state.player.thirst - dt * 0.145 * safeMultiplier);
    if (!state.player.inRV) {
      if (state.player.hunger <= 0) state.player.health = Math.max(0, state.player.health - dt * 1.15);
      if (state.player.thirst <= 0) state.player.health = Math.max(0, state.player.health - dt * 1.65);
      if (state.player.health <= 0) recoverInsideRV();
    }
  }

  const input = {
    keys: Object.create(null),
    stickX: 0,
    stickY: 0,
    stickPointer: null,
    lookPointer: null,
    lookLastX: 0,
    lookLastY: 0,
    fireHeld: false
  };

  function updatePlayer(dt) {
    const player = state.player;
    let side = 0;
    let forward = 0;
    if (input.keys.KeyW || input.keys.ArrowUp) forward += 1;
    if (input.keys.KeyS || input.keys.ArrowDown) forward -= 1;
    if (input.keys.KeyD) side += 1;
    if (input.keys.KeyA) side -= 1;
    side += input.stickX;
    forward += -input.stickY;
    const length = Math.hypot(side, forward);
    const sprintRequested = !player.inRV && (input.keys.ShiftLeft || input.keys.ShiftRight || length > 1.08) && player.stamina > 4;
    let speed = player.inRV ? 2.15 : sprintRequested ? 6.2 : 4.05;
    if (isNight() && !player.inRV) speed *= 0.96;

    if (length > 0.06) {
      side /= Math.max(1, length);
      forward /= Math.max(1, length);
      const forwardX = -Math.sin(player.yaw);
      const forwardZ = -Math.cos(player.yaw);
      const rightX = Math.cos(player.yaw);
      const rightZ = -Math.sin(player.yaw);
      movePlayer((forwardX * forward + rightX * side) * speed * dt, (forwardZ * forward + rightZ * side) * speed * dt);
      weapon.bob += dt * (sprintRequested ? 11.5 : player.inRV ? 6.2 : 8.2);
      if (sprintRequested) player.stamina = Math.max(0, player.stamina - dt * 19);
    } else {
      weapon.bob += dt * 1.5;
      player.stamina = Math.min(100, player.stamina + dt * 15);
    }
    if (!sprintRequested) player.stamina = Math.min(100, player.stamina + dt * 8);

    const movingAmount = length > 0.06 ? 1 : 0;
    const bobY = reducedMotion ? 0 : Math.abs(Math.sin(weapon.bob)) * 0.035 * movingAmount;
    const bobX = reducedMotion ? 0 : Math.sin(weapon.bob * 0.5) * 0.022 * movingAmount;
    camera.position.set(player.x, player.y + bobY, player.z);
    camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');

    weapon.kick = Math.max(0, weapon.kick - dt * 7.5);
    const targetX = (player.inRV ? 0.37 : 0.4) + bobX + weapon.swayX;
    const targetY = (player.inRV ? -0.48 : -0.41) - bobY * 1.4 + weapon.swayY + weapon.kick * 0.055;
    const targetZ = (player.inRV ? -0.58 : -0.64) + weapon.kick * 0.13;
    weapon.group.position.x = lerp(weapon.group.position.x, targetX, smooth(13, dt));
    weapon.group.position.y = lerp(weapon.group.position.y, targetY, smooth(13, dt));
    weapon.group.position.z = lerp(weapon.group.position.z, targetZ, smooth(18, dt));
    weapon.group.rotation.x = -0.035 - weapon.kick * 0.09;
    weapon.group.rotation.z = -0.015 - bobX * 0.6;
    weapon.swayX *= Math.exp(-dt * 9);
    weapon.swayY *= Math.exp(-dt * 9);

    if (weapon.fireCooldown > 0) weapon.fireCooldown -= dt;
    if (weapon.reloading) {
      weapon.reloadTimer -= dt;
      weapon.group.rotation.z = -0.015 + Math.sin((1.42 - weapon.reloadTimer) * 4.2) * 0.38;
      weapon.group.position.y -= 0.18;
      if (weapon.reloadTimer <= 0) finishReload();
    }
    if (input.fireHeld) fireWeapon();
    if (useCooldown > 0) useCooldown -= dt;

    weapon.muzzle.material.opacity = Math.max(0, weapon.muzzle.material.opacity - dt * 22);
    weapon.muzzleLight.intensity = Math.max(0, weapon.muzzleLight.intensity - dt * 32);
    if (tracerTimer > 0) {
      tracerTimer -= dt;
      if (tracer && tracer.material) tracer.material.opacity = clamp(tracerTimer / 0.075, 0, 1) * 0.78;
      if (tracerTimer <= 0 && tracer) {
        scene.remove(tracer);
        tracer.geometry.dispose();
        tracer.material.dispose();
        tracer = null;
      }
    }

    if (player.hurt > 0) {
      player.hurt -= dt;
      UI.damage.style.opacity = String(clamp(player.hurt / 0.55, 0, 1) * 0.78);
    } else {
      UI.damage.style.opacity = '0';
    }
  }

  let lightning = 0;
  function updateAtmosphere(dt) {
    const light = dayLightStrength();
    const nightAmount = 1 - light;
    SKY.current.copy(SKY.night).lerp(SKY.day, light * 0.72);
    if (state.weather === 'rain') SKY.current.lerp(SKY.storm, 0.62);
    if (state.weather === 'fog') SKY.current.lerp(new THREE.Color(0x606867), light * 0.24);
    scene.background.copy(SKY.current);
    scene.fog.color.copy(SKY.current);
    scene.fog.density = (0.013 + nightAmount * 0.015) + (state.weather === 'fog' ? 0.011 : state.weather === 'rain' ? 0.003 : 0);
    hemisphere.intensity = 0.1 + light * 0.44;
    sun.intensity = 0.035 + light * (state.weather === 'clear' ? 0.58 : 0.38);
    moonLight.intensity = 0.035 + nightAmount * 0.16;
    renderer.toneMappingExposure = state.player.inRV ? 1.08 : 0.72 + light * 0.24;
    world.stars.material.opacity = nightAmount * 0.9;
    world.moon.material.opacity = nightAmount * 0.86;
    for (const lightObject of world.interiorLights) lightObject.intensity = state.player.inRV ? 1.25 : 0.16;
    flashlight.intensity = state.player.inRV ? 0 : (state.flashlightOn ? 1.65 + nightAmount * 1.25 : 0);

    const followX = state.player.inRV ? RV.x : state.player.x;
    const followZ = state.player.inRV ? RV.z : state.player.z;
    sun.position.set(followX - 32, 48, followZ + 26);
    sun.target.position.set(followX, 0, followZ);
    sun.target.updateMatrixWorld();

    const raining = state.weather === 'rain';
    world.rain.visible = raining;
    document.body.classList.toggle('raining', raining && !state.player.inRV);
    if (raining) {
      const positions = world.rain.geometry.attributes.position.array;
      for (let i = 0; i < world.rainVelocity.length; i += 1) {
        positions[i * 3 + 1] -= world.rainVelocity[i] * dt;
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3] = camera.position.x + (Math.random() - 0.5) * 62;
          positions[i * 3 + 1] = 28;
          positions[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * 62;
        }
      }
      world.rain.geometry.attributes.position.needsUpdate = true;
      if (Math.random() < dt * 0.022) {
        lightning = 0.18;
        audio.noise(0.8, 0.08, 260);
      }
    }
    if (lightning > 0) {
      lightning -= dt;
      hemisphere.intensity += 1.7 * clamp(lightning / 0.18, 0, 1);
    }
  }

  function updatePrompt() {
    currentInteractable = findInteractable();
    if (currentInteractable) {
      currentPrompt = currentInteractable.label;
      UI.prompt.textContent = coarsePointer ? currentPrompt : `E · ${currentPrompt}`;
      UI.prompt.classList.add('on');
      UI.useButton.style.opacity = '1';
    } else {
      currentPrompt = '';
      UI.prompt.classList.remove('on');
      UI.useButton.style.opacity = '0.55';
    }
  }

  function updateHUD() {
    const setVital = (fill, number, value) => {
      const rounded = Math.round(clamp(value, 0, 100));
      fill.style.width = `${rounded}%`;
      number.textContent = rounded;
    };
    setVital(UI.healthFill, UI.healthNumber, state.player.health);
    setVital(UI.foodFill, UI.foodNumber, state.player.hunger);
    setVital(UI.waterFill, UI.waterNumber, state.player.thirst);
    setVital(UI.staminaFill, UI.staminaNumber, state.player.stamina);
    UI.day.textContent = `DAY ${state.day}`;
    const clockHours = ((state.time / CYCLE_SECONDS) * 24 + 5) % 24;
    const hours = Math.floor(clockHours);
    const minutes = Math.floor((clockHours - hours) * 60);
    UI.time.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    UI.weather.textContent = `${state.weather.toUpperCase()}${isNight() ? ' · LONG NIGHT' : ' · DIM DAY'}`;
    UI.mag.textContent = weapon.reloading ? '··' : state.magazine;
    UI.reserve.textContent = ` / ${countItem('ammo')}`;
    UI.packCount.textContent = `${occupiedSlots()} / ${SLOT_COUNT}`;

    if (state.player.inRV) {
      UI.objective.textContent = isNight() ? 'Doors locked. Cook, watch TV, organize supplies, or sleep safely until morning.' : 'Prepare inside the RV, then collect food, water, wood, and ammunition.';
    } else if (isNight()) {
      UI.objective.textContent = 'The long night is active. Reach the RV and tap INSIDE for instant safety.';
    } else {
      UI.objective.textContent = 'Search crates and trees. Return to the RV before the short daylight ends.';
    }

    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const heading = ((-state.player.yaw * 180 / Math.PI) % 360 + 360) % 360;
    const index = Math.round(heading / 45) % 8;
    UI.compass.textContent = `${directions[(index + 7) % 8]}   ${directions[index]}   ${directions[(index + 1) % 8]}`;
    updatePrompt();
  }

  function updateGame(dt) {
    elapsed += dt;
    updatePlayer(dt);
    updateTimeAndSurvival(dt);
    updateEnemies(dt);
    updateAtmosphere(dt);
    updateHUD();
    saveTimer += dt;
    if (saveTimer > 20) {
      saveTimer = 0;
      saveGame();
    }
  }

  function requestImmersiveMode() {
    if (!coarsePointer) return;
    const root = document.documentElement;
    const fullscreen = root.requestFullscreen || root.webkitRequestFullscreen;
    if (fullscreen) {
      Promise.resolve(fullscreen.call(root)).catch(() => {});
    }
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
  }

  function startGame(saved) {
    if (gameStarted) return;
    state = saved || createState((Math.random() * 0xffffffff) >>> 0);
    buildEnvironment(state.seed);
    applySavedWorld();
    gameStarted = true;
    paused = false;
    state.player.inRV = Boolean(state.player.inRV);
    if (!state.player.inRV && isOutsideBlocked(state.player.x, state.player.z, 0.34)) {
      state.player.x = RV.doorX + 0.8;
      state.player.z = RV.doorZ;
    }
    updateRVState();
    camera.position.set(state.player.x, state.player.y, state.player.z);
    camera.rotation.set(state.player.pitch, state.player.yaw, 0, 'YXZ');
    UI.start.classList.add('hidden');
    ensureEnemyPopulation(true);
    updateHUD();
    requestImmersiveMode();
    audio.unlock();
    toast(state.player.inRV ? 'You begin inside the locked RV. Nothing can harm you here.' : 'Continue collecting supplies. The RV remains your safe zone.', 'good');
  }

  function toggleQuality() {
    qualityMode = qualityMode === 'balanced' ? 'high' : 'balanced';
    renderScale = qualityMode === 'high' ? 1.58 : (coarsePointer ? 1.28 : 1.5);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(Math.min(devicePixelRatio, renderScale));
    UI.qualityButton.textContent = `QUALITY: ${qualityMode.toUpperCase()}`;
    UI.fps.textContent = `60 FPS · ${qualityMode.toUpperCase()}`;
  }

  const stick = $('si-stick');
  const knob = $('si-knob');
  const lookZone = $('si-look-zone');

  function updateStick(event) {
    const rect = stick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;
    const limit = rect.width * 0.34;
    const distance = Math.hypot(dx, dy);
    if (distance > limit) {
      dx = dx / distance * limit;
      dy = dy / distance * limit;
    }
    input.stickX = dx / limit;
    input.stickY = dy / limit;
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  stick.addEventListener('pointerdown', (event) => {
    if (!gameStarted || paused) return;
    event.preventDefault();
    input.stickPointer = event.pointerId;
    stick.setPointerCapture(event.pointerId);
    updateStick(event);
    audio.unlock();
  });
  stick.addEventListener('pointermove', (event) => {
    if (event.pointerId === input.stickPointer) updateStick(event);
  });
  const releaseStick = (event) => {
    if (event.pointerId !== input.stickPointer) return;
    input.stickPointer = null;
    input.stickX = 0;
    input.stickY = 0;
    knob.style.transform = '';
  };
  stick.addEventListener('pointerup', releaseStick);
  stick.addEventListener('pointercancel', releaseStick);

  lookZone.addEventListener('pointerdown', (event) => {
    if (!gameStarted || paused) return;
    input.lookPointer = event.pointerId;
    input.lookLastX = event.clientX;
    input.lookLastY = event.clientY;
    lookZone.setPointerCapture(event.pointerId);
    audio.unlock();
  });
  lookZone.addEventListener('pointermove', (event) => {
    if (event.pointerId !== input.lookPointer || paused) return;
    const dx = event.clientX - input.lookLastX;
    const dy = event.clientY - input.lookLastY;
    input.lookLastX = event.clientX;
    input.lookLastY = event.clientY;
    state.player.yaw -= dx * 0.0041;
    state.player.pitch = clamp(state.player.pitch - dy * 0.0036, -1.22, 1.18);
    weapon.swayX = clamp(weapon.swayX - dx * 0.00042, -0.035, 0.035);
    weapon.swayY = clamp(weapon.swayY + dy * 0.0003, -0.028, 0.028);
  });
  const releaseLook = (event) => {
    if (event.pointerId === input.lookPointer) input.lookPointer = null;
  };
  lookZone.addEventListener('pointerup', releaseLook);
  lookZone.addEventListener('pointercancel', releaseLook);

  function bindHoldButton(button, down, up) {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      button.setPointerCapture(event.pointerId);
      button.classList.add('active');
      audio.unlock();
      down();
    });
    const release = (event) => {
      event.preventDefault();
      event.stopPropagation();
      button.classList.remove('active');
      if (up) up();
    };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
  }

  bindHoldButton(UI.fireButton, () => { input.fireHeld = true; fireWeapon(); }, () => { input.fireHeld = false; });
  bindHoldButton(UI.useButton, useCurrentInteractable, null);
  bindHoldButton(UI.reloadButton, startReload, null);
  bindHoldButton(UI.rvButton, toggleRV, null);
  bindHoldButton(UI.packButton, openInventory, null);

  addEventListener('keydown', (event) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'Tab'].includes(event.code)) event.preventDefault();
    if (!input.keys[event.code]) {
      if (event.code === 'KeyE') useCurrentInteractable();
      else if (event.code === 'KeyB') modalOpen ? closeModal() : openInventory();
      else if (event.code === 'KeyR') startReload();
      else if (event.code === 'KeyV') toggleRV();
      else if (event.code === 'KeyF' && gameStarted) {
        state.flashlightOn = !state.flashlightOn;
        updateRVState();
        toast(`Flashlight ${state.flashlightOn ? 'on' : 'off'}.`);
      } else if (event.code === 'Escape' && modalOpen) {
        closeModal();
        closeInteraction();
      }
    }
    input.keys[event.code] = true;
    if (event.code === 'Space') input.fireHeld = true;
    audio.unlock();
  });
  addEventListener('keyup', (event) => {
    input.keys[event.code] = false;
    if (event.code === 'Space') input.fireHeld = false;
  });
  addEventListener('blur', () => {
    for (const key of Object.keys(input.keys)) input.keys[key] = false;
    input.fireHeld = false;
    input.stickX = 0;
    input.stickY = 0;
    knob.style.transform = '';
  });

  canvas.addEventListener('mousedown', (event) => {
    if (!gameStarted || paused || event.button !== 0) return;
    audio.unlock();
    if (!coarsePointer && document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
      return;
    }
    input.fireHeld = true;
    fireWeapon();
  });
  addEventListener('mouseup', (event) => {
    if (event.button === 0) input.fireHeld = false;
  });
  addEventListener('mousemove', (event) => {
    if (!gameStarted || paused || document.pointerLockElement !== canvas) return;
    state.player.yaw -= event.movementX * 0.0022;
    state.player.pitch = clamp(state.player.pitch - event.movementY * 0.0019, -1.22, 1.18);
    weapon.swayX = clamp(weapon.swayX - event.movementX * 0.00012, -0.035, 0.035);
    weapon.swayY = clamp(weapon.swayY + event.movementY * 0.0001, -0.028, 0.028);
  });
  addEventListener('contextmenu', (event) => event.preventDefault());
  addEventListener('visibilitychange', () => {
    if (!gameStarted) return;
    if (document.hidden) {
      paused = true;
      saveGame();
    } else if (!modalOpen) {
      paused = false;
    }
  });

  $('si-modal-close').onclick = closeModal;
  $('si-interaction-close').onclick = closeInteraction;
  $('si-new-game').onclick = () => startGame(null);
  UI.continueButton.onclick = () => startGame(loadSavedState());
  UI.qualityButton.onclick = toggleQuality;
  UI.continueButton.style.display = loadSavedState() ? '' : 'none';

  const performanceState = { frames: 0, seconds: 0, fps: 60, cooldown: 0 };
  function updateAdaptiveQuality(dt) {
    performanceState.frames += 1;
    performanceState.seconds += dt;
    performanceState.cooldown = Math.max(0, performanceState.cooldown - dt);
    if (performanceState.seconds < 2) return;
    performanceState.fps = Math.round(performanceState.frames / performanceState.seconds);
    performanceState.frames = 0;
    performanceState.seconds = 0;
    const maximum = qualityMode === 'high' ? 1.58 : (coarsePointer ? 1.28 : 1.5);
    if (performanceState.cooldown <= 0 && performanceState.fps < 39 && renderScale > 0.88) {
      renderScale = Math.max(0.88, renderScale - 0.12);
      renderer.setPixelRatio(Math.min(devicePixelRatio, renderScale));
      if (renderScale <= 0.94) renderer.shadowMap.enabled = false;
      performanceState.cooldown = 5;
    } else if (performanceState.cooldown <= 0 && performanceState.fps > 56 && renderScale < maximum) {
      renderScale = Math.min(maximum, renderScale + 0.06);
      renderer.setPixelRatio(Math.min(devicePixelRatio, renderScale));
      if (renderScale > 1) renderer.shadowMap.enabled = true;
      performanceState.cooldown = 7;
    }
    UI.fps.textContent = `${performanceState.fps} FPS · ${qualityMode.toUpperCase()}`;
  }

  let lastFrame = performance.now();
  let spawnTimer = 0;
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
    lastFrame = now;
    if (gameStarted) {
      if (!paused) {
        updateGame(dt);
        spawnTimer += dt;
        if (spawnTimer > 2.2) {
          spawnTimer = 0;
          ensureEnemyPopulation(false);
        }
      }
      renderer.render(scene, camera);
      updateAdaptiveQuality(dt);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
