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

export type MapEventData = {
    type: 'ensure-tree' | 'move-to';
    coords: { x: number; y: number };
};

export interface Sources<State> {
    DOM: DOMSource;
    router: RouterSource;
    state: StateSource<State>;
    dataQuery: Stream<any>;
    commandGateway: Stream<Command>;
}

export interface Sinks<State> {
    DOM?: Stream<VNode>;
    router?: Stream<HistoryInput>;
    speech?: Stream<string>;
    layout?: Stream<LayoutState>;
    state?: Stream<Reducer<State>>;
    dataQuery?: Stream<{ type: string; id: string }>;
    commandGateway?: Stream<any>;
    map?: Stream<Command<MapEventData[]>>;
}
