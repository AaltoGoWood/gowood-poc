import xs, { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';
import { extractSinks } from 'cyclejs-utils';
import isolate from '@cycle/isolate';

import { driverNames } from '../drivers';
import { Sources, Sinks, Reducer, Component } from '../interfaces';

import { MapSearch, State as MapSearchState } from './map-search';
import { Building, State as BuildingState } from './building';
import {
    RawMaterialMap,
    State as RawMaterialMapState
} from './raw-material-map';

export interface State {
    mapSearch?: MapSearchState;
    building?: BuildingState;
    rawMaterialMap?: RawMaterialMapState;
}

export function App(sources: Sources<State>): Sinks<State> {
    const match$ = sources.router.define({
        '/map-search': isolate(MapSearch, 'map-search'),
        '/building/:id': (props: any) =>
            isolate(Building.bind(undefined, props), 'building'),
        '/raw-material-map': isolate(RawMaterialMap, 'raw-material-map')
    });

    const layout$ = sources.router
        .define({
            '/map-search': { map: true, building: false },
            '/building/:id': { map: false, building: true },
            '/raw-material-map': { map: true, building: false }
        })
        .map((route: any) => route.value);

    const componentSinks$: Stream<Sinks<State>> = match$
        .filter(({ path, value }: any) => path && typeof value === 'function')
        .map(({ path, value }: { path: string; value: Component<any> }) => {
            return value({
                ...sources,
                router: sources.router.path(path)
            });
        });

    const redirect$: Stream<string> = sources.router.history$
        .filter((l: Location) => l.pathname === '/')
        .mapTo('/map-search');

    // Ensure that first page loads are routed and rendered correctly
    const firstTimePageLoad$: Stream<string> = sources.router.history$
        .filter((l: any) => l.pathname !== '/' && l.type === undefined)
        .map((l: Location) => l.pathname);

    const sinks = extractSinks(componentSinks$, driverNames);

    return {
        ...sinks,
        layout: layout$,
        router: xs.merge(redirect$, firstTimePageLoad$, sinks.router)
    };
}
