import { run } from '@cycle/run';
import { getDrivers, wrapMain } from './drivers';
import { Component } from './interfaces';
import { App } from './components/app';
import { initMap } from './components/map';
import { init3d, animate } from './components/3d';

const main: Component<any> = wrapMain(App);
console.log('index.ts FTW');

run(main as any, getDrivers());

// Init map once document is loaded
window.addEventListener('load', () => {
    console.log('map loaded');
    initMap();
    init3d();
});
