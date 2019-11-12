import { Dictionary } from 'ramda';
import * as THREE from 'three';
import {
    Mesh,
    Camera,
    Scene,
    Renderer,
    Geometry,
    Material,
    AmbientLight,
    DirectionalLight,
    PointLight,
    Object3D
} from 'three';
import { OrbitControls } from 'three-orbitcontrols-ts';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export function foo(): void {
    console.log('in 3d.tsx');
}

let scene: Scene, camera: Camera, renderer: Renderer;
let controls: OrbitControls;
let hlight: AmbientLight, directionalLight: DirectionalLight;
let light: PointLight,
    light2: PointLight,
    light3: PointLight,
    light4: PointLight;
let loader: GLTFLoader;

const container = document.getElementById('3d-model');

//SIMPLE TEST
// let camera: Camera, scene: Scene, renderer: Renderer, mesh: Mesh;
// let geometry: Geometry, material: Material;

export function init3d(): void {
    //SIMPLE TEST
    // camera = new THREE.PerspectiveCamera(
    //     70,
    //     window.innerWidth / window.innerHeight,
    //     0.01,
    //     10
    // );
    // camera.position.z = 1;

    // scene = new THREE.Scene();

    // geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    // material = new THREE.MeshNormalMaterial();

    // mesh = new THREE.Mesh(geometry, material);
    // scene.add(mesh);

    // renderer = new THREE.WebGLRenderer({ antialias: true });
    // renderer.setSize(window.innerWidth, window.innerHeight);

    // //document.body.appendChild( renderer.domElement );
    // if (container) {
    //     container.appendChild(renderer.domElement);
    // }

    console.log('>> init3d()');
    // 1
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdddddd);
    camera = new THREE.PerspectiveCamera(
        40,
        window.innerWidth / window.innerHeight,
        1,
        5000
    );
    camera.rotation.y = (45 / 180) * Math.PI;
    camera.position.x = 800;
    camera.position.y = 100;
    camera.position.z = 1000;

    controls = new OrbitControls(camera);

    hlight = new THREE.AmbientLight(0x404040, 100);
    scene.add(hlight);
    directionalLight = new THREE.DirectionalLight(0xffffff, 100);
    directionalLight.position.set(0, 1, 0);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    light = new THREE.PointLight(0xc4c4c4, 10);
    light.position.set(0, 300, 500);
    scene.add(light);
    light2 = new THREE.PointLight(0xc4c4c4, 10);
    light2.position.set(500, 100, 0);
    scene.add(light2);
    light3 = new THREE.PointLight(0xc4c4c4, 10);
    light3.position.set(0, 100, -500);
    scene.add(light3);
    light4 = new THREE.PointLight(0xc4c4c4, 10);
    light4.position.set(-500, 300, 500);
    scene.add(light4);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    loader = new GLTFLoader();
    loader.load('../models/car/scene.gltf', function(gltf) {
        let car: Object3D;
        car = gltf.scene.children[0];
        car.scale.set(0.5, 0.5, 0.5);
        scene.add(gltf.scene);
        animate();
    });
}

export function animate(): void {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

//SIMPLE TEST

// export function animate(): void {
//     requestAnimationFrame(animate);
//     mesh.rotation.x += 0.01;
//     mesh.rotation.y += 0.02;
//     renderer.render(scene, camera);
// }
