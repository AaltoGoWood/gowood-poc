import xs, { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';
import { RouterSource } from 'cyclic-router';
import * as r from 'ramda';
// import { RouterSource } from '@'

import { Sources, Sinks, Reducer } from '../interfaces';

export interface State {
    buildingId?: any | undefined;
    buildingDetails?: any | undefined;
}
export const defaultState: State = {
    buildingId: undefined,
    buildingDetails: undefined
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

    const plywoodDetails$ = dataQuery
        .filter(res => res.req.type === 'plywood')
        .map(data => addToState({ plywoodDetails: data }));

    return xs.merge(init$, buildingId$, buildingDetails$, plywoodDetails$);
}

function view(state$: Stream<State>, dispatch$: Stream<any>): Stream<VNode> {
    const renderDetails = (rows: any[]) => {
        return (
            <div className="asset-table">
                <div className="header">Assets</div>
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Id</th>
                            <th>Producer</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row: any) => {
                            return (
                                <tr
                                    onclick={() =>
                                        dispatch$.shamefullySendNext({
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

    return state$.map((state: State) => {
        return (
            <div className="building-details">
                <h2>Building details</h2>
                <p>Building id: {state.buildingId}</p>
                <p>State: {JSON.stringify(state)}</p>
                {state.buildingDetails ? '' : <p>Loading...</p>}
                {state.buildingDetails && state.buildingDetails.found ? (
                    renderDetails(state.buildingDetails.data)
                ) : (
                    <p>Building not found</p>
                )}
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
