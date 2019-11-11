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
    buildings: {
        [id: string]: any;
    };
    [id: string]: any;
}
const data: Data = {
    buildings: {
        '746103': [
            { type: 'plywood', id: 'p123', producer: 'UPM Plywood' },
            { type: 'plywood', id: 'p124', producer: 'UPM Plywood' },
            { type: 'plywood', id: 'p125', producer: 'UPM Plywood' }
        ]
    },
    plywood: {
        p123: [
            { type: 'tree-trunk', id: 'p123-1', coords: [123.11, 1234.11] },
            { type: 'tree-trunk', id: 'p123-2', coords: [123.22, 1234.22] }
        ],
        p124: [{ type: 'tree-trunk', id: 'p124-1', coords: [234.11, 234.11] }],
        p125: [{ type: 'tree-trunk', id: 'p125-1', coords: [32.11, 3423.22] }]
    }
};

export function dataQueryDriver(
    dataRequest$: Stream<Request>
): Stream<Response> {
    return dataRequest$.map((req: Request) => {
        const { type, id } = req;
        const responseData: any = (data[type] && data[type][id]) as any;
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
