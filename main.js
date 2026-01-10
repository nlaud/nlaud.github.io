//3JS Imports
import * as THREE from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

import * as Sound from './sound.js';

// ===== ORIENTATION HANDLING =====
function checkOrientation() {
  const modal = document.getElementById('orientationModal');
  if (!modal) return;
  
  // Check if device is portrait (height > width)
  if (window.innerHeight > window.innerWidth) {
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}

// Check orientation on load and on resize
window.addEventListener('load', checkOrientation);
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);

// Check immediately
checkOrientation();

//DEBUG MODE
const DEBUG = false;
const DEBUGCAM = false;

// Loading System
const loadingManager = {
  totalAssets: 0,
  loadedAssets: 0,
  isLoading: true,
  assetProgress: {}, // Track progress for each asset
  assetIndex: 0,
  
  addAsset() {
    const index = this.assetIndex++;
    this.totalAssets++;
    this.assetProgress[index] = 0;
    return index;
  },
  
  updateAssetProgress(assetIndex, progressEvent) {
    if (progressEvent.lengthComputable) {
      const progress = progressEvent.loaded / progressEvent.total;
      this.assetProgress[assetIndex] = progress;
      this.updateTotalProgress();
    }
  },
  
  assetLoaded(assetIndex) {
    this.assetProgress[assetIndex] = 1.0;
    this.loadedAssets++;
    this.updateTotalProgress();
    
    // Check if all assets are now fully loaded
    if (this.loadedAssets === this.totalAssets && this.totalAssets > 0) {
      this.finishLoading();
    }
  },
  
  updateTotalProgress() {
    let totalProgress = 0;
    for (let i = 0; i < this.assetIndex; i++) {
      totalProgress += this.assetProgress[i] || 0;
    }
    const avgProgress = this.totalAssets > 0 ? totalProgress / this.totalAssets : 0;
    
    // Cap at 95% until all assets are actually loaded
    let displayProgress = avgProgress;
    if (this.loadedAssets < this.totalAssets) {
      displayProgress = Math.min(avgProgress, 0.95);
    }
    
    const percent = Math.round(displayProgress * 100);
    
    const percentElement = document.getElementById('loadingPercent');
    if (percentElement) {
      percentElement.textContent = percent + '%';
    }
  },
  
  finishLoading() {
    this.isLoading = false;
    const statusElement = document.getElementById('loadingStatusText');
    const percentElement = document.getElementById('loadingPercent');
    if (statusElement) {
      statusElement.textContent = 'Click to continue...';
    }
    if (percentElement) {
      percentElement.textContent = '100%';
    }
  }
};

// Expose globally for sound preloading
window.loadingManager = loadingManager;

//SETTINGS

//Camera Controls
const cameraControlSensitivity = 0.35;//How much you are able to move
const cameraAcceleration = 0.1;

//Move Animations
const walkSpeed = 4.317;
const cameraVelocity = Math.PI / 4;

//Sky Colors
const daySky = new THREE.Color(0x7ab2ff);
const horizonDay = new THREE.Color(0x9ad3ff);
const sunsetColor = new THREE.Color(0xff6b00);
const nightSky = new THREE.Color(0x191936);
const sunColor = new THREE.Color(0xffddaa);

//3JS Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 0);

// Use Three.js Clock for consistent time management
const clock = new THREE.Clock();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
renderer.setPixelRatio(pixelRatio);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.8,  // strength
  0.3,  // radius
  1.2   // threshold
);
//composer.addPass(bloomPass);

const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
composer.addPass(fxaaPass);

// Skybox
const skyGeometry = new THREE.SphereGeometry(500, 64, 32);
skyGeometry.scale(-1, 1, 1); // Invert for inside view

// Load sun and moon textures
// Texture Loader
const textureLoader = new THREE.TextureLoader();
const sunTexture = textureLoader.load('resources/images/sun.png');
const moonTexture = textureLoader.load('resources/images/moon.png');
const cloudsTexture = textureLoader.load('resources/images/clouds.png');
sunTexture.magFilter = THREE.NearestFilter;
sunTexture.minFilter = THREE.NearestFilter;
moonTexture.magFilter = THREE.NearestFilter;
moonTexture.minFilter = THREE.NearestFilter;
cloudsTexture.magFilter = THREE.NearestFilter;
cloudsTexture.minFilter = THREE.NearestFilter;
cloudsTexture.wrapS = THREE.RepeatWrapping;
cloudsTexture.wrapT = THREE.RepeatWrapping;

const skyMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0.0 }, // 0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset
    daySky: { value: daySky },
    horizonDay: { value: horizonDay },
    sunsetColor: { value: sunsetColor },
    nightSky: { value: nightSky },
    sunColor: { value: sunColor },
    sunTexture: { value: sunTexture },
    moonTexture: { value: moonTexture }
  },
  vertexShader: `
    varying vec3 vWorldDirection;
    void main() {
      vWorldDirection = normalize(vec3(position));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_Position.z = gl_Position.w * 0.5; // Infinite depth
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 daySky;
    uniform vec3 horizonDay;
    uniform vec3 sunsetColor;
    uniform vec3 nightSky;
    uniform vec3 sunColor;
    uniform sampler2D sunTexture;
    uniform sampler2D moonTexture;

    varying vec3 vWorldDirection;

    void main() {
        vec3 dir = normalize(vWorldDirection);
        float viewHeight = dir.y;                // -1..1
        float h = clamp(viewHeight * 0.5 + 0.5, 0.0, 1.0); // 0 bottom, 1 top

        // === SUN & MOON: SAME AXIS (Y–Z), 180° APART ===
        float angle = time * 6.2831853;
        float adjustedAngle = angle + 0.15;
        vec3 sunDir = normalize(vec3(0.0, sin(adjustedAngle), cos(adjustedAngle)));
        float sunHeight = sunDir.y;

        vec3 moonDir = normalize(vec3(0.0, sin(adjustedAngle + 3.1415926), cos(adjustedAngle + 3.1415926)));
        float moonHeight = moonDir.y;

        float dayFactor = clamp((sunHeight + 0.05) * 1.4, 0.0, 1.0);

        // === BASE SKY ===
        vec3 dayTop    = daySky;
        vec3 dayBottom = mix(horizonDay, daySky, 0.4);
        vec3 nightTop  = nightSky;
        vec3 nightBottom = mix(nightSky, horizonDay, 0.3);

        vec3 dayGrad   = mix(dayBottom,  dayTop,   h);
        vec3 nightGrad = mix(nightBottom, nightTop, h);

        vec3 skyColor = mix(nightGrad, dayGrad, dayFactor);

        // ============================================================
        // 360° SUNRISE/SUNSET HORIZON BAND (NO AZIMUTH GATING)
        // ============================================================
        float bandCenter = 0.0;
        float bandWidth  = 0.45;
        float distToBand = abs(viewHeight - bandCenter);
        float bandShape  = 1.0 - smoothstep(0.0, bandWidth, distToBand);

        float sunNearHorizon = 1.0 - smoothstep(0.05, 0.25, abs(sunHeight));

        float tSun = clamp((sunHeight + 0.5) / 1.2, 0.0, 1.0);
        vec3 deepRed    = vec3(1.10, 0.25, 0.20);
        vec3 midOrange  = vec3(1.15, 0.55, 0.20);
        vec3 brightGold = vec3(1.10, 0.85, 0.45);

        vec3 bandColorA = mix(deepRed,   midOrange,  smoothstep(0.0,  0.35, tSun));
        vec3 bandColorB = mix(midOrange, brightGold, smoothstep(0.25, 0.8,  tSun));
        vec3 bandColor  = mix(bandColorA, bandColorB, smoothstep(0.2, 0.7, tSun));

        float warmFade = smoothstep(0.7, 1.0, tSun);
        vec3  warmTarget = mix(sunColor, daySky, 0.6);
        bandColor = mix(bandColor, warmTarget, warmFade);

        float bandStrength = bandShape * sunNearHorizon;
        float sunAboveDeepNight = smoothstep(-0.9, -0.1, sunHeight);
        bandStrength *= sunAboveDeepNight;

        float bandIntensity = mix(1.4, 0.25, dayFactor);
        skyColor = mix(skyColor, bandColor, clamp(bandStrength * bandIntensity, 0.0, 1.0));

        // === TEXTURED SUN ===
        vec3 upRef = vec3(0.0, 1.0, 0.0);
        vec3 sunRight = cross(upRef, sunDir);
        if (dot(sunRight, sunRight) < 1e-4) {
            sunRight = vec3(1.0, 0.0, 0.0);
        }
        sunRight = normalize(sunRight);
        vec3 sunUp = normalize(cross(sunDir, sunRight));

        float su = dot(dir, sunRight);
        float sv = dot(dir, sunUp);

        float sunHalfSize = 0.2;
        float sdu = abs(su) - sunHalfSize;
        float sdv = abs(sv) - sunHalfSize;
        float sunSqDist = max(sdu, sdv);

        // Sample sun texture with UV mapped to square
        vec2 sunUV = vec2(su / sunHalfSize * 0.5 + 0.5, sv / sunHalfSize * 0.5 + 0.5);
        vec4 sunSample = texture2D(sunTexture, sunUV);
        
        // Treat black backgrounds as transparent
        float sunBlackness = 1.0 - step(0.9, length(sunSample.rgb));
        float sunAlphaAdjusted = sunSample.a * (1.0 - sunBlackness);
        
        // Sun is visible when it's above horizon (positive sunHeight)
        float sunVisible = step(0.02, sunHeight);
        float sunAlpha = sunAlphaAdjusted * (1.0 - smoothstep(0.0, 0.05, sunSqDist)) * sunVisible;

        skyColor = mix(skyColor, sunSample.rgb, sunAlpha);

        // === TEXTURED MOON ===
        vec3 moonRight = cross(upRef, moonDir);
        if (dot(moonRight, moonRight) < 1e-4) {
            moonRight = vec3(1.0, 0.0, 0.0);
        }
        moonRight = normalize(moonRight);
        vec3 moonUp = normalize(cross(moonDir, moonRight));

        float mu = dot(dir, moonRight);
        float mv = dot(dir, moonUp);

        float moonHalfSize = 0.175;
        float mdu = abs(mu) - moonHalfSize;
        float mdv = abs(mv) - moonHalfSize;
        float moonSqDist = max(mdu, mdv);

        // Sample moon texture with UV mapped to square
        vec2 moonUV = vec2(mu / moonHalfSize * 0.5 + 0.5, mv / moonHalfSize * 0.5 + 0.5);
        vec4 moonSample = texture2D(moonTexture, moonUV);
        
        // Treat black backgrounds as transparent
        float moonBlackness = 1.0 - step(0.9, length(moonSample.rgb));
        float moonAlphaAdjusted = moonSample.a * (1.0 - moonBlackness);
        
        // Moon is visible when it's below horizon (negative sunHeight) — this fixes the bug!
        float moonVisible = step(sunHeight, -0.02) * (1.0 - dayFactor);
        float moonAlpha = moonAlphaAdjusted * (1.0 - smoothstep(0.0, 0.05, moonSqDist)) * moonVisible;

        skyColor = mix(skyColor, moonSample.rgb, moonAlpha);

        // === STARS (night only, NEVER at sunrise/sunset) ===
        float nightFactor = (1.0 - dayFactor) * step(-0.15, -sunHeight);

        float sunFarFromHorizon = smoothstep(0.4, 0.9, abs(sunHeight));
        float starMask = nightFactor * sunFarFromHorizon;

        // Create larger, square stars
        float starSize = 0.015; // Size of each star
        vec2 starGrid = floor(dir.xy / starSize);
        vec2 starPos = fract(dir.xy / starSize);
        
        // Create a hash for this grid cell to determine if there's a star here
        float starNoise = fract(sin(dot(starGrid, vec2(12.9898, 78.233))) * 43758.5453);
        
        // Make stars with higher threshold for fewer but more visible stars
        float starExists = step(0.85, starNoise);
        
        // Create square star shape by checking distance to center
        vec2 distToCenter = abs(starPos - 0.5);
        float squareRadius = 0.08;
        float starSquare = step(max(distToCenter.x, distToCenter.y), squareRadius);
        
        // Combine star existence and square shape
        float stars = starExists * starSquare * starMask;

        // Make stars brighter and more prominent
        skyColor += vec3(1.0, 1.0, 0.95) * stars;

        gl_FragColor = vec4(skyColor, 1.0);
    }
  `,
  side: THREE.FrontSide,
  depthWrite: false,
  depthTest: false,
  fog: false
});

const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
skyDome.position.set(0, -75, 0);
scene.add(skyDome);

// Clouds - Create animated cloud layer
const cloudGeometry = new THREE.PlaneGeometry(512, 512);
const cloudMaterial = new THREE.ShaderMaterial({
  uniforms: {
    cloudTexture: { value: cloudsTexture },
    time: { value: 0.0 },
    opacity: { value: 0.8 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D cloudTexture;
    uniform float time;
    uniform float opacity;
    
    varying vec2 vUv;
    
    void main() {
      // Scroll texture horizontally with infinite wrapping
      vec2 scrolledUv = vUv;
      scrolledUv.x = fract(scrolledUv.x + time * 0.1); // Use fract() for infinite tiling
      
      vec4 cloudColor = texture2D(cloudTexture, scrolledUv);
      
      // Use alpha channel for transparency, apply overall opacity
      float cloudAlpha = cloudColor.a * opacity;
      
      // Fade clouds at edges for soft appearance
      float edgeFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
      cloudAlpha *= edgeFade;
      
      gl_FragColor = vec4(cloudColor.rgb, cloudAlpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  depthTest:true,
  side: THREE.DoubleSide
});

const cloudMesh1 = new THREE.Mesh(cloudGeometry, cloudMaterial);
cloudMesh1.position.set(0, 60, 0);
cloudMesh1.rotation.x = Math.PI / 2;
cloudMesh1.frustumCulled = false;
scene.add(cloudMesh1);
const cloudLayers = [
  { mesh: cloudMesh1, material: cloudMaterial, speedMult: 0.004},
];

//Fog
scene.fog = new THREE.FogExp2( 0xcccccc, 0.008 );

//Lighting
//Ambient
const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x4a4a4a, 0.6);
scene.add(hemiLight);

//Sun and Moon
const sunLight = new THREE.DirectionalLight(0xffe8a3, 2.0);   // warm sun
sunLight.castShadow = false;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far  = 150;
sunLight.shadow.camera.left   = -60;
sunLight.shadow.camera.right  =  60;
sunLight.shadow.camera.top    =  60;
sunLight.shadow.camera.bottom = -60;
scene.add(sunLight);

const moonLight = new THREE.DirectionalLight(0xaaccff, 0.5);  // cool moon
moonLight.castShadow = false;
scene.add(moonLight);

//Torches, Other Lights
const torchData = [
  { pos: [-1.5, 1.25, 6.5], color: 0xff8c00, intensity: 15},
  { pos: [1.5, 1.25, 6.5], color: 0xff8c00, intensity: 15},
  { pos: [-1.5, 6.25, 3.5], color: 0xff8c00, intensity: 15},
  { pos: [1.5, 6.25, 3.5], color: 0xff8c00, intensity: 15},
  { pos: [-5.5, 3.25, 3.5], color: 0xff8c00, intensity: 15},
  { pos: [5.5, 3.25, 3.5], color: 0xff8c00, intensity: 15},
  { pos: [-2.5, 3.25, 1.5], color: 0xff8c00, intensity: 15},
  { pos: [2.5, 3.25, 1.5], color: 0xff8c00, intensity: 15},
  { pos: [-2.5, 3.25, -8.5], color: 0xff8c00, intensity: 15},
  { pos: [2.5, 3.25, -8.5], color: 0xff8c00, intensity: 15},
  { pos: [2.5, 3.25, -3.5], color: 0xff8c00, intensity: 15},
  { pos: [-5.5, 3.25, -10.5], color: 0xff8c00, intensity: 15},
  { pos: [5.5, 3.25, -10.5], color: 0xff8c00, intensity: 15},
  { pos: [19.5, -19.1, -3.5], color: 0xFBF5D0, intensity: 16},
  { pos: [14.5, -19.1, -3.5], color: 0xFBF5D0, intensity: 16},
  { pos: [19.5, -19.1, -8.5], color: 0xFBF5D0, intensity: 16},
  { pos: [14.5, -19.1, -8.5], color: 0xFBF5D0, intensity: 16},
  { pos: [19.5, -22.9, -3.5], color: 0xFBF5D0, intensity: 16},
  { pos: [14.5, -22.9, -3.5], color: 0xFBF5D0, intensity: 16},
  { pos: [19.5, -22.9, -8.5], color: 0xFBF5D0, intensity: 16},
  { pos: [14.5, -22.9, -8.5], color: 0xFBF5D0, intensity: 16},
];

torchData.forEach(({ pos: [x,y,z], color, intensity }, index) => {
  const torch = new THREE.PointLight(color, intensity / 3.5, 15);
  torch.position.set(x, y, z);

  torch.decay = 0.8;

  torch.castShadow = false;
  torch.shadow.mapSize.width = 512;
  torch.shadow.mapSize.height = 512;
  torch.shadow.bias = -0.001;

  scene.add(torch);
  if(DEBUG){
    const helper = new THREE.PointLightHelper(torch);
    scene.add(helper);
  }
});

//Debug Stuff
if(DEBUG){
  const gridHelper = new THREE.GridHelper(1000, 1000, 0x0000ff, 0x888888);
  scene.add(gridHelper);
  const gridHelper2 = new THREE.GridHelper(1000, 100, 0x0000ff, 0xff0000);
  scene.add(gridHelper2);
}

//Controls
if(DEBUG && DEBUGCAM){
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 0, 0);
  controls.update();
}

// Mouse look camera control
const trueFacingEuler = new THREE.Euler(0, Math.PI, 0, 'YXZ');
const cameraEuler = new THREE.Euler(0, Math.PI, 0, 'YXZ');
const mouseState = {
  x: 0,
  y: 0,
  targetRotX: trueFacingEuler.x,
  targetRotY: trueFacingEuler.y
};

window.addEventListener('mousemove', (event) => {
  // Don't update camera look when book modal is open
  if (bookModal.isOpen) return;
  
  // Throttle mouse movement to reduce DOM/calculation overhead
  const now = performance.now();
  if (now - lastMouseMoveTime < MOUSE_THROTTLE_MS) return;
  lastMouseMoveTime = now;
  
  // Normalize mouse position to -1 to 1
  mouseState.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouseState.y = (event.clientY / window.innerHeight) * 2 - 1;
  
  // Calculate target rotation (limited to ~60 degrees)
  mouseState.targetRotY = -mouseState.x * 0.5 * cameraControlSensitivity + trueFacingEuler.y; // yaw (horizontal)
  mouseState.targetRotX = -mouseState.y * 0.3 * cameraControlSensitivity + trueFacingEuler.x; // pitch (vertical)
});

// ===== CAMERA ANIMATION SYSTEM =====
const cameraAnimation = {
  isAnimating: false,
  animationMode: null, // 'position', 'rotation', or 'both'
  startPosition: new THREE.Vector3(),
  targetPosition: new THREE.Vector3(),
  startRotation: { x: 0, y: 0 },
  targetRotation: { x: 0, y: 0 },
  animationDuration: 1.0, // Duration in seconds
  animationElapsed: 0.0, // Elapsed time in current animation
  currentWaypointIndex: 0,
  waypoints: [],
  breakTimeRemaining: 0
};

/**
 * Animate camera position toward a target
 * @param {THREE.Vector3|[x,y,z]} targetPos - Target position
 * @param {number} duration - Animation duration in seconds (default: 1.0)
 */
function animateCameraPosition(targetPos, duration = 1.0) {
  cameraAnimation.startPosition.copy(camera.position);
  if (Array.isArray(targetPos)) {
    cameraAnimation.targetPosition.set(targetPos[0], targetPos[1], targetPos[2]);
  } else {
    cameraAnimation.targetPosition.copy(targetPos);
  }
  cameraAnimation.isAnimating = true;
  cameraAnimation.animationMode = 'position';
  cameraAnimation.animationDuration = duration;
  cameraAnimation.animationElapsed = 0.0;
}

/**
 * Animate camera rotation toward a target
 * @param {number} targetRotX - Target pitch (vertical rotation)
 * @param {number} targetRotY - Target yaw (horizontal rotation)
 * @param {number} duration - Animation duration in seconds (default: 1.0)
 */
function animateCameraRotation(targetRotX, targetRotY, duration = 1.0) {
  cameraAnimation.startRotation.x = cameraEuler.x;
  cameraAnimation.startRotation.y = cameraEuler.y;
  cameraAnimation.targetRotation.x = targetRotX;
  cameraAnimation.targetRotation.y = targetRotY;
  cameraAnimation.isAnimating = true;
  cameraAnimation.animationMode = 'rotation';
  cameraAnimation.animationDuration = duration;
  cameraAnimation.animationElapsed = 0.0;
}

/**
 * Animate camera position and rotation simultaneously
 * @param {THREE.Vector3|[x,y,z]} targetPos - Target position
 * @param {number} targetRotX - Target pitch
 * @param {number} targetRotY - Target yaw
 * @param {number} duration - Animation duration in seconds (default: 1.0)
 */
function animateCameraPositionAndRotation(targetPos, targetRotX, targetRotY, duration = 1.0) {
  cameraAnimation.startPosition.copy(camera.position);
  if (Array.isArray(targetPos)) {
    cameraAnimation.targetPosition.set(targetPos[0], targetPos[1], targetPos[2]);
  } else {
    cameraAnimation.targetPosition.copy(targetPos);
  }
  cameraAnimation.startRotation.x = cameraEuler.x;
  cameraAnimation.startRotation.y = cameraEuler.y;
  cameraAnimation.targetRotation.x = targetRotX;
  cameraAnimation.targetRotation.y = targetRotY;
  cameraAnimation.isAnimating = true;
  cameraAnimation.animationMode = 'both';
  cameraAnimation.animationDuration = duration;
  cameraAnimation.animationElapsed = 0.0;
}

/**
 * Animate through a series of camera positions and rotations
 * @param {Array} waypoints - Array of waypoint objects:
 *   {
 *     position: [x, y, z],
 *     rotation: [rotX, rotY],
 *     duration: number (animation time in seconds),
 *     breakTime: number (optional, seconds to pause at waypoint)
 *   }
 */
function animateCameraPath(waypoints) {
  if (!waypoints || waypoints.length === 0) return;
  
  cameraAnimation.waypoints = waypoints;
  cameraAnimation.currentWaypointIndex = 0;
  cameraAnimation.breakTimeRemaining = 0;
  
  const wp = waypoints[0];
  animateCameraPositionAndRotation(
    wp.position,
    wp.rotation[0],
    wp.rotation[1],
    wp.duration
  );
}

/**
 * Stop the current camera animation
 */
function stopCameraAnimation() {
  cameraAnimation.isAnimating = false;
  cameraAnimation.waypoints = [];
  cameraAnimation.breakTimeRemaining = 0;
}

// ===== BOOK MODAL SYSTEM =====
const bookModal = {
  pages: [],
  currentPage: 0,
  isOpen: false
};

/**
 * Open a book modal with multiple pages
 * @param {Array<string>} pages - Array of page content strings (supports \n for line breaks)
 */
function openBook(pages) {
  if (!pages || pages.length === 0) return;
  
  bookModal.pages = pages;
  bookModal.currentPage = 0;
  bookModal.isOpen = true;
  
  const overlay = document.getElementById('bookModal');
  overlay.classList.add('active');
  
  setTimeout(() => {overlay.addEventListener('click', closeIfThing);}, 1000);
  

  displayBookPage();
}

function closeIfThing(event){
  if (event.target === document.getElementById('bookModal')) {
    closeBook();
  }
}

/**
 * Close the book modal
 */
function closeBook() {
  bookModal.isOpen = false;
  const overlay = document.getElementById('bookModal');
  overlay.classList.remove('active');
  overlay.removeEventListener('click', closeIfThing);

}

/**
 * Display the current page in the book
 */
function displayBookPage() {
  const currentPageNum = bookModal.currentPage + 1;
  const totalPages = bookModal.pages.length;
  
  // Update page counter
  document.getElementById('currentPage').textContent = currentPageNum;
  document.getElementById('totalPages').textContent = totalPages;
  
  // Update text content
  const bookText = document.getElementById('bookText');
  bookText.textContent = bookModal.pages[bookModal.currentPage];
  
  // Update navigation buttons
  const prevButton = document.getElementById('prevButton');
  const nextButton = document.getElementById('nextButton');
  
  // Previous button visibility
  if (bookModal.currentPage > 0) {
    prevButton.classList.remove('hidden');
  } else {
    prevButton.classList.add('hidden');
  }
  
  // Next button visibility
  if (bookModal.currentPage < totalPages - 1) {
    nextButton.classList.remove('hidden');
  } else {
    nextButton.classList.add('hidden');
  }
}

/**
 * Navigate to the next page
 */
function nextBookPage() {
  if (bookModal.currentPage < bookModal.pages.length - 1) {
    bookModal.currentPage++;
    displayBookPage();
    Sound.playPageTurnSound(2);
  }
}

/**
 * Navigate to the previous page
 */
function prevBookPage() {
  if (bookModal.currentPage > 0) {
    bookModal.currentPage--;
    displayBookPage();
    Sound.playPageTurnSound(2);
  }
}

// Book modal event listeners
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('bookModal');
  const prevButton = document.getElementById('prevButton');
  const nextButton = document.getElementById('nextButton');
  
  // Navigation button events
  prevButton.addEventListener('click', prevBookPage);
  nextButton.addEventListener('click', nextBookPage);
  
  // Preload all sounds
  Sound.preloadAllSounds(loadingManager);
});

// Close loading screen on first click (only when loading is done)
document.getElementById('loadingScreen').addEventListener('click', () => {
  if (!loadingManager.isLoading) {
    const screen = document.getElementById('loadingScreen');
    screen.classList.add('fade-out');
    Sound.playClickSfx();
    setTimeout(() => {
      screen.style.display = 'none';
    }, 300);
  }
});

//Loading the world
//X:-850->-350, Y:40->319, Z:925>1200
//Center: -569 78 992.5
{
  const worldAssetIndex = loadingManager.addAsset();
  const objLoader = new OBJLoader();
  const mtlLoader = new MTLLoader();
  mtlLoader.load('resources/world/map.mtl', (mtl) => {
    mtl.preload();
    objLoader.setMaterials(mtl);
    objLoader.load('resources/world/map.obj', (root) => {
      root.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = c.receiveShadow = false;
          c.frustumCulled = true;
          c.renderOrder = 1;
        }
        if (c.material) {
          const materials = Array.isArray(c.material) ? c.material : [c.material];
          materials.forEach((m) => {
            if (m.map) {
              m.map.magFilter = THREE.NearestFilter;
              m.map.minFilter = THREE.NearestFilter;
              m.map.generateMipmaps = false;
              m.map.needsUpdate = true;
            }

            m.color.setHex(0xffffff);
            m.roughness = 0.9;
            m.metalness = 0.0;
            m.envMapIntensity = 0.2;

            const name = (m.name || '').toLowerCase();
            const isLeaves = name.includes('leaf') || name.includes('leaves') || name.includes('grass') || name.includes('fern') || name.includes('mushroom') || name.includes('plant') || name.includes('sapling') || name.includes('lantern') || name.includes('door') || name.includes('flower');

            if (isLeaves) {
              m.transparent = false;
              m.opacity = 0.95;
              m.alphaTest = 0.15;
              m.depthWrite = true;
              m.side = THREE.DoubleSide;
            }

            const isWater = name.includes('water');

            if (isWater) {
              m.transparent = false;
            }
          });
        }
      });

      root.position.set(0, 0, 0);
      const box = new THREE.Box3().setFromObject(root);
      let size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      center.x = 31;//159?
      center.y = 38;
      center.z = -71;
      root.position.sub(center);//Center

      scene.add(root);
      
      // Store world mesh for distance-based LOD updates
      scene.userData.worldMesh = root;
      
      loadingManager.assetLoaded(worldAssetIndex); // Mark world as loaded
    }, (progressEvent) => {
      loadingManager.updateAssetProgress(worldAssetIndex, progressEvent);
    });
  });
}

//Door Loading
var doorModel1;
var doorModel2;
{
  const doorAssetIndex = loadingManager.addAsset();
  const gltfLoader = new GLTFLoader();
  const url = 'resources/spruceDoor/source/model.gltf';
  gltfLoader.load(url, (gltf) => {
    doorModel1 = gltf.scene;
    doorModel2 = doorModel1.clone();
    closeDoors();
    scene.add(doorModel1);
    scene.add(doorModel2);
    loadingManager.assetLoaded(doorAssetIndex); // Mark doors as loaded
  }, (progressEvent) => {
    loadingManager.updateAssetProgress(doorAssetIndex, progressEvent);
  });
}

function closeDoors(){
  doorModel1.position.set(2.625, 0, -6.5);
  doorModel1.rotation.set(0, Math.PI/2, 0);
  doorModel2.position.set(3.5, 0, -5.5);
  doorModel2.rotation.set(0, -Math.PI/2, 0);
}
function openDoors(){
  doorModel1.position.set(3.45, 0, -6.5);
  doorModel1.rotation.set(0, Math.PI, 0);
  doorModel2.position.set(3.45, 0, -4.6);
  doorModel2.rotation.set(0, Math.PI, 0);
}

//Moved Blocks Loading
const grassSideTexture = textureLoader.load('resources/world/tex/grass_block_side_y.png');
const grassTopTexture = textureLoader.load('resources/world/tex/grass_block_top_y.png');
const dirtBottomTexture = textureLoader.load('resources/world/tex/dirt.png');

// Apply nearest-neighbor filtering to match world mesh textures
[grassSideTexture, grassTopTexture, dirtBottomTexture].forEach(tex => {
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
});

const grassMaterial = new THREE.MeshStandardMaterial({ 
  map: grassSideTexture,
  color: 0xffffff,
  roughness: 0.9,
  metalness: 0.0,
  envMapIntensity: 0.2
});
const topMaterial = new THREE.MeshStandardMaterial({ 
  map: grassTopTexture,
  color: 0xffffff,
  roughness: 0.9,
  metalness: 0.0,
  envMapIntensity: 0.2
});
const bottomMaterial = new THREE.MeshStandardMaterial({ 
  map: dirtBottomTexture,
  color: 0xffffff,
  roughness: 0.9,
  metalness: 0.0,
  envMapIntensity: 0.2
});

[grassSideTexture, grassTopTexture, dirtBottomTexture].forEach(tex => {
  tex.colorSpace = THREE.SRGBColorSpace;  // or tex.encoding = THREE.sRGBEncoding on older three.js
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
});

const geometry = new THREE.BoxGeometry(1, 1, 1);
const materials = [
    grassMaterial, // +X
    grassMaterial, // -X
    topMaterial, // +Y (Top)
    bottomMaterial, // -Y (Bottom)
    grassMaterial, // +Z
    grassMaterial  // -Z
];

const grassBlocks = [];
const grassBlockPositions = [
  [17.5, -1.5, -6.5],
  [16.5, -1.5, -6.5],
  [17.5, -1.5, -5.5],
  [16.5, -1.5, -5.5]
];

grassBlockPositions.forEach((pos) => {
  // Clone materials for each block to avoid shared references
  const blockMaterials = [
    grassMaterial.clone(),
    grassMaterial.clone(),
    topMaterial.clone(),
    bottomMaterial.clone(),
    grassMaterial.clone(),
    grassMaterial.clone()
  ];
  const block = new THREE.Mesh(geometry, blockMaterials);
  block.position.set(pos[0], pos[1], pos[2]);
  scene.add(block);
  grassBlocks.push(block);
});

function hideGrass(){
  grassBlocks.forEach((block) => {
    block.visible = false;
  });
}
function showGrass(){
  grassBlocks.forEach((block) => {
    block.visible = true;
  });
}
//About Me Text

const now = new Date();
function yearsBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let years = end.getFullYear() - start.getFullYear();
  
  // Subtract 1 if end hasn't reached the anniversary date yet
  const monthDiff = end.getMonth() - start.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < start.getDate())) {
    years--;
  }
  
  return years;
}

//About Me Text
const fontLoader = new FontLoader();
const aboutFontIndex = loadingManager.addAsset();
const projectsFontIndex = loadingManager.addAsset();
var textData = [
  {text:"Hi! I'm Nathan.", size: 0.375, position: [-2.99, 3.875, -2.25], rotation:[0, Math.PI / 2, 0], color:0xf5f5f5},
  {text:"- I'm studying CS at CMU", size: 0.25, position: [-2.99, 3.25, -2.25], rotation:[0, Math.PI / 2, 0], color:0xf5f5f5},
  {text:"- I've been coding for " + yearsBetween("12/20/14", now) + " years", size: 0.25, position: [-2.99, 2.75, -2.25], rotation:[0, Math.PI / 2, 0], color:0xf5f5f5},
  {text:"- I did research in ML and CB", size: 0.25, position: [-2.99, 2.25, -2.25], rotation:[0, Math.PI / 2, 0], color:0xf5f5f5},
  {text:"- I use Python and HTML/CSS/JS", size: 0.25, position: [-2.99, 1.75, -2.25], rotation:[0, Math.PI / 2, 0], color:0xf5f5f5},
  {text:"Experience", size:1/16, position: [1.875, 0.6, -1.85], rotation:[0, 3 * Math.PI / 2, 0], color:0xf5f5f5},
  {text:"Education", size:1/16, position: [1.875, 0.6, -0.85], rotation:[0, 3 * Math.PI / 2, 0], color:0xf5f5f5}
];
fontLoader.load(
  'resources/font/minecraftia.json',
  (font) => {
    textData.forEach((item) => {
      const geo = new TextGeometry(item.text, {
        font,
        size: item.size,
        depth: 0,
        curveSegments: 6,
      });

      geo.computeBoundingBox();
      const bbox = geo.boundingBox;
      const xOffset = bbox.min.x;
      const yOffset = bbox.max.y;
      geo.translate(-xOffset, -yOffset, 0);

      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(item.color) });
      const mesh = new THREE.Mesh(geo, mat);

      mesh.position.set(
        item.position[0],
        item.position[1],
        item.position[2]
      );

      const rot = item.rotation || [0, 0, 0];
      mesh.rotation.set(rot[0], rot[1], rot[2] || 0);

      scene.add(mesh);
    });
    loadingManager.assetLoaded(aboutFontIndex); // Font loaded
  },
  (progressEvent) => {
    loadingManager.updateAssetProgress(aboutFontIndex, progressEvent);
  },
  (err) => {
    console.error('Font load error', err);
  }
);
//About Me Icons
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
function onPointerDown(event) {
  // get canvas bounds
  const rect = canvas.getBoundingClientRect();

  // convert mouse from pixels to normalized device coords (-1 to +1)
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // cast a ray from the camera through the mouse
  raycaster.setFromCamera(mouse, camera);

  // choose what you want clickable: a single mesh or an array
  const clickable = clickableIcons; // or scene.children, or your own array

  const hits = raycaster.intersectObjects(clickable, true); // true = recurse into groups

  if (hits.length > 0) {
    const hit = hits[0].object;
    Sound.playClickSfx();
    if (hit.userData.clickCallback) {
      hit.userData.clickCallback(hit);
    }
  }
}
var lastPointerMoveTime = performance.now();
function onPointerMove(event) {
  const now = performance.now();
  if (now - lastPointerMoveTime < MOUSE_THROTTLE_MS) return;
  lastPointerMoveTime = now;

  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(clickableIcons, true);
  
  if (hits.length > 0) {
    const hit = hits[0].object;
    canvas.style.cursor = 'pointer';
  } else {
    canvas.style.cursor = 'default';
  }
}

const canvas = renderer.domElement;
canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);

var clickableIcons = [];
var projectImages = [null, null, null, null];
function createIcon(url, position, rotation, size = 1, clickCallback, heightMult = 1, antialias = true, projectId = -1) {
  const loader = new THREE.TextureLoader();
  var mesh = null;
  loader.load(url, (texture) => {
    // Make it always face camera (billboard)
    texture.matrixAutoUpdate = false;
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({ 
      map: texture, 
      color: 0xffffff,
      transparent: false, 
      alphaTest: 0.5  // for clean edges
    });
    if(!antialias){
      material.map.magFilter = THREE.NearestFilter;
      material.map.minFilter = THREE.NearestFilter;
    }
    

    const geometry = new THREE.PlaneGeometry(size, size * heightMult);
    geometry.center();
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.rotation.copy(rotation);
    mesh.userData = { clickCallback };  // store your JS callback
    scene.add(mesh);

    clickableIcons.push(mesh);
    if(projectId >= 0){
      projectImages[projectId] = mesh;
    }
  });
}
createIcon('/resources/icons/github.png', new THREE.Vector3(-2.99, 0.5, -3.5), new THREE.Euler(0, Math.PI / 2, 0, 'XYZ'),1, (mesh) => {
  window.open("https://github.com/nlaud", '_blank');
});
createIcon('/resources/icons/linkedin.png', new THREE.Vector3(-2.99, 0.5, -4.5), new THREE.Euler(0, Math.PI / 2, 0, 'XYZ'),1, (mesh) => {
  window.open("https://www.linkedin.com/in/nathan-laud/", '_blank');
});
createIcon('/resources/icons/gmail.png', new THREE.Vector3(-2.99, 0.5, -5.5), new THREE.Euler(0, Math.PI / 2, 0, 'XYZ'),1, (mesh) => {
  navigator.clipboard.writeText('nlaud@andrew.cmu.edu');
  let notif = document.getElementById('notif');
  notif.classList.add('show');
  setTimeout(() => {
    notif.classList.remove('show');
  }, 1500);
});

//Experience Section

//Lectern Books
var bookModel1;
var bookModel2;
{
  const bookAssetIndex = loadingManager.addAsset();
  const gltfLoader = new GLTFLoader();
  const url = 'resources/book/source/model.gltf';
  gltfLoader.load(url, (gltf) => {
    const root = gltf.scene;
    root.setRotationFromEuler(new THREE.Euler(0, Math.PI / 2, Math.PI/8, 'XZY'));

    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    root.position.sub(center);

    bookModel1 = root;
    bookModel2 = root.clone();

    bookModel1.position.add(new THREE.Vector3(2.4, 1.02, -1.5));
    
    bookModel2.position.add(new THREE.Vector3(2.4, 1.02, -0.5));

    scene.add(bookModel1);
    scene.add(bookModel2);
    loadingManager.assetLoaded(bookAssetIndex); // Mark books as loaded
  }, (progressEvent) => {
    loadingManager.updateAssetProgress(bookAssetIndex, progressEvent);
  });
}
//Experience Buttons
const experiencePages = [
    "Discovery Partners Institute Research\nSummer 2025\n-Conducted research with Dr. Yuanye Ma to gather global data on cookie consent notices\n-Utilized Python and Selenium with the common crawl database to scrape websites for cookie consent notices and parse the HTML to extract relevant information (i.e. buttons, links, text)\n-Scraped >40,000 sites and found ~1,500 cookie consent notices",
    "Adventures with Mr. Math - Lead TA\n2023 - 2025\n-Facilitated virtual group meetings and performed administrative tasks for extracurricular math classes and provided individual assistance for elementary school-aged students on a broad range of mathematical topics including combinatorics, prime numbers, and logic",
    "Argonne National Laboratory Research\nFall 2023 - Spring 2025\n-Conducted research with Dr. Chris Fry at Argonne's Center for Nanoscale Materials using AI to predict novel heme-binding peptides\n-Ran simulations and trained LSTM and NN models with PyTorch and Scikit-learn, utilizing Linux on Argonne's Improv supercomputer.\n-Gathered, organized, and visualized data from the Protein Data Bank using NumPy, Pandas, Matplotlib, Biopython, and MDanalysis",
    "Discovery Partners Institute Research\nSummer 2024\n-Research with Dr. Sugyan Dixit employing AI tools to predict protein dynamics.\n-Compiled and processed files from the Protein Data Bank using Numpy, Jax, and Biopython.\n-Created a final model architecture"
];
const educationPages = [
  "Carnegie Mellon University\nB.S. Computer Science, 2025-2029\nGPA: 4.0/4.0\n\nRelevant Clubs: Association for Computing Machinery\n\nRelevant Coursework: Principles of Imperative Computation, Mathematical Foundations for CS",
  "Illinois Mathematics and Science Academy\nGraduated June 2025\nGPA: 3.94/4.0\n\nRelevant Coursework: CS Seminar: Machine Learning, Web Technologies, Linear Algebra, Multivariable Calculus\n\nSelected Awards: National Merit Finalist, AP Scholar with Distinction, Illinois State Scholar"
]
createIcon('/resources/images/empty.png', new THREE.Vector3(2, 0.5, -1.5625), new THREE.Euler(0, 3 * Math.PI / 2, 0, 'XYZ'),1, (mesh) => {
  openBook(experiencePages);
});
createIcon('/resources/images/empty.png', new THREE.Vector3(2.4, 1.02, -1.5625), new THREE.Euler(0, 3 * Math.PI / 2, -1 * Math.PI / 3, 'ZYX'),1, (mesh) => {
  openBook(experiencePages);
});
createIcon('/resources/images/empty.png', new THREE.Vector3(2, 0.5, -0.5625), new THREE.Euler(0, 3 * Math.PI / 2, 0, 'XYZ'),1, (mesh) => {
  openBook(educationPages);
});
createIcon('/resources/images/empty.png', new THREE.Vector3(2.4, 1.02, -0.5625), new THREE.Euler(0, 3 * Math.PI / 2, -1 * Math.PI / 3, 'ZYX'),1, (mesh) => {
  openBook(educationPages);
});

//Projects Section

createIcon('/resources/images/ArrowForward.png', new THREE.Vector3(19, -21, -8.49), new THREE.Euler(0, 0, 0, 'XYZ'),0.5, (mesh) => {
  nextProject();
}, 1, false);
createIcon('/resources/images/ArrowBackward.png', new THREE.Vector3(15, -21, -8.49), new THREE.Euler(0, 0, 0, 'ZYX'),0.5, (mesh) => {
  prevProject();
}, 1, false);

const projectData = [
  {image:"/resources/images/projects/boidbg.png", link: "https://nlaud.github.io/projects/boidbg/", title:"Boids", description:"A modified implementation of Boid's algorithm using color to form groups."},
  {image:"/resources/images/projects/yt-mixer.png", link: "https://nlaud.github.io/projects/yt-mixer/", title:"Youtube Mixer", description:"A site that uses Youtube's API to create and play playlists without ads!"},
  {image:"/resources/images/projects/vibin-time.png", link: "https://nlaud.github.io/projects/vibin-time/", title:"Vibin' Time", description:"Small prank with friends ..."},
  {image:"/resources/images/projects/tab-saver.png", link: "https://nlaud.github.io/projects/tab-saver/", title:"Tab Saver", description:"A site to store groups of tabs to be opened together later."}
];

var projectMeshes = []
fontLoader.load(
  'resources/font/minecraftia.json',
  (font) => {
    projectData.forEach((item, index) => {
      const titleGeo = new TextGeometry(item.title, {
        font,
        size: 0.25,
        depth: 0,
        curveSegments: 6,
      });
      titleGeo.center();
      const descriptionGeo = new TextGeometry(item.description, {
        font,
        size: 0.08,
        depth: 0,
        curveSegments: 6,
      });
      descriptionGeo.center();

      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf5f5f5) });
      
      const titleMesh = new THREE.Mesh(titleGeo, mat);
      const descriptionMesh = new THREE.Mesh(descriptionGeo, mat);

      titleMesh.position.set(0, -100, 0);
      descriptionMesh.position.set(0, -100, 0);

      titleMesh.rotation.set(0, 0, 0);
      descriptionMesh.rotation.set(0, 0, 0);

      scene.add(titleMesh);
      scene.add(descriptionMesh);

      projectMeshes.push({title: titleMesh, description:descriptionMesh });

      createIcon(item.image, new THREE.Vector3(0, -100, 0), new THREE.Euler(0, 0, 0, 'XYZ'),2.5, (mesh) => {
        window.open(item.link, '_blank');
      }, 0.57005208333, true, index);
    });
    loadingManager.assetLoaded(projectsFontIndex); // Project font loaded
  },
  (progressEvent) => {
    loadingManager.updateAssetProgress(projectsFontIndex, progressEvent);
  },
  (err) => {
    console.error('Font load error', err);
  }
);

var projectIndex = 0;
function nextProject(){
  projectIndex = (projectIndex + 1) % projectData.length;
  projectMeshes.forEach((item) => {
    item.title.position.set(0, -100, 0);
    item.description.position.set(0, -100, 0);
  });
  for(var i = 0; i < projectImages.length; i++){
    projectImages[i].position.set(0, -100, 0);
  }
  projectMeshes[projectIndex].title.position.set(17, -19.75, -8.49);
  projectMeshes[projectIndex].description.position.set(17, -22.125, -8.49);
  projectImages[projectIndex].position.set(17, -21, -8.49);
}
function prevProject(){
  projectIndex = (projectIndex - 1);
  while(projectIndex < 0){
    projectIndex += projectData.length;
  }
  projectMeshes.forEach((item) => {
    item.title.position.set(0, -100, 0);
    item.description.position.set(0, -100, 0);
  });
  for(var i = 0; i < projectImages.length; i++){
    projectImages[i].position.set(0, -100, 0);
  }
  projectMeshes[projectIndex].title.position.set(17, -19.75, -8.49);
  projectMeshes[projectIndex].description.position.set(17, -22.125, -8.49);
  projectImages[projectIndex].position.set(17, -21, -8.49);
}

var debugTime = 0;
let lastFrameTime = performance.now();

const cachedHemiDaySky = new THREE.Color(0x87CEEB);
const cachedHemiNightSky = new THREE.Color(0x262c40);
const cachedSunDir = new THREE.Vector3();
const cachedMoonDir = new THREE.Vector3();

const sideNavElements = {
  left: document.querySelectorAll('.side-nav.left')[0],
  right: document.querySelectorAll('.side-nav.right')[0],
  bottom: document.querySelectorAll('.side-nav.bottom')[0]
};

let lastMouseMoveTime = 0;
const MOUSE_THROTTLE_MS = 1 / 30 * 1000; // ~15fps

/**
 * Helper function to advance to the next waypoint in the camera path
 */
function advanceCameraAnimationPath() {
  if (cameraAnimation.waypoints.length === 0) return;
  
  const currentWp = cameraAnimation.waypoints[cameraAnimation.currentWaypointIndex];
  const breakTime = currentWp.breakTime || 0;
  
  // Move to next waypoint
  cameraAnimation.currentWaypointIndex++;
  
  if (cameraAnimation.currentWaypointIndex < cameraAnimation.waypoints.length) {
    if (breakTime > 0) {
      // Set break time in seconds
      cameraAnimation.breakTimeRemaining = breakTime;
    } else {
      // No break, start animating to next waypoint immediately
      const nextWp = cameraAnimation.waypoints[cameraAnimation.currentWaypointIndex];
      animateCameraPositionAndRotation(
        nextWp.position,
        nextWp.rotation[0],
        nextWp.rotation[1],
        nextWp.duration
      );
    }
  } else {
    // Finished all waypoints
    cameraAnimation.isAnimating = false;
    cameraAnimation.waypoints = [];
    // Sync mouse state to prevent jitter when returning to mouse control
    mouseState.targetRotX = cameraEuler.x;
    mouseState.targetRotY = cameraEuler.y;
    trueFacingEuler.x = cameraEuler.x;
    trueFacingEuler.y = cameraEuler.y;
  }
}

function animate() {
  // Use Three.js Clock for frame-rate independent timing
  const deltaTime = clock.getDelta();
  
  // Calculate time based on real-world time
  // 7am = start of sunrise (time = 0)
  // 7pm = start of sunset (time = 0.5)
  // 7am next day = time = 1.0
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const secondsSinceMidnight = hours * 3600 + minutes * 60 + seconds;
  const sunriseTime = 7 * 3600; // 7am in seconds
  const sunsetTime = 19 * 3600; // 7pm in seconds
  const dayDuration = sunsetTime - sunriseTime; // 12 hours
  const nightDuration = 24 * 3600 - dayDuration; // 12 hours

  let time;
  if (secondsSinceMidnight >= sunriseTime && secondsSinceMidnight < sunsetTime) {
    // 7am to 7pm: map to 0 to 0.5
    const secondsSinceSunrise = secondsSinceMidnight - sunriseTime;
    time = (secondsSinceSunrise / dayDuration) * 0.5;
  } else if (secondsSinceMidnight < sunriseTime) {
    // Before 7am: map to part of night cycle (0.5 to 1.0)
    const secondsSincePreviousSunset = secondsSinceMidnight + (24 * 3600 - sunsetTime);
    time = 0.5 + (secondsSincePreviousSunset / nightDuration) * 0.5;
  } else {
    // After 7pm: map to 0.5 to 1.0
    const secondsSinceSunset = secondsSinceMidnight - sunsetTime;
    time = 0.5 + (secondsSinceSunset / nightDuration) * 0.5;
  }

  skyMaterial.uniforms.time.value = time;
  if(DEBUG){
    skyMaterial.uniforms.time.value = debugTime;
    debugTime += 0.0008
  }
  const t = skyMaterial.uniforms.time.value;
  const angle = t * Math.PI * 2;

  // Update camera rotation based on mouse position
  cameraEuler.setFromQuaternion(camera.quaternion);
  
  // ===== CAMERA ANIMATION UPDATE =====
  if (cameraAnimation.isAnimating) {
    // Increment elapsed time using delta time for frame-rate independence
    cameraAnimation.animationElapsed += deltaTime;
    
    // Clamp to duration
    let t = cameraAnimation.animationElapsed / cameraAnimation.animationDuration;
    let finished = false;
    if (t >= 1.0) {
      t = 1.0;
      finished = true;
    }
    
    // Use easing function for smooth animation (ease-in-out)
    const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    
    // Animate position if needed
    if (cameraAnimation.animationMode === 'position' || cameraAnimation.animationMode === 'both') {
      camera.position.lerpVectors(cameraAnimation.startPosition, cameraAnimation.targetPosition, easeT);
    }
    
    // Animate rotation (overrides mouse control during animation)
    if (cameraAnimation.animationMode === 'rotation' || cameraAnimation.animationMode === 'both') {
      let deltaX = cameraAnimation.targetRotation.x - cameraAnimation.startRotation.x;
      let deltaY = cameraAnimation.targetRotation.y - cameraAnimation.startRotation.y;
      
      // Normalize angle differences to shortest path
      if (deltaX > Math.PI) deltaX -= 2 * Math.PI;
      if (deltaX < -Math.PI) deltaX += 2 * Math.PI;
      if (deltaY > Math.PI) deltaY -= 2 * Math.PI;
      if (deltaY < -Math.PI) deltaY += 2 * Math.PI;
      
      cameraEuler.x = cameraAnimation.startRotation.x + deltaX * easeT;
      cameraEuler.y = cameraAnimation.startRotation.y + deltaY * easeT;
    }
    
    if (finished) {
      cameraAnimation.isAnimating = false;
      // Sync mouse state to prevent jitter when returning to mouse control
      mouseState.targetRotX = cameraEuler.x;
      mouseState.targetRotY = cameraEuler.y;
      trueFacingEuler.x = cameraEuler.x;
      trueFacingEuler.y = cameraEuler.y;
      advanceCameraAnimationPath();
    }
  } else if (cameraAnimation.breakTimeRemaining > 0) {
    // Handle breaks between waypoints
    cameraAnimation.breakTimeRemaining -= deltaTime;
    if (cameraAnimation.breakTimeRemaining <= 0) {
      advanceCameraAnimationPath();
    }
  } else {
    // Only apply mouse control if not animating
    let deltaX = mouseState.targetRotX - cameraEuler.x;
    let deltaY = mouseState.targetRotY - cameraEuler.y;
    
    // Normalize angle differences to shortest path
    if (deltaX > Math.PI) deltaX -= 2 * Math.PI;
    if (deltaX < -Math.PI) deltaX += 2 * Math.PI;
    if (deltaY > Math.PI) deltaY -= 2 * Math.PI;
    if (deltaY < -Math.PI) deltaY += 2 * Math.PI;
    
    cameraEuler.x += deltaX * cameraAcceleration;
    cameraEuler.y += deltaY * cameraAcceleration;
  }
  
  if(!DEBUGCAM){
    camera.quaternion.setFromEuler(cameraEuler);
  }
  

  // Same path as in shader (Y–Z plane)
  const adjustedAngle = angle + 0.15;
  cachedSunDir.set(0, Math.sin(adjustedAngle), Math.cos(adjustedAngle)).normalize();
  cachedMoonDir.set(0, Math.sin(adjustedAngle + Math.PI), Math.cos(adjustedAngle + Math.PI)).normalize();

  const sunDistance  = 100;
  const moonDistance = 80;

  sunLight.position.copy(cachedSunDir).multiplyScalar(sunDistance);
  sunLight.target.position.set(0, 0, 0);
  sunLight.target.updateMatrixWorld();

  moonLight.position.copy(cachedMoonDir).multiplyScalar(moonDistance);
  moonLight.target.position.set(0, 0, 0);
  moonLight.target.updateMatrixWorld();

  const sunHeight = cachedSunDir.y;
  const dayFactor = THREE.MathUtils.clamp((sunHeight + 0.05) * 1.4, 0, 1);

  // Hemisphere sky/ground colors
  hemiLight.color.copy(cachedHemiNightSky).lerp(cachedHemiDaySky, dayFactor);
  hemiLight.intensity = 1.5 + dayFactor * 1.7;

  scene.fog.color.copy(cachedHemiNightSky).lerp(cachedHemiDaySky, dayFactor);
  scene.fog.density = 0.01 + 0.005 * (1.0 - dayFactor);

  // Update clouds - animate and adjust opacity based on time of day
  cloudLayers.forEach(({ mesh, material, speedMult }) => {
    material.uniforms.time.value += deltaTime * speedMult; // Use deltaTime for frame-rate independence
    material.uniforms.opacity.value = 0.4 + dayFactor * 0.4; // More opaque during day
    
    // Make clouds follow camera horizontally so they're always visible
    mesh.position.x = camera.position.x;
    mesh.position.z = camera.position.z;
  });

  //Render
  composer.render();
}

// Resize handler
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  composer.setSize(width * pixelRatio, height * pixelRatio);
  fxaaPass.uniforms['resolution'].value.set(1 / width, 1 / height);
});

//Top Music
document.getElementById("musicOuter").addEventListener('mouseout', (event) => {
  document.getElementById("musicIcon").innerHTML = "";
});


//Button Click Functionality
/*
0 = Start
1 = About
2 = Experience
3 = Projects
*/
var currentLocation = 0;

//Button Helper Functions
function hideButtons(){
  Array.from(document.getElementsByClassName("side-nav")).forEach(element => {
    element.style.opacity = 0;
    element.style.pointerEvents = 'none';
  });
}

function updateButtons(){
  var leftBtn = sideNavElements.left;
  var botBtn = sideNavElements.bottom;
  var rightBtn = sideNavElements.right;
  if(currentLocation == 0){
    leftBtn.style.pointerEvents = 'auto';
    leftBtn.children[0].innerHTML = "Experience";
    botBtn.style.pointerEvents = 'auto';
    botBtn.children[0].innerHTML = "Projects";
    rightBtn.style.pointerEvents = 'auto';
    rightBtn.children[0].innerHTML = "About Me";
  }else if(currentLocation == 1){
    leftBtn.style.pointerEvents = 'auto';
    leftBtn.children[0].innerHTML = "Home";
    rightBtn.style.pointerEvents = 'auto';
    rightBtn.children[0].innerHTML = "Projects";
    botBtn.style.pointerEvents = 'auto';
    botBtn.children[0].innerHTML = "Experience";
  }else if(currentLocation == 2){
    leftBtn.style.pointerEvents = 'auto';
    leftBtn.children[0].innerHTML = "Projects";
    rightBtn.style.pointerEvents = 'auto';
    rightBtn.children[0].innerHTML = "Home";
    botBtn.style.pointerEvents = 'auto';
    botBtn.children[0].innerHTML = "About Me";
  }else if(currentLocation == 3){
    botBtn.style.pointerEvents = 'auto';
    botBtn.children[0].innerHTML = "Home";
  }
  Array.from(document.getElementsByClassName("side-nav")).forEach(element => {
    if (element.style.pointerEvents =='auto'){
      element.style.opacity = 1;
    }
  });
}

document.querySelectorAll('.side-nav.right')[0].onclick = sideNavElements.right.onclick = function(){
  hideButtons();
  Sound.playClickSfx();
  if(currentLocation == 0){
    currentLocation = 1;

    Sound.startWoodSfxLoop(5 / 4.317);
    animateCameraPath([{position: [0, 1.6, -4], rotation: [0, 3 * Math.PI/8], duration: 4 / 4.317, breakTime: 0}]);
    setTimeout(updateButtons, 5 / 4.317 * 1000);
  }else if(currentLocation == 1){
    currentLocation = 3;

    nextProject();
    prevProject();

    Sound.startWoodSfxLoop(2 / 4.317);
    setTimeout(Sound.startWoodSfxLoop, 2.5 / 4.317 * 1000, 5 / 4.317);
    setTimeout(Sound.startGrassSfxLoop, 6.5 / 4.317 * 1000, 13.5 / 4.317);

    setTimeout(Sound.playDoorOpen, 4 / 4.317 * 1000, 0.2);
    setTimeout(Sound.playDoorOpen, 4 / 4.317  * 1000, 0.2);
    setTimeout(Sound.playDoorClose, (4 / 4.317 + 1)  * 1000, 0.2);
    setTimeout(Sound.playDoorClose, (4 / 4.317 + 1)  * 1000, 0.2);
    setTimeout(Sound.playButtonSound, 4 / 4.317  * 1000, 0.3);
    setTimeout(Sound.playButtonSound, 4 / 4.317  * 1000, 0.3);

    setTimeout(openDoors, 4 / 4.317 * 1000);
    setTimeout(closeDoors, (4 / 4.317 + 1.5)  * 1000);

    setTimeout(Sound.playButtonSound, (19.5 / 4.317 + 0.75)  * 1000, 0.3);
    setTimeout(Sound.playPistonSound, (19.5 / 4.317 + 0.75)  * 1000, 0.2);
    setTimeout(Sound.playPistonSound, (19.5 / 4.317 + 0.75)  * 1000, 0.2);
    setTimeout(Sound.playPistonSound, (19.5 / 4.317 + 0.75)  * 1000, 0.2);
    setTimeout(Sound.playPistonSound, (19.5 / 4.317 + 0.75)  * 1000, 0.2);
    setTimeout(hideGrass, (19.5 / 4.317 + 0.75)  * 1000);
    setTimeout(showGrass, (19.5 / 4.317 + 2.25)  * 1000);

    setTimeout(Sound.playWaterSound, (19.5 / 4.317 + 20.5 / 13 + 0.75)  * 1000, 0.4);
    animateCameraPath([{position: [0, 1.6, -6], rotation: [0, 3 * Math.PI/2], duration: 2 / 4.317, breakTime: 0}, {position: [17.5, 0.6, -6], rotation: [0, 3 * Math.PI / 2], duration: 17.5 / 4.317, breakTime: 0}, {position: [17.5, 0.6, -6], rotation: [0, 0], duration: 0.5, breakTime: 0}, {position: [17.5, 0.6, -6], rotation: [0, 0], duration: 0.25, breakTime: 0}, {position: [17, -22 + 0.6, -6], rotation: [-Math.PI / 3, 0], duration: 22 / 13, breakTime: 0} , {position: [17, -22 + 0.6, -6], rotation: [0, 0], duration: 0.75, breakTime: 0}]);
    setTimeout(updateButtons, (19.5 / 4.317 + 22/13 + 0.75) * 1000);
  }else if(currentLocation == 2){
    currentLocation = 0;

    Sound.startWoodSfxLoop(3 / 4.317);
    animateCameraPath([{position: [0, 1.6, 0], rotation: [0, Math.PI], duration: 2 / 4.317, breakTime: 0}]);
    setTimeout(updateButtons, 3 / 4.317 * 1000);
  }
};

document.querySelectorAll('.side-nav.left')[0].onclick = sideNavElements.left.onclick = function(){
  hideButtons();
  Sound.playClickSfx();
  if(currentLocation == 0){
    currentLocation = 2;

    Sound.startWoodSfxLoop(3 / 4.317);
    animateCameraPath([{position: [0, 1.6, -2], rotation: [0, 3 * Math.PI/2], duration: 2 / 4.317, breakTime: 0}]);
    setTimeout(updateButtons, 4 / 4.317 * 1000);
  }else if(currentLocation == 1){
    currentLocation = 0;

    Sound.startWoodSfxLoop(5 / 4.317);
    animateCameraPath([{position: [0, 1.6, 0], rotation: [0, Math.PI], duration: 4 / 4.317, breakTime: 0}]);
    setTimeout(updateButtons, 5 / 4.317 * 1000);
  }else if(currentLocation == 2){
    currentLocation = 3;

    nextProject();
    prevProject();

    Sound.startWoodSfxLoop(4 / 4.317);
    setTimeout(Sound.startWoodSfxLoop, 4.5 / 4.317 * 1000, 5 / 4.317);
    setTimeout(Sound.startGrassSfxLoop, 8.5 / 4.317 * 1000, 13.5 / 4.317);

    setTimeout(Sound.playDoorOpen, 6 / 4.317 * 1000, 0.2);
    setTimeout(Sound.playDoorOpen, 6 / 4.317  * 1000, 0.2);
    setTimeout(Sound.playDoorClose, (6 / 4.317 + 1)  * 1000, 0.2);
    setTimeout(Sound.playDoorClose, (6 / 4.317 + 1)  * 1000, 0.2);
    setTimeout(Sound.playButtonSound, 6 / 4.317  * 1000, 0.3);

    setTimeout(openDoors, 6 / 4.317 * 1000);
    setTimeout(closeDoors, (6 / 4.317 + 1.5)  * 1000);

    setTimeout(Sound.playButtonSound, (21.5 / 4.317 + 0.75)  * 1000, 0.3);
    setTimeout(Sound.playPistonSound, (21.5 / 4.317 + 0.75)  * 1000, 0.2);
    setTimeout(Sound.playPistonSound, (21.5 / 4.317 + 0.75)  * 1000, 0.2);
    setTimeout(Sound.playPistonSound, (21.5 / 4.317 + 0.75)  * 1000, 0.2);
    setTimeout(Sound.playPistonSound, (21.5 / 4.317 + 0.75)  * 1000, 0.2);
    setTimeout(hideGrass, (21.5 / 4.317 + 0.75)  * 1000);
    setTimeout(showGrass, (21.5 / 4.317 + 2.25)  * 1000);

    setTimeout(Sound.playWaterSound, (21.5 / 4.317 + 20.5 / 13 + 0.75)  * 1000, 0.4);
    animateCameraPath([{position: [0, 1.6, -6], rotation: [0, 3 * Math.PI/2], duration: 4 / 4.317, breakTime: 0}, {position: [17.5, 0.6, -6], rotation: [0, 3 * Math.PI / 2], duration: 17.5 / 4.317, breakTime: 0}, {position: [17.5, 0.6, -6], rotation: [0, 0], duration: 0.5, breakTime: 0}, {position: [17.5, 0.6, -6], rotation: [0, 0], duration: 0.25, breakTime: 0}, {position: [17, -22 + 0.6, -6], rotation: [-Math.PI / 3, 0], duration: 22 / 13, breakTime: 0} , {position: [17, -22 + 0.6, -6], rotation: [0, 0], duration: 0.75, breakTime: 0}]);
    setTimeout(updateButtons, (21.5 / 4.317 + 22/13 + 0.75) * 1000);
  }
};

document.querySelectorAll('.side-nav.bottom')[0].onclick = sideNavElements.bottom.onclick = function(){
  hideButtons();
  Sound.playClickSfx();
  if(currentLocation == 0){
    currentLocation = 3;

    nextProject();
    prevProject();

    Sound.startWoodSfxLoop(6 / 4.317);
    setTimeout(Sound.startWoodSfxLoop, 6.5 / 4.317 * 1000, 5 / 4.317);
    setTimeout(Sound.startGrassSfxLoop, 10.5 / 4.317 * 1000, 13.5 / 4.317);

    setTimeout(Sound.playDoorOpen, 8 / 4.317 * 1000, 0.2);
    setTimeout(Sound.playDoorOpen, 8 / 4.317  * 1000, 0.2);
    setTimeout(Sound.playDoorClose, (8 / 4.317 + 1)  * 1000, 0.2);
    setTimeout(Sound.playDoorClose, (8 / 4.317 + 1)  * 1000, 0.2);
    setTimeout(Sound.playButtonSound, 8 / 4.317  * 1000, 0.3);
    setTimeout(Sound.playButtonSound, 8 / 4.317  * 1000, 0.3);

    setTimeout(openDoors, 8 / 4.317 * 1000);
    setTimeout(closeDoors, (8 / 4.317 + 1.5)  * 1000);

    setTimeout(Sound.playButtonSound, (23.5 / 4.317 + 0.75)  * 1000, 0.3);
    setTimeout(Sound.playPistonSound, (23.5 / 4.317 + 0.75)  * 1000, 0.2);
    setTimeout(Sound.playPistonSound, (23.5 / 4.317 + 0.75)  * 1000, 0.2);
    setTimeout(Sound.playPistonSound, (23.5 / 4.317 + 0.75)  * 1000, 0.2);
    setTimeout(Sound.playPistonSound, (23.5 / 4.317 + 0.75)  * 1000, 0.2);
    setTimeout(hideGrass, (23.5 / 4.317 + 0.75)  * 1000);
    setTimeout(showGrass, (23.5 / 4.317 + 2.25)  * 1000);

    setTimeout(Sound.playWaterSound, (23.5 / 4.317 + 20.5 / 13 + 0.75)  * 1000, 0.4);
    animateCameraPath([{position: [0, 1.6, -6], rotation: [0, 3 * Math.PI/2], duration: 6 / 4.317, breakTime: 0}, {position: [17.5, 0.6, -6], rotation: [0, 3 * Math.PI / 2], duration: 17.5 / 4.317, breakTime: 0}, {position: [17.5, 0.6, -6], rotation: [0, 0], duration: 0.5, breakTime: 0}, {position: [17.5, 0.6, -6], rotation: [0, 0], duration: 0.25, breakTime: 0}, {position: [17, -22 + 0.6, -6], rotation: [-Math.PI / 3, 0], duration: 22 / 13, breakTime: 0} , {position: [17, -22 + 0.6, -6], rotation: [0, 0], duration: 0.75, breakTime: 0}]);
    setTimeout(updateButtons, (23.5 / 4.317 + 22/13 + 0.75) * 1000);
  }else if(currentLocation == 1){
    currentLocation = 2;

    Sound.startWoodSfxLoop(3 / 4.317);
    animateCameraPath([{position: [0, 1.6, -2], rotation: [0, 3 * Math.PI/2], duration: 2 / 4.317, breakTime: 0}]);
    setTimeout(updateButtons, 4 / 4.317 * 1000);
  }else if(currentLocation == 2){
    currentLocation = 1;

    Sound.startWoodSfxLoop(3 / 4.317);
    animateCameraPath([{position: [0, 1.6, -4], rotation: [0, 3 * Math.PI/8], duration: 2 / 4.317, breakTime: 0}]);
    setTimeout(updateButtons, 3 / 4.317 * 1000);
  }else if(currentLocation == 3){
    currentLocation = 0;
    
    setTimeout(Sound.playButtonSound, 0.75  * 1000, 0.3);
    setTimeout(Sound.playTeleportSound, 1  * 1000, 0.3);
    animateCameraPath([{position: [17, -22 + 0.6, -6], rotation: [0, Math.PI], duration: 0.75, breakTime: 0}, {position: [17, -22 + 0.6, -6], rotation: [0, Math.PI], duration: 0.25, breakTime: 0}, {position: [0, 1.6, 0], rotation: [0, Math.PI], duration: 0, breakTime: 0}]);
    setTimeout(updateButtons, (1 + 1/4.317) * 1000);
  }
};