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
        | 'refresh-map'
        | 'mouse-enter-entity'
        | 'mouse-leave-entity'
        | 'selected-entities';
    id?: string;
    data?: T;
};

export interface QueryEntity {
    id: string;
    type: string;
    original_id?: string;
    original_type?: string;
    traversePath: QueryEntity[];
    visualization?: {
        coords?: any;
        model?: any;
    };
}

export type MutateMapEventData = {
    type:
        | 'ensure-tree'
        | 'move-to'
        | 'reset-markers'
        | 'refresh'
        | 'selected-entities';
    data?: any;
    coords?: { lng: number; lat: number };
};

export type MapEventData = {
    type:
        | 'map-object-clicked'
        | 'map-object-mouse-enter'
        | 'map-object-mouse-leave';
    data?: any;
    coords?: { lng: number; lat: number };
};

export type BuildingEventData<T = any> = {
    type:
        | 'building-clicked'
        | 'selected-entities'
        | 'mouse-enter-plywood'
        | 'mouse-leave-plywood'
        | 'mouse-over-3d-object'
        | 'mouse-off-3d-object';
    data?: T;
};

export interface Sources<State> {
    DOM: DOMSource;
    router: RouterSource;
    state: StateSource<State>;
    dataQuery: Stream<any>;
    commandGateway: Stream<Command>;
    map: Stream<MapEventData>;
    building: Stream<BuildingEventData>;
    onHoverInteraction: Stream<BuildingEventData<QueryEntity[]>>;
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
    building?: Stream<BuildingEventData<QueryEntity[]>>;
    onHoverInteraction?: Stream<BuildingEventData<QueryEntity[]>>;
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
    shouldShowField: (field: string) => boolean;
    formatLabel: (field: string) => string;
    formatValue: (field: string, value: any) => string;
}

export interface PartialAttributesLayout {
    attributeTagFn?: (field: string) => string;
    shouldShowField?: (field: string) => boolean;
    formatLabel?: (field: string) => string;
    formatValue?: (field: string, value: any) => string;
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
