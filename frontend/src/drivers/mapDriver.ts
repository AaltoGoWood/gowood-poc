import { Command, MutateMapEventData, MapEventData } from './../interfaces';
import { Stream } from 'xstream';

const eventRoot = document.body;

const outStream = Stream.never();

eventRoot.addEventListener('map-event', (e: CustomEvent<MapEventData>) => {
    outStream.shamefullySendNext(e.detail);
    // console.info('CUSTOM EVENTS: map-event', e);
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
