import * as mapboxgl from 'mapbox-gl';
import { dict, number } from 'jsverify';
import { Dictionary } from 'ramda';

let map: mapboxgl.Map;
const mapSetup = () => {
    // This must be set, but the value is not needed here.
    // @ts-ignore TODO readonly, yet this is how it's done in the official docs:
    mapboxgl.accessToken = 'not-needed';

    map = new mapboxgl.Map({
        container: 'map', // container id
        // A basic vector base map:
        style: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
        zoom: 14, // starting zoom level
        minZoom: 4,
        maxZoom: 19,
        maxBounds: [19 - 20, 59 - 20, 32 + 20, 71 + 19],
        center: [24.93, 60.18]
    });

    // Suppress uninformative console error spam:
    map.on('error', e => {
        if (e.error.message === '') return;
        console.error(e.error.message, e.error.stack, e.target);
    });

    return map;
};

const addMapUIControls = () => {
    map.addControl(new mapboxgl.NavigationControl());

    map.addControl(
        new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        })
    );

    map.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
};

const addBuildings = () => {
    map.addSource('buildings', {
        type: 'geojson',
        // TODO: load from a URL:
        // 'data': 'data/buildings.geojson'
        data: require('../../data/buildings.geojson')
    });

    const height = 30;
    const groundLevelHeight = 0;

    map.addLayer({
        id: '3d-buildings',
        source: 'buildings',
        type: 'fill-extrusion',
        // 'minzoom': 14,
        paint: {
            'fill-extrusion-color': '#faa',

            // use an 'interpolate' expression to add a smooth transition effect to the
            // buildings as the user zooms in
            'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                height
            ],
            'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                groundLevelHeight
            ],
            'fill-extrusion-opacity': 0.6
        }
    });

    // map.addLayer({
    //     'id': '2d-buildings',
    //     'source': 'buildings',
    //     'type': 'fill',
    //     'maxzoom': 14,
    //     'paint': {
    //         'fill-color': '#faa',
    //     }
    // });
};

const addTrees = () => {
    map.addSource('stands', {
        type: 'geojson',
        // TODO: load from a URL:
        // 'data': 'data/stands.geojson'
        data: require('../../data/stands.geojson')
    });

    // Stand ~= forest parcel - an individual unit of forest, a subset of property
    map.addLayer({
        id: 'stands-fill',
        source: 'stands',
        type: 'fill',
        minzoom: 7,
        paint: {
            'fill-color': 'rgba(50, 200, 30, 0.4)'
        }
    });

    // For now, just mark trees at the ~center of a stand
    // map.addSource('trees', {
    //     'type': 'geojson',
    //     'data': 'data/trees.geojson'
    // });

    map.addLayer({
        id: 'trees',
        source: 'stands',
        type: 'circle',
        minzoom: 10,
        paint: {
            'circle-color': 'rgba(50, 200, 30, 0.4)',
            'circle-radius': 8
        }
    });
};

const buildingClickHandler = (ev: mapboxgl.MapLayerMouseEvent) => {
    if (!ev.features) return;
    const f = ev.features[0];

    // Try get property id
    const propertyId = f && f['properties'] && f['properties']['id'];

    new mapboxgl.Popup({ maxWidth: '360px' })
        .setLngLat(ev.lngLat)
        .setHTML(
            `
            <h1>Building (Id: ${propertyId})</h1>
            <h2><a href="/traverse/building/${propertyId}">Details</a></h2>            
        `
        )
        .addTo(map);
};

const treeClickHandler = (ev: mapboxgl.MapLayerMouseEvent) => {
    if (!ev.features) return;
    const f = ev.features[0];

    new mapboxgl.Popup({ maxWidth: '360px' })
        .setLngLat(ev.lngLat)
        .setHTML(
            `
            <h1>Tree X</h1>
            ${JSON.stringify(f, null, 2)}
        `
        )
        .addTo(map);
};

const layerClickHandlers: {
    [layer: string]: (ev: mapboxgl.MapLayerMouseEvent) => void;
} = {
    '3d-buildings': buildingClickHandler,
    trees: treeClickHandler,
    'stands-fill': treeClickHandler
};

export const initMap = () => {
    mapSetup();
    addMapUIControls();

    map.on('load', () => {
        addBuildings();
        addTrees();
    });

    for (const layer in layerClickHandlers) {
        // Make the objects appear clickable on the map:
        map.on('mouseenter', layer, () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layer, () => {
            map.getCanvas().style.cursor = '';
        });

        map.on('click', layer, layerClickHandlers[layer]);
    }
    (window as any)['map'] = map;
};

// Handle events coming outside map component
const eventRoot = document.body;
type MutateMapEventData = {
    type: string;
    coords: { lng: number; lat: number };
    data: any;
};
type MapEventData = {
    type: string;
    data: any;
    coords?: { lng: number; lat: number };
};
type MapDataEventHandler = (param: MutateMapEventData) => void;
let markers: mapboxgl.Marker[] = [];

const addMarkerTo = (coords: mapboxgl.LngLatLike, eventData?: MapEventData) => {
    const el = document.createElement('div');
    el.className = 'marker';
    el.addEventListener('click', dispatchMapEventFn(eventData));
    return new mapboxgl.Marker(el).setLngLat(coords).addTo(map);
};

const handlerStrategy: Dictionary<MapDataEventHandler> = {
    'move-to': e => {
        map.panTo(e.coords);
    },
    'reset-markers': e => {
        markers.forEach(m => m.remove());
        markers = [];
    },
    'ensure-tree': e => {
        const onClickEventData: MapEventData = {
            type: 'map-object-clicked',
            data: e.data,
            coords: e.coords
        };
        markers.push(
            addMarkerTo([e.coords.lng, e.coords.lat], onClickEventData)
        );
    },
    refresh: () => {
        console.log('resize');
        map.resize();
    }
};

function dispatchMapEvent(eventData?: MapEventData): void {
    if (!eventData) {
        return;
    }
    const event = new CustomEvent<MapEventData>('map-event', {
        detail: eventData
    });
    eventRoot.dispatchEvent(event);
}

const dispatchMapEventFn = (eventData?: MapEventData) =>
    dispatchMapEvent.bind(undefined, eventData);

eventRoot.addEventListener(
    'mutate-map-event',
    (e: CustomEvent<MutateMapEventData[]>) => {
        if (e.detail) {
            e.detail.map(
                event =>
                    handlerStrategy[event.type] &&
                    handlerStrategy[event.type](event)
            );
        }
    }
);
