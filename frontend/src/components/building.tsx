import xs, { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';
import { RouterSource } from 'cyclic-router';
import * as R from 'ramda';

import { Sources, Sinks, Reducer, Command } from '../interfaces';

export interface State {
    buildingId?: any | undefined;
    buildingDetails?: any | undefined;
    assetDetails?: any | undefined;
}
export const defaultState: State = {
    buildingId: undefined,
    buildingDetails: undefined,
    assetDetails: undefined
};

interface DOMIntent {
    link$: Stream<null>;
    building$: Stream<any>;
    commandGateway$: Stream<Command>;
}

export function Building(props: any, sources: Sources<State>): Sinks<State> {
    const { DOM, state, dataQuery, commandGateway }: Sources<State> = sources;
    const props$ = xs.of(props);
    const { link$, building$, commandGateway$ }: DOMIntent = intent(
        DOM,
        props$,
        commandGateway
    );

    return {
        DOM: view(state.stream, commandGateway$),
        state: model(building$, dataQuery, commandGateway$),
        router: redirect(link$),
        dataQuery: query(building$, commandGateway$),
        commandGateway: commandGateway$
    };
}

function query(
    building$: Stream<string>,
    commandGateway$: Stream<Command>
): Stream<any> {
    const buildingQuery$ = building$.map(id => ({ type: 'buildings', id }));
    const dataQueryCommands$ = commandGateway$
        .filter(({ type }) => type === 'show-building-assets')
        .map(command => ({ type: command.data.dataType, id: command.id }));
    return xs.merge(buildingQuery$, dataQueryCommands$);
}

function model(
    building$: Stream<any>,
    dataQuery: Stream<any>,
    commandGateway$: Stream<Command>
): Stream<Reducer<State>> {
    const init$ = xs.of<Reducer<State>>(prevState =>
        prevState === undefined ? defaultState : prevState
    );

    const addToState: (data: any) => Reducer<State> = data => state =>
        R.merge(state || {}, data);
    const buildingId$ = building$
        .map(buildingId => ({ buildingId }))
        .map(addToState);

    const buildingDetails$ = dataQuery
        .filter(res => res.req.type === 'buildings')
        .map(data => addToState({ buildingDetails: data }));

    const assetDetails$ = dataQuery
        .filter(res => res.req.type === 'plywood')
        .map(data => addToState({ assetDetails: data }));

    const resetBuildingAssets$ = commandGateway$
        .filter(cmd => cmd.type === 'reset-building-assets')
        .map(state => addToState({ assetDetails: undefined }));

    return xs.merge(
        init$,
        buildingId$,
        buildingDetails$,
        assetDetails$,
        resetBuildingAssets$
    );
}

interface RenderBuildingDetailsProps {
    id: string;
    rows: any[];
    dispatchFn: (e: Command) => void;
}
const renderBuildingDetails = (props: RenderBuildingDetailsProps) => {
    return (
        <div>
            <div id="building-details" className="asset-table">
                <div className="header">
                    <button
                        className="gowood-button"
                        onclick={(e: any) => {
                            e.preventDefault();
                            props.dispatchFn({
                                type: 'navigate-to-building-browser'
                            });
                        }}
                    >
                        Back to map
                    </button>
                    Building (id: {props.id})
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Id</th>
                            <th>Producer</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.rows.map((row: any) => {
                            return (
                                <tr
                                    id={`asset-${row.type}-id-${row.id}`}
                                    onclick={(e: any) => {
                                        e.preventDefault();
                                        props.dispatchFn({
                                            type: 'show-building-assets',
                                            data: { dataType: row.type },
                                            id: row.id
                                        });
                                    }}
                                >
                                    <td>{row.type}</td>
                                    <td>{row.id}</td>
                                    <td>{row.producer}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div id="asset-details" className="asset-detail"></div>
        </div>
    );
};

interface RenderAssetDetailsProps {
    id: string;
    type: string;
    rows: any[];
    dispatchFn: (e: Command) => void;
}
const renderAssetDetails = (props: RenderAssetDetailsProps) => {
    return (
        <div id="asset-details" className="asset-table">
            <div className="header">
                <button
                    className="gowood-button"
                    onclick={(e: any) => {
                        e.preventDefault();
                        props.dispatchFn({
                            type: 'reset-building-assets',
                            data: {
                                coords: {
                                    lng: 24.93,
                                    lat: 60.18
                                }
                            }
                        });
                    }}
                >
                    Back to building
                </button>
                {props.type} (id: {props.id})
                <button
                    className="gowood-button"
                    onclick={(e: any) => {
                        const cmd: Command = {
                            type: 'show-asset-origin',
                            data: props.rows.map(row => ({
                                dataType: row.type,
                                coords: row.coords
                            })),
                            id: props.id
                        };
                        e.preventDefault();
                        props.dispatchFn(cmd);
                    }}
                >
                    Show origins in map
                </button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Id</th>
                        <th>Coordinates</th>
                    </tr>
                </thead>
                <tbody>
                    {props.rows.map((row: any) => {
                        return (
                            <tr
                                onclick={(e: any) => {
                                    const cmd: Command = {
                                        type: 'show-asset-origin',
                                        data: [
                                            {
                                                dataType: row.type,
                                                coords: row.coords
                                            }
                                        ],
                                        id: row.id
                                    };
                                    e.preventDefault();
                                    props.dispatchFn(cmd);
                                }}
                            >
                                <td>{row.type}</td>
                                <td>{row.id}</td>
                                <td>{JSON.stringify(row.coords)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

interface RenderDetailsPanelsProps {
    buildingDetailsFound: boolean;
    assetDetailsFound: boolean;
    buildingDetails: any;
    assetDetails: any;
    dispatchFn: (e: any) => void;
}
function renderDetailsPanels(props: RenderDetailsPanelsProps): any {
    const viewType: string =
        props.buildingDetailsFound === undefined
            ? 'loading'
            : props.buildingDetailsFound === false
            ? 'building-not-found'
            : props.buildingDetailsFound && !props.assetDetailsFound
            ? 'building-details'
            : props.buildingDetailsFound && props.assetDetailsFound
            ? 'asset-details'
            : 'error';

    switch (viewType) {
        case 'building-not-found':
            return <p>Building not found</p>;
        case 'building-details':
            return renderBuildingDetails({
                id: props.buildingDetails.req.id,
                rows: props.buildingDetails.data,
                dispatchFn: props.dispatchFn
            });
        case 'asset-details':
            return renderAssetDetails({
                id: props.assetDetails.req.id,
                type: props.assetDetails.req.type,
                rows: props.assetDetails.data,
                dispatchFn: props.dispatchFn
            });
        case 'loading':
            return <p>Loading...</p>;
        default:
            return <p>Error.</p>;
    }
}

function view(
    state$: Stream<State>,
    commandGateway$: Stream<any>
): Stream<VNode> {
    const dispatchFn = (events: any) =>
        commandGateway$.shamefullySendNext(events);
    return state$.map((state: State) => {
        return (
            <div className="building-details">
                {renderDetailsPanels({
                    buildingDetailsFound:
                        state.buildingDetails && state.buildingDetails.found,
                    assetDetailsFound:
                        state.assetDetails && state.assetDetails.found,
                    buildingDetails: state.buildingDetails,
                    assetDetails: state.assetDetails,
                    dispatchFn: dispatchFn
                })}
            </div>
        );
    });
}

function intent(
    DOM: DOMSource,
    props: Stream<any>,
    commandGateway: Stream<Command>
): DOMIntent {
    const link$ = xs.never();
    // DOM.select('[data-action="navigate"]')
    //     .events('click')
    //     .mapTo(null);

    // TODO: clean up later.
    const building$ = props.map((data: any) => {
        return data;
    });
    return { link$, building$, commandGateway$: commandGateway };
}

function redirect(link$: Stream<any>): Stream<string> {
    return link$.mapTo('/raw-material-map');
}
