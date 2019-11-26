import { Stream } from 'xstream';
import { init3d } from '../components/3d';

export type State = {
    [t: string]: boolean;
};

let buildingRendered = false;
export function layoutDriver(route$: Stream<State>): void {
    route$.addListener({
        next: classes => {
            Object.keys(classes).forEach(k => {
                if (classes[k]) {
                    document.body.classList.add(k);
                    if (k === 'building' && !buildingRendered) {
                        init3d();
                        buildingRendered = true;
                    }
                } else {
                    document.body.classList.remove(k);
                }
            });
        }
    });
}
