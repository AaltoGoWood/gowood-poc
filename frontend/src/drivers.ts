import { makeDOMDriver } from '@cycle/dom';
import { makeHistoryDriver } from '@cycle/history';
import { withState } from '@cycle/state';
import { routerify } from 'cyclic-router';
import switchPath from 'switch-path';
import { layoutDriver } from './drivers/layoutDriver';
import { dataQueryDriver } from './drivers/dataQueryDriver';
import { mapDriver } from './drivers/mapDriver';
import { buildingDriver } from './drivers/buildingDriver';

import { Component } from './interfaces';

const driversFactories: any = {
    DOM: () => makeDOMDriver('#app'),
    history: () => makeHistoryDriver(),
    layout: () => layoutDriver,
    dataQuery: () => dataQueryDriver,
    map: () => mapDriver,
    building: () => buildingDriver
};

export function getDrivers(): any {
    return Object.keys(driversFactories)
        .map(k => ({ [k]: driversFactories[k]() }))
        .reduce((a, c) => ({ ...a, ...c }), {});
}

export const driverNames = Object.keys(driversFactories)
    .filter(name => name !== 'history')
    .concat(['state', 'router']);

export function wrapMain(main: Component<any>): Component<any> {
    return withState(routerify(main as any, switchPath as any)) as any;
}
