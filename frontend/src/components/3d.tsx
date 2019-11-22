import * as THREE from 'three';
import {
    Mesh,
    Camera,
    Scene,
    Renderer,
    AmbientLight,
    DirectionalLight,
    Object3D,
    Vector2
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { BuildingEventData } from './../interfaces';

let scene: Scene, camera: Camera, renderer: Renderer;
let controls: OrbitControls;
let hlight: AmbientLight, directionalLight: DirectionalLight;
let loader: GLTFLoader;

const raycaster = new THREE.Raycaster();
const mouse: Vector2 = new THREE.Vector2();
let intersections: THREE.Intersection[];

const container: HTMLDivElement = document.getElementById(
    'building'
) as HTMLDivElement;

export function init3d(): void {
    console.log('>> init3d()');
    console.log('>> 3D model container ', container);

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
        console.log('model in loading', model);
        //model.scale.set(1.5, 1.5, 1.5); //Scale model if necessary
        scene.add(gltf.scene);
        animate();
    });
}

export function animate(): void {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function dispatchBuildingEvent(eventData?: BuildingEventData): void {
    console.log('>> dispatchBuildingEvent', eventData);
    const event = new CustomEvent<BuildingEventData>('building-event', {
        detail: eventData
    });
    document.body.dispatchEvent(event);
}

function onMouse(event: MouseEvent): void {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components.
    // The X coord needs to be adjusted to take sidepanel into account
    mouse.x =
        ((event.clientX - container.offsetLeft) / container.clientWidth) * 2 -
        1;
    mouse.y = -(event.clientY / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // calculate objects intersecting the picking ray
    intersections = raycaster.intersectObjects(scene.children, true);

    const mouseMsg: String = `event.x:${event.x} event.y:${event.y} x:${mouse.x} y:${mouse.y}`;
    if (intersections.length > 0) {
        console.log(
            `${mouseMsg} And another one HITS THE BUILDING!`,
            intersections
        );
        const eventData: BuildingEventData = {
            type: 'building-clicked',
            data: {
                type: 'plywood',
                id: 'p123'
            }
        };
        dispatchBuildingEvent(eventData);
    } else {
        console.log(mouseMsg);
    }
}

export function registerMouseEvent(): void {
    console.log('registering 3D-model mouse event listener');
    //window.addEventListener( 'mousemove', onMouse, false );
    //container.addEventListener( 'mousemove', onMouse, false );
    container.addEventListener('click', onMouse, false);
}
