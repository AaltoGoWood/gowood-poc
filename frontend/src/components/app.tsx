import xs, { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';
import { extractSinks } from 'cyclejs-utils';
import isolate from '@cycle/isolate';

import { driverNames } from '../drivers';
import { Sources, Sinks, Reducer, Component } from '../interfaces';

import { Counter, State as CounterState } from './counter';
import { Speaker, State as SpeakerState } from './speaker';
import { MapSearch, State as MapSearchState } from './map-search';

export interface State {
    counter?: CounterState;
    speaker?: SpeakerState;
    mapSearch?: MapSearchState;
}

export function App(sources: Sources<State>): Sinks<State> {
    const match$ = sources.router.define({
        '/counter': isolate(Counter, 'counter'),
        '/speaker': isolate(Speaker, 'speaker'),
        '/map-search': isolate(MapSearch, 'map-search')
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

    const sinks = extractSinks(componentSinks$, driverNames);
    return {
        ...sinks,
        router: xs.merge(redirect$, sinks.router)
    };
}
