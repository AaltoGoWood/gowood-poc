import { Stream } from 'xstream';

export type State = {
    [t: string]: boolean;
};

export function layoutDriver(route$: Stream<State>): void {
    route$.addListener({
        next: classes => {
            Object.keys(classes).forEach(k => {
                if (classes[k]) {
                    document.body.classList.add(k);
                } else {
                    document.body.classList.remove(k);
                }
            });
        }
    });
}
