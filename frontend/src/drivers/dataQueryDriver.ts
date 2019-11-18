import { Stream } from 'xstream';
import any from 'ramda/es/any';
import { string } from 'jsverify';
import {
    VisualizationViewType,
    AttributesLayout,
    RowsLayout,
    CommandsLayout,
    EntityLayout,
    LayoutDirectiveCollection
} from '../interfaces';

export type DataRequest = {
    type: string;
    id: string;
};

export type DataResponse = {
    req: DataRequest;
    found: boolean;
    layout: EntityLayout;
    data: any | undefined;
};

interface FakeDatabase {
    building: {
        [id: string]: any;
    };
    [id: string]: any;
}

const ToEntity = (attributes: any, ...rows: any) => ({ attributes, rows });

const data: FakeDatabase = {
    building: {
        '746103': ToEntity(
            {},
            { type: 'plywood', id: 'p123', producer: 'UPM Plywood' },
            { type: 'plywood', id: 'p124', producer: 'UPM Plywood' },
            { type: 'plywood', id: 'p125', producer: 'UPM Plywood' }
        )
    },
    plywood: {
        p123: ToEntity(
            {},
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
        ),
        p124: ToEntity(
            {},
            {
                type: 'tree-trunk',
                id: 'p124-1',
                coords: { lng: 25.474243614, lat: 65.0503745 }
            }
        ),
        p125: ToEntity(
            {},
            {
                type: 'tree-trunk',
                id: 'p125-1',
                coords: { lng: 25.474203614, lat: 65.0560745 }
            }
        )
    },
    'tree-trunk': {
        'p123-1': ToEntity({
            'Species of Tree': 'Pine',
            'Trunk width': 60,
            Timestamp: '2019-10-14T09:12:13.012Z',
            Length: 12,
            Coordinates: '25.474293614, 65.0543745'
        }),
        'p123-2': ToEntity({
            'Species of Tree': 'Pine',
            'Trunk width': 75,
            Timestamp: '2019-10-14T09:12:13.012Z',
            Length: 20,
            Coordinates: '25.474293614, 65.0543745'
        }),
        'p124-1': ToEntity({}),
        'p125-1': ToEntity({})
    }
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
    plywood: ToEntityLayout('building'),
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

export function dataQueryDriver(
    dataRequest$: Stream<DataRequest>
): Stream<DataResponse> {
    return dataRequest$
        .map((req: DataRequest) => {
            const { type, id } = req;
            const responseData: any = (data[type] && data[type][id]) as any;

            if (responseData !== undefined) {
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
        })
        .map(res => ({ ...res, layout: layoutDirectives[res.req.type] }));
}
