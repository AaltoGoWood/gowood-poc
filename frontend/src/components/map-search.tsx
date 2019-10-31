import xs, { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';

import { Sources, Sinks, Reducer } from '../interfaces';

export interface State {}
export const defaultState: State = {};

interface DOMIntent {
    link$: Stream<null>;
}

export function MapSearch({ DOM, state }: Sources<State>): Sinks<State> {
    const { link$ }: DOMIntent = intent(DOM);

    return {
        DOM: view(state.stream),
        state: model(),
        router: redirect(link$)
    };
}

function model(): Stream<Reducer<State>> {
    const init$ = xs.of<Reducer<State>>(prevState =>
        prevState === undefined ? defaultState : prevState
    );

    return init$;
}

function view(state$: Stream<State>): Stream<VNode> {
    return state$.map(_ => (
        <div data-action="navigate">
            <h2>Building map</h2>
        </div>
    ));
}

function intent(DOM: DOMSource): DOMIntent {
    const link$ = DOM.select('[data-action="navigate"]')
        .events('click')
        .mapTo(null);

    return { link$ };
}

function redirect(link$: Stream<any>): Stream<string> {
    return link$.mapTo('/building');
}
