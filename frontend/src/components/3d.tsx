import * as THREE from 'three';
import {
    Mesh,
    Camera,
    Scene,
    Renderer,
    AmbientLight,
    DirectionalLight,
    Object3D
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let scene: Scene, camera: Camera, renderer: Renderer;
let controls: OrbitControls;
let hlight: AmbientLight, directionalLight: DirectionalLight;
let loader: GLTFLoader;

const container: HTMLDivElement = document.getElementById(
    'building'
) as HTMLDivElement;

export function init3d(): void {
    console.log('>> init3d()');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdddddd);

    const fov = 40; //Camera frustum vertical field of view.
    const aspectRatio = container.clientWidth / container.clientHeight; //Camera frustum aspect ratio.
    const near = 1; //Camera frustum near plane.
    const far = 5000; //Camera frustum far plane.
    camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
    //camera.rotation.y = (45 / 180) * Math.PI;

    camera.position.x = 500;
    camera.position.y = 500;
    camera.position.z = 2500;

    hlight = new THREE.AmbientLight(0x404040, 20);
    scene.add(hlight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 80);
    directionalLight.position.set(0, 1, 0);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    if (container) {
        container.appendChild(renderer.domElement);
    }

    controls = new OrbitControls(camera, container);

    loader = new GLTFLoader();
    loader.load('/models/blue-building/scene.gltf', function(gltf) {
        let model: Object3D;
        model = gltf.scene.children[0];
        //model.scale.set(1.5, 1.5, 1.5); //Scale model if necessary
        scene.add(gltf.scene);
        animate();
    });
}

export function animate(): void {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
