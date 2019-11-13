import xs, { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';
import { extractSinks } from 'cyclejs-utils';
import isolate from '@cycle/isolate';
import * as qs from 'query-string';

import { driverNames } from '../drivers';
import {
    Sources,
    Sinks,
    Reducer,
    Component,
    Command,
    MutateMapEventData,
    RoutedComponentAcc,
    RouteProps
} from '../interfaces';

import { LandingPanel, State as LandingPageState } from './landing-panel';
import {
    Building as DetailPanel,
    State as DetailPanelState
} from './detail-panel';
import { Dictionary } from 'ramda';
import view from 'ramda/es/view';

export interface State {
    mapSearch?: LandingPageState;
    building?: DetailPanelState;
}

export function App(sources: Sources<State>): Sinks<State> {
    const commandGateway$: Stream<Command> =
        sources.commandGateway || xs.never();
    sources.commandGateway = commandGateway$;

    const map$ = sources.map;
    const mapDataQuery$ = map$
        .filter(e => e.type === 'map-object-clicked')
        .map(e => {
            return {
                id: e.data.id,
                type: e.data.type,
                traversePath: e.data.traversePath
            };
        });

    const match$ = sources.router.define({
        '/browse-building': isolate(LandingPanel, 'map-search'),
        '/traverse/:type/:id': (type: string, id: string) => {
            return {
                renderFn: (props: RouteProps) =>
                    DetailPanel.bind(undefined, props),
                // cyclic router have bug and it does not parse correctly id when it comes from historyApi
                routeProps: { type, id: id && id.split('?')[0] }
            };
        }
    });

    const layout$ = sources.router
        .define({
            '/browse-building': { map: true, building: false },
            '/traverse/:type/:id/': { map: true, building: false },
            '/traverse-3d/:id': { map: false, building: true }
        })
        .map((route: any) => route.value);

    const componentSinks$: Stream<Sinks<State>> = match$
        .filter(({ path }: any) => path)
        .map((current: any) => {
            const {
                path,
                value,
                location
            }: {
                path: string;
                location: Location;
                value: Component<any> | RoutedComponentAcc;
            } = current;

            if (typeof value === 'function') {
                return value({
                    ...sources,
                    router: sources.router.path(path)
                });
            } else {
                const search =
                    location.search.substr(1) ||
                    location.pathname.split('?')[1] ||
                    '';
                const acc: RoutedComponentAcc = value;
                acc.routeProps.qs = qs.parse(search);
                return acc.renderFn(acc.routeProps)({
                    ...sources,
                    router: sources.router.path(path)
                });
            }
        });

    const redirect$: Stream<string> = sources.router.history$
        .filter((l: Location) => l.pathname === '/')
        .mapTo('/browse-building');

    // Ensure that first page loads are routed and rendered correctly
    const firstTimePageLoad$: Stream<string> = sources.router.history$
        .filter((l: any) => l.pathname !== '/' && l.type === undefined)
        .map((l: Location) => l.pathname + l.search + l.hash);

    const navigateTo: Dictionary<string> = {
        'navigate-to-building-browser': '/browse-building'
    };
    const handledNavigateEvents$ = commandGateway$
        .map((cmd: Command) => navigateTo[cmd.type])
        .filter(path => path !== undefined);

    const sinks = extractSinks(componentSinks$, driverNames);
    const { dataQuery } = sinks;
    const $showAssetOrigin = mapCommandsToMapEvents(commandGateway$);

    return {
        ...sinks,
        dataQuery: xs.merge(dataQuery, mapDataQuery$),
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
): Stream<Command<MutateMapEventData[]>> {
    return xs.merge(
        commandGateway$
            .filter(cmd => cmd.type === 'show-asset-origin')
            .map((cmd: Command) => {
                return {
                    type: cmd.type,
                    data: [
                        { type: 'reset-markers' },
                        ...cmd.data.map((asset: MutateMapEventData) => ({
                            type: 'ensure-tree',
                            coords: asset.coords,
                            data: asset.data
                        })),
                        {
                            type: 'move-to',
                            coords: cmd.data[0] && cmd.data[0].coords
                        }
                    ]
                } as Command<MutateMapEventData[]>;
            }),
        commandGateway$
            .filter(cmd => cmd.type === 'reset-building-assets')
            .map((cmd: Command) => {
                return {
                    type: cmd.type,
                    data: [
                        {
                            type: 'move-to',
                            coords: cmd.data.coords
                        }
                    ]
                } as Command<MutateMapEventData[]>;
            })
    );
}
