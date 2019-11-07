import xs, { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';
import { RouterSource } from 'cyclic-router';
import * as r from 'ramda';
// import { RouterSource } from '@'

import { Sources, Sinks, Reducer } from '../interfaces';

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
    dispatch$: Stream<any>;
}

export function Building(props: any, sources: Sources<State>): Sinks<State> {
    console.log('Building', sources);
    const { DOM, state, router, dataQuery }: Sources<State> = sources;
    const props$ = xs.of(props);
    const { link$, building$, dispatch$ }: DOMIntent = intent(DOM, props$);

    return {
        DOM: view(state.stream, dispatch$),
        state: model(building$, dataQuery),
        router: redirect(link$),
        dataQuery: query(building$, dispatch$)
    };
}

function query(building$: Stream<string>, dispatch$: Stream<any>): Stream<any> {
    const buildingQuery$ = building$.map(id => ({ type: 'buildings', id }));
    return xs.merge(buildingQuery$, dispatch$);
}

function model(
    building$: Stream<any>,
    dataQuery: Stream<any>
): Stream<Reducer<State>> {
    const init$ = xs.of<Reducer<State>>(prevState =>
        prevState === undefined ? defaultState : prevState
    );

    const addToState: (data: any) => Reducer<State> = data => state =>
        r.merge(state || {}, data);
    const buildingId$ = building$
        .map(buildingId => ({ buildingId }))
        .map(addToState);

    const buildingDetails$ = dataQuery
        .filter(res => res.req.type === 'buildings')
        .map(data => addToState({ buildingDetails: data }));

    const assetDetails$ = dataQuery
        .filter(res => res.req.type === 'plywood')
        .map(data => addToState({ assetDetails: data }));

    return xs.merge(init$, buildingId$, buildingDetails$, assetDetails$);
}

interface RenderBuildingDetailsProps {
    id: string;
    rows: any[];
    dispatchFn: (e: any) => void;
}
const renderBuildingDetails = (props: RenderBuildingDetailsProps) => {
    return (
        <div className="asset-table">
            <div className="header">Building (id: {props.id})</div>
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
                                onclick={() =>
                                    props.dispatchFn({
                                        type: row.type,
                                        id: row.id
                                    })
                                }
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
    );
};

interface RenderAssetDetailsProps {
    id: string;
    type: string;
    rows: any[];
    dispatchFn: (e: any) => void;
}
const renderAssetDetails = (props: RenderAssetDetailsProps) => {
    return (
        <div className="asset-table">
            <div className="header">
                {props.type} (id: {props.id})
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
                            <tr>
                                <td>{row.type}</td>
                                <td>{row.id}</td>
                                <td>{row.coords}</td>
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
    console.log('renderDetailsPanels.props', props);
    console.log('renderDetailsPanels', [
        props.buildingDetailsFound,
        props.assetDetailsFound
    ]);

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

function view(state$: Stream<State>, dispatch$: Stream<any>): Stream<VNode> {
    const dispatchFn = (events: any) => dispatch$.shamefullySendNext(events);
    return state$.map((state: State) => {
        return (
            <div className="building-details">
                <h2>Building details</h2>
                <p>State: {JSON.stringify(state)}</p>
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

function intent(DOM: DOMSource, props: Stream<any>): DOMIntent {
    const dispatch$ = xs.never();

    const link$ = DOM.select('[data-action="navigate"]')
        .events('click')
        .mapTo(null);

    // TODO: clean up later.
    const building$ = props.map((data: any) => {
        return data;
    });
    return { link$, building$, dispatch$ };
}

function redirect(link$: Stream<any>): Stream<string> {
    return link$.mapTo('/raw-material-map');
}
