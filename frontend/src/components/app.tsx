import xs, { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';
import { extractSinks } from 'cyclejs-utils';
import isolate from '@cycle/isolate';

import { driverNames } from '../drivers';
import { Sources, Sinks, Reducer, Component } from '../interfaces';

import { Counter, State as CounterState } from './counter';
import { Speaker, State as SpeakerState } from './speaker';
import { MapSearch, State as MapSearchState } from './map-search';
import { Building, State as BuildingState } from './building';
import {
    RawMaterialMap,
    State as RawMaterialMapState
} from './raw-material-map';

export interface State {
    counter?: CounterState;
    speaker?: SpeakerState;
    mapSearch?: MapSearchState;
    building?: BuildingState;
    rawMaterialMap?: RawMaterialMapState;
}

export function App(sources: Sources<State>): Sinks<State> {
    const match$ = sources.router.define({
        '/counter': isolate(Counter, 'counter'),
        '/speaker': isolate(Speaker, 'speaker'),
        '/map-search': isolate(MapSearch, 'map-search'),
        '/building': isolate(Building, 'building'),
        '/raw-material-map': isolate(RawMaterialMap, 'raw-material-map')
    });

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
        router: xs.merge(redirect$, firstTimePageLoad$, sinks.router)
    };
}
