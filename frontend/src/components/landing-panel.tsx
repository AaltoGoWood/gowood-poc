import xs, { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';

import { Sources, Sinks, Reducer } from '../interfaces';

export interface State {}
export const defaultState: State = {};

interface DOMIntent {}

export function LandingPanel({ DOM, state }: Sources<State>): Sinks<State> {
    const {  }: DOMIntent = intent();

    return {
        DOM: view(state.stream),
        state: model()
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
        <div id="landing-panel">
            <h1>GoWood</h1>
            <h2>Proof of Concept</h2>
        </div>
    ));
}

function intent(): DOMIntent {
    return {};
}
