import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Instantiate a loader
const loader = new GLTFLoader();

loader.load(

    'assets/scene.gltf',

    function (gltf) {
        sword = gltf.scene;  // sword 3D object is loaded
        sword.scale.set(2, 2, 2);
        sword.position.y = 4;
        scene.add(gltf.scene);

    }
);


camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);


    renderer.render(scene, camera);
}
animate();