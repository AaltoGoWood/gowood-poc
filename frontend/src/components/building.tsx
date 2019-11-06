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
}

export function Building(props: any, sources: Sources<State>): Sinks<State> {
    console.log('Building', sources);
    const { DOM, state, router, dataQuery }: Sources<State> = sources;
    const props$ = xs.of(props);
    const { link$, building$ }: DOMIntent = intent(DOM, props$);
    return {
        DOM: view(state.stream),
        state: model(building$, dataQuery),
        router: redirect(link$),
        dataQuery: query(building$)
    };
}

function query(building$: Stream<string>): Stream<any> {
    return building$.map(id => ({ type: 'buildings', id }));
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

    const buildingDetails$ = dataQuery.map(data =>
        addToState({ buildingDetails: data })
    );

    return xs.merge(init$, buildingId$, buildingDetails$);
}

function view(state$: Stream<State>): Stream<VNode> {
    return state$.map((state: State) => {
        return (
            <div data-action="navigate">
                <h2>Building details</h2>
                <p>{state.buildingId}</p>
                <p>{JSON.stringify(state.buildingDetails)}</p>
            </div>
        );
    });
}

function intent(DOM: DOMSource, props: Stream<any>): DOMIntent {
    const link$ = DOM.select('[data-action="navigate"]')
        .events('click')
        .mapTo(null);

    // TODO: clean up later.
    const building$ = props.map((data: any) => {
        return data;
    });
    return { link$, building$ };
}

function redirect(link$: Stream<any>): Stream<string> {
    return link$.mapTo('/raw-material-map');
}
