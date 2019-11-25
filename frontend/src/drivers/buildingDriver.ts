import { Command, BuildingEventData } from './../interfaces';
import { Stream } from 'xstream';

const outStream: Stream<BuildingEventData> = Stream.never();

document.body.addEventListener(
    'building-event',
    (e: CustomEvent<BuildingEventData>) => {
        outStream.shamefullySendNext(e.detail);
    }
);

export function buildingDriver(): Stream<BuildingEventData> {
    return outStream;
}
