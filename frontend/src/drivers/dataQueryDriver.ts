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
