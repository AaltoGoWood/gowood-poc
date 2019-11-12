import { Command, MutateMapEventData, MapEventData } from './../interfaces';
import { Stream } from 'xstream';

const eventRoot = document.body;

eventRoot.addEventListener('mutate-map-event', e =>
    console.log('CUSTOM EVENTS: mutate-map-event', e)
);

const outStream = Stream.never();

eventRoot.addEventListener('map-event', (e: CustomEvent<MapEventData>) => {
    outStream.shamefullySendNext(e.detail);
    console.log('CUSTOM EVENTS: map-event', e);
});

export function mapDriver(
    map$: Stream<Command<MutateMapEventData[]>>
): Stream<MapEventData> {
    map$.addListener({
        next: (mapCommand: Command<MutateMapEventData[]>) => {
            const e = new CustomEvent<MutateMapEventData[]>(
                'mutate-map-event',
                {
                    detail: mapCommand.data
                }
            );
            eventRoot.dispatchEvent(e);
        }
    });

    return outStream;
}
