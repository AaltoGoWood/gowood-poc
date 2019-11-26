import { run } from '@cycle/run';
import { getDrivers, wrapMain } from './drivers';
import { Component } from './interfaces';
import { App } from './components/app';
import { initMap } from './components/map';
import { init3d } from './components/3d';

const main: Component<any> = wrapMain(App);

run(main as any, getDrivers());

// Init map and building 3D model once document is loaded
window.addEventListener('load', () => {
    console.log('loading map and 3D model');
    initMap();
});
