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
            <h1>Building Y</h1>
            <h2><a href="/building/${propertyId}">Details</a></h2>
            ${JSON.stringify(f, null, 2)}
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
};

const addMarkerTo = (coords: mapboxgl.LngLatLike) => {
    var el = document.createElement('div');
    el.className = 'marker';
    new mapboxgl.Marker(el).setLngLat(coords).addTo(map);
};

// Handle events coming outside map component
const eventRoot = document.body;
type MapDataEvent = { type: string; coords: { lng: number; lat: number } };
type MapDataEventHandler = (param: MapDataEvent) => void;
let treeSource;
const handlerStrategy: Dictionary<MapDataEventHandler> = {
    'move-to': e => {
        map.panTo(e.coords);
    },
    'ensure-tree': e => {
        // map.addLayer({
        //     id: 'source',
        //     type: 'symbol',
        //     source: {
        //         type: 'geojson',
        //         data: {
        //             type: 'FeatureCollection',
        //             features: [
        //                 {
        //                     type: 'Feature',
        //                     geometry: {
        //                         type: 'Point',
        //                         coordinates: [e.coords.lng, e.coords.lat]
        //                     },
        //                     properties: {
        //                         name: 'village'
        //                     }
        //                 }
        //             ]
        //         }
        //     }
        // });
        addMarkerTo([e.coords.lng, e.coords.lat]);
    }
};

eventRoot.addEventListener('map-event', (e: CustomEvent<MapDataEvent[]>) => {
    if (e.detail) {
        e.detail.map(
            event =>
                handlerStrategy[event.type] &&
                handlerStrategy[event.type](event)
        );
    }
});
