import { Command, BuildingEventData, QueryEntity } from './../interfaces';
import { Stream } from 'xstream';

const outStream: Stream<BuildingEventData> = Stream.never();

document.body.addEventListener(
    'building-event',
    (e: CustomEvent<BuildingEventData>) => {
        outStream.shamefullySendNext(e.detail);
    }
);

function dispatchBuildingEvent(eventData?: BuildingEventData): void {
    const event = new CustomEvent<BuildingEventData>('building-event', {
        detail: eventData
    });
    document.body.dispatchEvent(event);
}

export function buildingDriver(
    inStream$: Stream<BuildingEventData<QueryEntity[]>>
): Stream<BuildingEventData> {
    inStream$.addListener({
        next: (cmd: BuildingEventData<QueryEntity[]>) => {
            dispatchBuildingEvent({
                type: 'selected-entities',
                data: cmd.data
            });
        }
    });
    return outStream;
}
