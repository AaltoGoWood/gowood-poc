import { run } from '@cycle/run';
import { getDrivers, wrapMain } from './drivers';
import { Component } from './interfaces';
import { App } from './components/app';

import { initMap } from './components/map';

const main: Component<any> = wrapMain(App);

run(main as any, getDrivers());

// XXX super hacky
if (document.location.href.indexOf('map') !== -1) {
    initMap();
} else {
    document.querySelector('map')!.remove();
}
