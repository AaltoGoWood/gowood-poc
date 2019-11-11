import xs, { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';
import { extractSinks } from 'cyclejs-utils';
import isolate from '@cycle/isolate';

import { driverNames } from '../drivers';
import {
    Sources,
    Sinks,
    Reducer,
    Component,
    Command,
    MapEventData
} from '../interfaces';

import { MapSearch, State as MapSearchState } from './map-search';
import { Building, State as BuildingState } from './building';
import {
    RawMaterialMap,
    State as RawMaterialMapState
} from './raw-material-map';
import { Dictionary } from 'ramda';
import { type } from 'os';
import { MapDataEvent } from 'mapbox-gl';

export interface State {
    mapSearch?: MapSearchState;
    building?: BuildingState;
    rawMaterialMap?: RawMaterialMapState;
}

export function App(sources: Sources<State>): Sinks<State> {
    const commandGateway$: Stream<Command> =
        sources.commandGateway || xs.never();
    sources.commandGateway = commandGateway$;

    const match$ = sources.router.define({
        '/browse-building': isolate(MapSearch, 'map-search'),
        '/building/:id': (props: any) =>
            isolate(Building.bind(undefined, props), 'building'),
        '/raw-material-map': isolate(RawMaterialMap, 'raw-material-map')
    });

    const layout$ = sources.router
        .define({
            '/browse-building': { map: true, building: false },
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
        .mapTo('/browse-building');

    // Ensure that first page loads are routed and rendered correctly
    const firstTimePageLoad$: Stream<string> = sources.router.history$
        .filter((l: any) => l.pathname !== '/' && l.type === undefined)
        .map((l: Location) => l.pathname);

    const navigateTo: Dictionary<string> = {
        'navigate-to-building-browser': '/browse-building',
        'show-asset-origin': '/raw-material-map'
    };
    const handledNavigateEvents$ = commandGateway$
        .map((cmd: Command) => navigateTo[cmd.type])
        .filter(path => path !== undefined);

    const sinks = extractSinks(componentSinks$, driverNames);

    const $showAssetOrigin = mapCommandsToMapEvents(commandGateway$);

    return {
        ...sinks,
        layout: layout$,
        commandGateway: commandGateway$,
        map: $showAssetOrigin,
        router: xs.merge(
            redirect$,
            firstTimePageLoad$,
            handledNavigateEvents$,
            sinks.router
        )
    };
}

function mapCommandsToMapEvents(
    commandGateway$: Stream<Command>
): Stream<Command<MapEventData[]>> {
    return commandGateway$
        .filter(cmd => cmd.type === 'show-asset-origin')
        .map((cmd: Command) => {
            return {
                type: cmd.type,
                data: [
                    ...cmd.data.map((asset: MapEventData) => ({
                        type: 'ensure-tree',
                        coords: asset.coords
                    })),
                    {
                        type: 'move-to',
                        coords: cmd.data[0] && cmd.data[0].coords
                    }
                ]
            } as Command<MapEventData[]>;
        });
}
