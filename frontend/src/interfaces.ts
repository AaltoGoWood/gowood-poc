import { Stream } from 'xstream';
import { DOMSource, VNode } from '@cycle/dom';
import { StateSource, Reducer } from '@cycle/state';
import { RouterSource, HistoryInput } from 'cyclic-router';
import { State as LayoutState } from './drivers/layoutDriver';

export { Reducer } from '@cycle/state';

export type Component<State> = (s: Sources<State>) => Sinks<State>;

export type Command<T = any> = {
    type:
        | 'show-building'
        | 'show-building-assets'
        | 'reset-building-assets'
        | 'show-asset-origin'
        | 'navigate-to-building-browser';
    id?: string;
    data?: T;
};

export type MutateMapEventData = {
    type: 'ensure-tree' | 'move-to' | 'reset-markers';
    data?: any;
    coords: { lng: number; lat: number };
};

export type MapEventData = {
    type: 'map-object-clicked';
    data?: any;
    coords?: { lng: number; lat: number };
};

export interface Sources<State> {
    DOM: DOMSource;
    router: RouterSource;
    state: StateSource<State>;
    dataQuery: Stream<any>;
    commandGateway: Stream<Command>;
    map: Stream<MapEventData>;
}

export interface Sinks<State> {
    DOM?: Stream<VNode>;
    router?: Stream<HistoryInput>;
    speech?: Stream<string>;
    layout?: Stream<LayoutState>;
    state?: Stream<Reducer<State>>;
    dataQuery?: Stream<{ type: string; id: string }>;
    commandGateway?: Stream<any>;
    map?: Stream<Command<MutateMapEventData[]>>;
}

export interface RouteProps {
    id?: string;
    type?: string;
    qs?: any;
}

export interface RoutedComponentAcc<T = any> {
    renderFn: (props: RouteProps) => (sources: Sources<T>) => Sinks<T>;
    routeProps: RouteProps;
}
