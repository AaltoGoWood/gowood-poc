import { DataResponse } from './dataQueryDriver';
import { Command } from './../interfaces';
import { Stream } from 'xstream';
import {
    VisualizationViewType,
    PartialAttributesLayout,
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

const labelTranslate: { [k: string]: string } = {
    producer: 'Producer',
    length: 'Length',
    trunkWidth: 'Trunk width',
    coords: 'Coordinates',
    speciesOfTree: 'Species of tree',
    timestamp: 'Timestamp'
};

const valueFormat: {
    __identity__: (v: any) => string;
    [k: string]: (v: any) => string;
} = {
    __identity__: v => v as string,
    coords: value => `${value['lng']}; ${value['lat']}`
};

const DefaultAttributesLayout = {
    attributeTagFn: (field: string) => '',
    shouldShowField: (field: string) => !['id', 'type'].some(f => field === f),
    formatLabel: (field: string) => labelTranslate[field] || field,
    formatValue: (field: string, value: any) =>
        (valueFormat[field] || valueFormat.__identity__)(value)
};

function ToEntityLayout(
    defaultView: VisualizationViewType,
    attributes?: PartialAttributesLayout,
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
                case 'timestamp':
                    return 'fake-data';
                default:
                    return '';
            }
        }
    })
};

async function handleRequest(req: DataRequest): Promise<DataResponse> {
    type MaybeResults = [boolean, any];
    const [ok, res]: MaybeResults = await fetch(
        'http://localhost:8080/api/query/info-with-first-level-components',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ from: req })
        }
    )
        .then(response => response.json())
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
