import { Stream } from 'xstream';
import any from 'ramda/es/any';

export type Request = {
    type: string;
    id: string;
};

export type Response = {
    req: Request;
    found: boolean;
    data: any | undefined;
};

interface Data {
    building: {
        [id: string]: any;
    };
    [id: string]: any;
}
const data: Data = {
    building: {
        '123': [
            { type: 'plywood', id: 'p123', producer: 'UPM Plywood' },
            { type: 'plywood', id: 'p124', producer: 'UPM Plywood' },
            { type: 'plywood', id: 'p125', producer: 'UPM Plywood' }
        ]
    },
    plywood: {
        p123: [
            {
                type: 'tree-trunk',
                id: 'p123-1',
                coords: { lng: 25.474273614, lat: 65.0563745 }
            },
            {
                type: 'tree-trunk',
                id: 'p123-2',
                coords: { lng: 25.474293614, lat: 65.0543745 }
            }
        ],
        p124: [
            {
                type: 'tree-trunk',
                id: 'p124-1',
                coords: { lng: 25.474243614, lat: 65.0503745 }
            }
        ],
        p125: [
            {
                type: 'tree-trunk',
                id: 'p125-1',
                coords: { lng: 25.474203614, lat: 65.0560745 }
            }
        ]
    }
};

export function dataQueryDriver(
    dataRequest$: Stream<Request>
): Stream<Response> {
    return dataRequest$.map((req: Request) => {
        const { type, id } = req;
        const responseData: any = (data[type] && data[type][id]) as any;
        console.log('data-req', req, responseData);
        if (responseData) {
            return {
                req,
                found: true,
                data: responseData
            };
        } else {
            return {
                req,
                found: false,
                data: undefined
            };
        }
    });
}
