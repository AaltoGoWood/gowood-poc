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
        | 'navigate-to-building-browser'
        | 'refresh-map';
    id?: string;
    data?: T;
};

export interface QueryEntity {
    id: string;
    type: string;
    traversePath: QueryEntity[];
    visualization?: {
        coords?: any;
        model?: any;
    };
}

export type MutateMapEventData = {
    type: 'ensure-tree' | 'move-to' | 'reset-markers' | 'refresh';
    data?: any;
    coords?: { lng: number; lat: number };
};

export type MapEventData = {
    type: 'map-object-clicked';
    data?: any;
    coords?: { lng: number; lat: number };
};

export type BuildingEventData = {
    type: 'building-clicked' | 'mouse-enter-plywood' | 'mouse-leave-plywood';
    data?: any;
};

export interface Sources<State> {
    DOM: DOMSource;
    router: RouterSource;
    state: StateSource<State>;
    dataQuery: Stream<any>;
    commandGateway: Stream<Command>;
    map: Stream<MapEventData>;
    building: Stream<BuildingEventData>;
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
    building?: Stream<Command<BuildingEventData[]>>;
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

export interface AttributesLayout {
    attributeTagFn: (field: string) => string;
}
export interface RowsLayout {}
export interface CommandsLayout {
    showOrigins?: boolean;
    [key: string]: any;
}
export type VisualizationViewType = 'map' | 'building';
export interface EntityLayout {
    attributes: AttributesLayout;
    rows: RowsLayout;
    commands: CommandsLayout;
    defaultView: VisualizationViewType;
}
export interface LayoutDirectiveCollection {
    [type: string]: EntityLayout;
}
