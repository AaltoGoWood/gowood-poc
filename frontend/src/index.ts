import { run } from '@cycle/run';
import { getDrivers, wrapMain } from './drivers';
import { Component } from './interfaces';
import { App } from './components/app';

import { initMap } from './components/map';

const main: Component<any> = wrapMain(App);

run(main as any, getDrivers());

// Init map once document is loaded
window.addEventListener('load', () => {
    console.log('map loaded');
    initMap();
});
