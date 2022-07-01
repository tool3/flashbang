import './style.css';
import * as dat from 'lil-gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { gsap } from 'gsap';
// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
// import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
// import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
// import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
/**
 * Base
 */
// Debug
let flashbang;
const gui = new dat.GUI({
  width: 300
  // autoPlace: false
});
gui.close();
const debugObject = {
  backlightColor: '#ffffff',
  backlightIntensity: 60.0,
  keyLightColor: '#ffffff',
  keyLightIntensity: 60.0,
  fillLightColor: '#ffffff',
  fillLightIntensity: 60.0,
  rotation: 0,
  createFlashbang: () => {
    const mesh = flashbang.clone();
    mesh.position.set(2, 2, 2);
    mesh.position.x = (Math.random() - 0.5) * 30;
    mesh.position.y = (Math.random() - 0.5) * 30;
    mesh.position.z = (Math.random() - 0.5) * 30;

    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;

    const scale = Math.random();
    mesh.scale.set(scale, scale, scale);
    scene.add(mesh);
  }
};

gui.addColor(debugObject, 'backlightColor').onChange((value) => {
  backLight.color.set(value);
});
gui
  .add(debugObject, 'backlightIntensity')
  .min(10)
  .max(200)
  .onChange((value) => {
    backLight.intensity = value;
  });

gui.addColor(debugObject, 'keyLightColor').onChange((value) => {
  keyLight.color.set(value);
});
gui
  .add(debugObject, 'keyLightIntensity')
  .min(10)
  .max(200)
  .onChange((value) => {
    keyLight.intensity = value;
  });

gui.addColor(debugObject, 'fillLightColor').onChange((value) => {
  triLight.color.set(value);
});
gui
  .add(debugObject, 'fillLightIntensity')
  .min(10)
  .max(200)
  .onChange((value) => {
    triLight.intensity = value;
  });

gui
  .add(debugObject, 'rotation')
  .min(0)
  .max(360)
  .step(0.1)
  .onChange((value) => {
    flashbang.rotation.y = value / 55;
  });
gui.add(debugObject, 'createFlashbang').name('make random flashbang');

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();
const overlayGeometry = new THREE.PlaneBufferGeometry(2, 2, 1, 1);
const overlayMaterial = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: {
    uAlpha: { value: 1 }
  },
  vertexShader: `
  
  void main() {
    gl_Position = vec4(position, 1.0);
  }
   `,
  fragmentShader: `
  uniform float uAlpha;
  void main() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
  }
  `
});
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
scene.add(overlay);

const element = document.querySelector('.loading-bar');
const title = document.querySelector('.intro-title');
const loadingManager = new THREE.LoadingManager(
  (done) => {
    gsap.delayedCall(0.5, () => {
      gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0 });
      element.style.transform = `scaleY(0)`;
      element.classList.add('ended');
      title.style.opacity = 0;
      setTimeout(() => {
        title.style.display = 'none';
      }, 2000);
    });
  },
  (url, loaded, total) => {
    element.style.transform = `scaleX(${loaded / total})`;
  }
);

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader(loadingManager);
//model

const color = textureLoader.load('/flashbang/flashbang_lowpoly_Flashbang_BaseColor.png');
const height = textureLoader.load('/flashbang/flashbang_lowpoly_Flashbang_Height.png');
const roughness = textureLoader.load('/flashbang/flashbang_lowpoly_Flashbang_Roughness.png');
const normal = textureLoader.load('/flashbang/flashbang_lowpoly_Flashbang_Normal.png');
const metallic = textureLoader.load('/flashbang/flashbang_lowpoly_Flashbang_Metallic.png');
const flashbangMaterial = new THREE.MeshStandardMaterial({
  displacementScale: 0.00001,
  displacementMap: height,
  map: color,
  normalMap: normal,
  roughnessMap: roughness,
  metalnessMap: metallic
});

const fbxLoader = new FBXLoader();
fbxLoader.load('/flashbang/flashbang_lowpoly.fbx', (fbx) => {
  console.log(fbx);
  flashbang = fbx;
  fbx.traverse((child) => {
    if (child.isMesh) {
      child.material = flashbangMaterial;
    }
  });
  scene.add(fbx);
});

const ambient = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambient);

const keyLight = new THREE.PointLight(debugObject.keyLightColor);
keyLight.intensity = debugObject.keyLightIntensity;
keyLight.position.set(20, -10, -5);

scene.add(keyLight);

const triLight = new THREE.PointLight(debugObject.fillLightColor);
triLight.intensity = debugObject.fillLightIntensity;
triLight.position.set(0, -10, -30);
scene.add(triLight);

const backLight = new THREE.PointLight(debugObject.backlightColor);
backLight.intensity = debugObject.backlightIntensity;
backLight.position.set(-10, -10, 10);
scene.add(backLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;

// renderer.toneMapping = THREE.ACESFilmicToneMapping;
// renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap;

let rendererTargetClass = null;

if (renderer.getPixelRatio() >= 1 && renderer.capabilities.isWebGL2) {
  rendererTargetClass = THREE.WebGLMultisampleRenderTarget;
  console.log('using webglMultiSampleTarget');
} else {
  console.log('using webgltarget');
  rendererTargetClass = THREE.WebGLRenderTarget;
}

// post processing
// target
// const renderTarget = new rendererTargetClass(800, 600, {
//   encoding: THREE.sRGBEncoding,
//   minFilter: THREE.LinearFilter,
//   magFilter: THREE.LinearFilter
// });

// const effectComposer = new EffectComposer(renderer, renderTarget);
// effectComposer.setSize(sizes.width, sizes.height);
// effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// const renderPass = new RenderPass(scene, camera);
// effectComposer.addPass(renderPass);
/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);
  effectComposer.render();
  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
