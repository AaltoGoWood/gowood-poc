import * as THREE from 'three';
import {
    Mesh,
    Camera,
    Scene,
    Renderer,
    AmbientLight,
    DirectionalLight,
    Object3D,
    Vector2,
    Vector3,
    MeshBasicMaterial
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { BuildingEventData } from './../interfaces';
import { curry, find, propEq } from 'ramda';

type PlywoodHandler = (plywoodSheet?: Object3D) => void;

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

const frontWall1 = new Vector3(-115, 112, 220);
const frontWall2 = new Vector3(-60, 112, 220);
const frontWall3 = new Vector3(75, 112, 220);
const plywoodSheets: Object3D[] = [
    createPlywoodSheet('p123', frontWall1),
    createPlywoodSheet('p124', frontWall2),
    createPlywoodSheet('p125', frontWall3)
];

function getPlywoodSheetWithId(
    plywoodMeshes: Object3D[],
    plywoodId: string
): Object3D | undefined {
    return find(
        (plywoodMesh: Object3D) => plywoodMesh.userData.id === plywoodId
    )(plywoodMeshes);
}

function materialWithOpacity(opacity: number): MeshBasicMaterial {
    const texture: THREE.Texture = THREE.ImageUtils.loadTexture(
        '/images/plywood_texture.jpg'
    );
    const material = new MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide,
        map: texture,
        transparent: true,
        opacity: opacity
    });
    material.needsUpdate = true;
    return material;
}

function createPlywoodSheet(id: String, position: Vector3): THREE.Mesh {
    const width: number = 50; //Width along the X axis
    const height: number = 147; //Height along the Y axis
    const widthSegments: number = 32; //Optional. Default is 1.
    const heigthSegments: number = 1; //Optional. Default is 1.
    const geometry = new THREE.PlaneGeometry(
        width,
        height,
        widthSegments,
        heigthSegments
    );

    const plane = new THREE.Mesh(geometry, materialWithOpacity(0.7));
    plane.userData = { id: id };

    plane.position.set(position.x, position.y, position.z);
    return plane;
}

export function init3d(): void {
    console.log('>> init3d() container: ', container);

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

    scene.add(...plywoodSheets);

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
    const event = new CustomEvent<BuildingEventData>('building-event', {
        detail: eventData
    });
    document.body.dispatchEvent(event);
}

function onMouse(
    handlers: { overObject?: PlywoodHandler; offObjects?: PlywoodHandler },
    event: MouseEvent
): void {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components.
    // The X coord needs to be adjusted to take sidepanel into account
    mouse.x =
        ((event.clientX - container.offsetLeft) / container.clientWidth) * 2 -
        1;
    mouse.y = -(event.clientY / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // calculate objects intersecting the picking ray
    intersections = raycaster.intersectObjects(plywoodSheets, true);

    // const mouseMsg: String = `event.x:${event.x} event.y:${event.y} x:${mouse.x} y:${mouse.y}`;
    if (intersections.length > 0) {
        const plywoodMesh: any = intersections[0].object;
        handlers.overObject && handlers.overObject(plywoodMesh);
    } else {
        handlers.offObjects && handlers.offObjects();
    }
}

function dispatchPlywoodClicked(plywoodMesh: Object3D): void {
    const plywoodId: String = plywoodMesh.userData.id;
    if (plywoodId) {
        const eventData: BuildingEventData = {
            type: 'building-clicked',
            data: {
                type: 'plywood',
                id: plywoodId
            }
        };
        dispatchBuildingEvent(eventData);
    }
}

function dispatchPlywoodHoverOff(): void {
    const eventData: BuildingEventData = {
        type: 'mouse-off-3d-object'
    };
    dispatchBuildingEvent(eventData);
    return;
}

function dispatchPlywoodHover(plywoodMesh: Object3D): void {
    const plywoodId: String = plywoodMesh.userData.id;
    if (plywoodId) {
        const eventData: BuildingEventData = {
            type: 'mouse-over-3d-object',
            data: {
                type: 'plywood',
                id: plywoodId
            }
        };
        dispatchBuildingEvent(eventData);
    }
}

function setOpacity(plywoodMesh: Object3D, opacity: number): void {
    //HACK the types we have seem to miss the property material
    const withMaterial: any = plywoodMesh as any;
    withMaterial.material.opacity = opacity;
}

function hilightPlywoodSheet(plywoodMesh: Object3D): void {
    setOpacity(plywoodMesh, 1.0);
}

function deHilightPlywoodSheets(plywoodMeshes: Object3D[]): void {
    plywoodMeshes.forEach(sheet => setOpacity(sheet, 0.7));
}

document.body.addEventListener(
    'building-event',
    (e: CustomEvent<BuildingEventData>) => {
        const type = e.detail.type;
        switch (type) {
            case 'selected-entities': {
                deHilightPlywoodSheets(plywoodSheets);
                (e.detail.data || [])
                    .map((entity: any) =>
                        getPlywoodSheetWithId(plywoodSheets, entity.id)
                    )
                    .filter(
                        (plywoodMesh: Object3D) => plywoodMesh !== undefined
                    )
                    .forEach((plywoodMesh: Object3D) => {
                        hilightPlywoodSheet(plywoodMesh);
                    });
            }
            default: {
                break;
            }
        }
    }
);

container.addEventListener(
    'click',
    curry(onMouse)({ overObject: dispatchPlywoodClicked }),
    false
);

container.addEventListener(
    'mousemove',
    curry(onMouse)({
        overObject: dispatchPlywoodHover,
        offObjects: dispatchPlywoodHoverOff
    }),
    false
);
