import xs, { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';
import * as R from 'ramda';

import {
    Sources,
    Sinks,
    Reducer,
    Command,
    RouteProps,
    MutateMapEventData,
    QueryEntity,
    EntityLayout,
    BuildingEventData
} from '../interfaces';

import { Breadcrumb } from './viewFragments/breadcrumb';
import { AttributeTable } from './viewFragments/attribute-table';

export interface State {
    rootId?: string;
    rootDetails?: any;
    leafId?: string;
    leafDetails?: any;
    selectingEntity: QueryEntity[];
}
export const defaultState: State = {
    rootId: undefined,
    rootDetails: undefined,
    leafId: undefined,
    leafDetails: undefined,
    selectingEntity: []
};

interface DOMIntent {
    rootDataQuery$: Stream<QueryEntity>;
    commandGateway$: Stream<Command>;
}

export function Building(
    props: RouteProps,
    sources: Sources<State>
): Sinks<State> {
    const { DOM, state, dataQuery, commandGateway }: Sources<State> = sources;
    const props$ = xs.of(props);
    const { rootDataQuery$, commandGateway$ }: DOMIntent = intent(
        DOM,
        props$,
        commandGateway
    );

    return {
        DOM: view(state.stream, commandGateway$),
        state: model(
            rootDataQuery$,
            dataQuery,
            commandGateway$,
            sources.onHoverInteraction
        ),
        dataQuery: query(rootDataQuery$, commandGateway$),
        commandGateway: commandGateway$
    };
}

function query(
    rootDataQuery$: Stream<{ id: string; type: string }>,
    commandGateway$: Stream<Command>
): Stream<any> {
    const dataQueryCommands$ = commandGateway$
        .filter(({ type }) => type === 'show-building-assets')
        .map(command => ({
            type: command.data.type,
            id: command.data.id,
            queryDepth: 1,
            traversePath: command.data.traversePath
        }));
    return xs.merge(rootDataQuery$, dataQueryCommands$);
}

function model(
    rootDataQuery$: Stream<QueryEntity>,
    dataQuery: Stream<any>,
    commandGateway$: Stream<Command>,
    buildingInteraction$: Stream<BuildingEventData<QueryEntity[]>>
): Stream<Reducer<State>> {
    const init$ = xs.of<Reducer<State>>(prevState =>
        prevState === undefined ? defaultState : prevState
    );

    const addToState: (data: any) => Reducer<State> = data => state => {
        return R.merge(state || {}, data);
    };

    const rootId$ = rootDataQuery$
        .map(({ id }) => ({ rootId: id }))
        .map(addToState);

    const rootDetails$ = dataQuery
        .filter(res => res.req.traversePath.length === 0)
        .map(data => addToState({ rootDetails: data }));

    const leafDetails$ = dataQuery
        .filter(res => res.req.traversePath.length > 0)
        .map(data => addToState({ leafDetails: data }));

    const resetBuildingAssets$ = commandGateway$
        .filter(cmd => cmd.type === 'reset-building-assets')
        .map(state =>
            addToState({ leafId: undefined, leafDetails: undefined })
        );

    const selectingObjectStream$ = buildingInteraction$
        .filter(cmd => cmd.type === 'selected-entities')
        .map(cmd => addToState({ selectingEntity: cmd.data || [] }));

    return xs.merge(
        init$,
        rootId$,
        rootDetails$,
        leafDetails$,
        resetBuildingAssets$,
        selectingObjectStream$
    );
}

interface RenderBuildingDetailsProps {
    id: string;
    type: string;
    rows: any[];
    selectingEntity: QueryEntity[];
    dispatchFn: (e: Command) => void;
}

const renderBuildingDetails = (props: RenderBuildingDetailsProps) => {
    return (
        <div id="root-details" className="detail-table-borders">
            <div className="header">
                {Breadcrumb({
                    traversePath: [],
                    dispatchFn: props.dispatchFn
                })}
                <h3 id="data-focus-title">Building (id: {props.id})</h3>
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
                        const rowClass = props.selectingEntity.some(
                            e => e.id === row.id && e.type === row.type
                        )
                            ? 'focus'
                            : 'no-focus';
                        return (
                            <tr
                                className={rowClass}
                                id={`asset-${row.type}-id-${row.id}`}
                                onmouseenter={(e: any) =>
                                    props.dispatchFn({
                                        type: 'mouse-enter-entity',
                                        data: {
                                            type: row.type,
                                            id: row.id
                                        }
                                    })
                                }
                                onmouseleave={(e: any) =>
                                    props.dispatchFn({
                                        type: 'mouse-leave-entity',
                                        data: {
                                            type: row.type,
                                            id: row.id
                                        }
                                    })
                                }
                                onclick={(e: any) => {
                                    e.preventDefault();
                                    props.dispatchFn({
                                        type: 'show-building-assets',
                                        data: {
                                            id: row.id,
                                            type: row.type,
                                            traversePath: [
                                                {
                                                    id: props.id,
                                                    type: props.type,
                                                    traversePath: []
                                                }
                                            ]
                                        }
                                    });
                                }}
                            >
                                <td>{row.original_type}</td>
                                <td>{row.original_id}</td>
                                <td>{row.producer}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

interface RenderAssetDetailsProps {
    id: string;
    type: string;
    parentTraversePath: QueryEntity[];
    attributes: any;
    rows: any[];
    selectingEntity: QueryEntity[];
    layout: EntityLayout;
    dispatchFn: (e: Command) => void;
}
const renderAssetDetails = (props: RenderAssetDetailsProps) => {
    return (
        <div id="leaf-details" className="detail-table-borders">
            <div className="header">
                {Breadcrumb({
                    traversePath: props.parentTraversePath,
                    dispatchFn: props.dispatchFn
                })}
                <h3 id="data-focus-title">
                    {props.type} (id: {props.id})
                </h3>
                <div id="detail-actions">
                    {[props.layout.commands.showOrigins]
                        .filter((data: boolean) => data)
                        .map(() => (
                            <button
                                className="gowood-button small"
                                onclick={(e: any) => {
                                    e.preventDefault();
                                    const cmd: Command<MutateMapEventData[]> = {
                                        type: 'show-asset-origin',
                                        data: props.rows.map(row => ({
                                            type: 'ensure-tree' as any,
                                            coords: row.coords,
                                            data: {
                                                id: row.id,
                                                type: row.type,
                                                traversePath: [
                                                    ...props.parentTraversePath,
                                                    {
                                                        id: props.id,
                                                        type: props.type,
                                                        traversePath:
                                                            props.parentTraversePath
                                                    }
                                                ]
                                            }
                                        })),
                                        id: props.id
                                    };
                                    if (cmd.data && cmd.data.length > 0) {
                                        props.dispatchFn(cmd);
                                    }
                                }}
                            >
                                Show origins in map
                            </button>
                        ))}
                </div>
            </div>
            {AttributeTable(props.attributes, props.layout.attributes)}
            <h3>Parts and components</h3>
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
                        const rowClass = props.selectingEntity.some(
                            e => e.id === row.id && e.type === row.type
                        )
                            ? 'focus'
                            : 'no-focus';
                        return (
                            <tr
                                className={rowClass}
                                onmouseenter={(e: any) =>
                                    props.dispatchFn({
                                        type: 'mouse-enter-entity',
                                        data: {
                                            type: row.type,
                                            id: row.id
                                        }
                                    })
                                }
                                onmouseleave={(e: any) =>
                                    props.dispatchFn({
                                        type: 'mouse-leave-entity',
                                        data: {
                                            type: row.type,
                                            id: row.id
                                        }
                                    })
                                }
                                onclick={(e: any) => {
                                    e.preventDefault();
                                    const showOriginCmd: Command<
                                        MutateMapEventData[]
                                    > = {
                                        type: 'show-asset-origin',
                                        data: [
                                            {
                                                type: 'ensure-tree',
                                                coords: row.coords,
                                                data: {
                                                    id: row.id,
                                                    type: row.type,
                                                    traversePath: [
                                                        ...props.parentTraversePath,
                                                        {
                                                            id: props.id,
                                                            type: props.type,
                                                            traversePath:
                                                                props.parentTraversePath
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    };
                                    const traverseCmd: Command = {
                                        type: 'show-building-assets',
                                        data: {
                                            id: row.id,
                                            type: row.type,
                                            traversePath: [
                                                ...props.parentTraversePath,
                                                {
                                                    id: props.id,
                                                    type: props.type,
                                                    traversePath:
                                                        props.parentTraversePath
                                                }
                                            ]
                                        }
                                    };
                                    if (row.coords) {
                                        props.dispatchFn(showOriginCmd);
                                    }
                                    props.dispatchFn(traverseCmd);
                                }}
                            >
                                <td>{row.original_type}</td>
                                <td>{row.original_id}</td>
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
    rootDetailsFound: boolean;
    leafDetailsFound: boolean;
    rootDetails: any;
    leafDetails: any;
    selectingEntity: QueryEntity[];
    dispatchFn: (e: any) => void;
}
function renderDetailsPanels(props: RenderDetailsPanelsProps): any {
    const viewType: string =
        props.rootDetailsFound === undefined
            ? 'loading'
            : props.rootDetailsFound === false
            ? 'building-not-found'
            : props.rootDetailsFound && !props.leafDetailsFound
            ? 'building-details'
            : props.rootDetailsFound && props.leafDetailsFound
            ? 'asset-details'
            : 'error';

    switch (viewType) {
        case 'building-not-found':
            return <p>Building not found</p>;
        case 'building-details':
            return renderBuildingDetails({
                id: props.rootDetails.req.id,
                type: props.rootDetails.req.type,
                rows: props.rootDetails.data.rows,
                selectingEntity: props.selectingEntity,
                dispatchFn: props.dispatchFn
            });
        case 'asset-details':
            return renderAssetDetails({
                id: props.leafDetails.data.attributes.original_id,
                type: props.leafDetails.data.attributes.original_type,
                parentTraversePath: props.leafDetails.req.traversePath,
                rows: props.leafDetails.data.rows,
                attributes: props.leafDetails.data.attributes,
                layout: props.leafDetails.layout as EntityLayout,
                selectingEntity: props.selectingEntity,
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
            <div id="details-panel">
                {renderDetailsPanels({
                    rootDetailsFound:
                        state.rootDetails && state.rootDetails.found,
                    leafDetailsFound:
                        state.leafDetails && state.leafDetails.found,
                    rootDetails: state.rootDetails,
                    leafDetails: state.leafDetails,
                    selectingEntity: state.selectingEntity,
                    dispatchFn: dispatchFn
                })}
            </div>
        );
    });
}

function intent(
    DOM: DOMSource,
    props: Stream<RouteProps>,
    commandGateway: Stream<Command>
): DOMIntent {
    const rootDataQuery$ = props.map((data: RouteProps) => {
        return {
            id: data.id,
            type: data.type,
            queryDepth: 0,
            traversePath: []
        } as QueryEntity;
    });

    return { rootDataQuery$, commandGateway$: commandGateway };
}
