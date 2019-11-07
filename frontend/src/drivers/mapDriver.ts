import { Command, MapEventData } from './../interfaces';
import { Stream } from 'xstream';

const eventRoot = document.body;

eventRoot.addEventListener('map-event', e =>
    console.log('CUSTOM EVENTS: map-event', e)
);

export function mapDriver(map$: Stream<Command<MapEventData[]>>): void {
    map$.addListener({
        next: (mapCommand: Command<MapEventData[]>) => {
            console.log('jee jee');
            const e = new CustomEvent<MapEventData[]>('map-event', {
                detail: mapCommand.data
            });
            eventRoot.dispatchEvent(e);
        }
    });
}
