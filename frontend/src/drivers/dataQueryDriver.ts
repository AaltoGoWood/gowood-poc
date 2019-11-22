import { DataResponse } from './dataQueryDriver';
import { Command } from './../interfaces';
import { Stream } from 'xstream';
import * as rp from 'request-promise';
import {
    VisualizationViewType,
    AttributesLayout,
    RowsLayout,
    CommandsLayout,
    EntityLayout,
    LayoutDirectiveCollection
} from '../interfaces';
import { ifError } from 'assert';
import reduceWhile from 'ramda/es/reduceWhile';

export type DataRequest = {
    type: string;
    id: string;
    traversePath: DataRequest[];
};

export type DataResponse = {
    req: DataRequest;
    found: boolean;
    layout: EntityLayout;
    data: any | undefined;
};

const DefaultAttributesLayout = {
    attributeTagFn: (field: string) => ''
};

function ToEntityLayout(
    defaultView: VisualizationViewType,
    attributes?: AttributesLayout,
    rows?: RowsLayout,
    commands?: CommandsLayout
): EntityLayout {
    return {
        attributes: { ...DefaultAttributesLayout, ...attributes },
        rows: rows || {},
        defaultView: defaultView || 'map',
        commands: commands || {}
    };
}

const layoutDirectives: LayoutDirectiveCollection = {
    building: ToEntityLayout('building'),
    plywood: ToEntityLayout('building', undefined, undefined, {
        showOrigins: true
    }),
    'tree-trunk': ToEntityLayout('map', {
        attributeTagFn: (field: string) => {
            switch (field) {
                case 'Timestamp':
                    return 'fake-data';
                default:
                    return '';
            }
        }
    })
};

async function handleRequest(req: DataRequest): Promise<DataResponse> {
    type MaybeResults = [boolean, any];
    const [ok, res]: MaybeResults = await rp({
        method: 'POST',
        uri: 'http://localhost:8080/api/query/info-with-first-level-components',
        json: { from: req }
    })
        .then((response: any) => [true, response] as MaybeResults)
        .catch((err: any) => [false, err] as MaybeResults);
    console.log('res', res);
    if (ok) {
        return {
            req,
            found: res.result.found,
            data: res.result.data
        } as DataResponse;
    } else {
        console.error(res);
        return {
            req,
            found: false,
            data: null
        } as DataResponse;
    }
}

export function dataQueryDriver(
    dataRequest$: Stream<DataRequest>
): Stream<DataResponse> {
    return dataRequest$
        .map((req: DataRequest) => Stream.fromPromise(handleRequest(req)))
        .flatten()
        .map((res: DataResponse) => ({
            ...res,
            layout: layoutDirectives[res.req.type]
        }));
}
