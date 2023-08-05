import mapboxgl from 'mapbox-gl';
import { FisiMap } from './FisiMap';
import { SearchBar } from './SearchBar';

import 'mapbox-gl/dist/mapbox-gl.css';
import './styles/globals.scss';
import './styles/map.scss';
import './styles/layout.scss';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOXGL_API_KEY;

const map = new FisiMap('fisimap');
map.setupCat();
const ready = Promise.all([
  map.waitForMapLoaded(),
  map.loadGeoJSONDataToMemory(),
  map.loadAssignmentsToMemory()
]);

ready.then(() => {
  new SearchBar({
    ambientsData: map.ambientsData,
    assignmentsData: map.assignmentsData,
    map: map
  });
  // Covers the whole Fisi terrain
  const FISI_TERRAIN_COVER_LAYER = 'fisiBaseTerrain';
  map.addLayer({
    id: FISI_TERRAIN_COVER_LAYER,
    source: 'fisi_outer_layer.geo.json',
    type: 'fill',
    paint: {
      'fill-color': '#f8f0e8',
      'fill-opacity': 1
    }
  });

  const FISI_BUILDING_BASE_LAYER = 'fisiBuildingOutline';
  map.addLayer({
    id: FISI_BUILDING_BASE_LAYER,
    source: 'fisi_base_layer.geo.json',
    type: 'line',
    paint: {
      'line-color': '#717668',
      'line-width': 2
    }
  });

  map.loadFloorLevels();

  const FISI_GREEN_AREA_LAYER = 'fisiGreenArea';
  map.addLayer({
    id: FISI_GREEN_AREA_LAYER,
    source: 'fisi_green.geo.json',
    type: 'fill',
    paint: {
      'fill-color': '#c5d6a2',
      'fill-opacity': 0.8
    }
  });

  const FISI_VR_POINTS = 'fisiVRPoints';
  map.addLayer({
    id: FISI_VR_POINTS,
    source: '360_interactive_points.geo.json',
    type: 'circle',
    paint: {
      'circle-color': '#000',
      'circle-radius': 5,
      'circle-blur': 0.5,
      'circle-opacity': 0.5
    },
    layout: {
      visibility: 'none'
    }
  });
});

async function getRoute(start, end) {
  // make a directions request using cycling profile
  // an arbitrary start will always be the same
  // only the end or destination will change
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?alternatives=false&annotations=distance%2Cduration&geometries=geojson&overview=full&steps=false&access_token=${mapboxgl.accessToken}`,
    { method: 'GET' }
  );
  const json = await query.json();
  const data = json.routes[0];
  const geojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: data.geometry.coordinates
    }
  };
  // if the route already exists on the map, we'll reset it using setData
  if (map.getSource('route')) {
    map.getSource('route').setData(geojson);
  }
  // otherwise, we'll make a new request
  else {
    map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: geojson
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3887be',
        'line-width': 5,
        'line-opacity': 0.75
      }
    });
  }
}

const startPoint = [-77.08574712198498,-12.053605418051205]
document.getElementById('origin').value = "FISI";

document.getElementById('destination').addEventListener('click', (e) => {
  let destinationSet = false;
  map.on('click' , (e) => {
    if (!destinationSet) {
      const coords = Object.keys(e.lngLat).map((key) => e.lngLat[key]);
      destinationSet = true;
      getRoute(startPoint, coords);
      document.getElementById('delete-route-btn').classList.remove('hidden');
    }
  });
});

// the delete-route-btn button is hidden by default
// it's shown when a route is returned from the API
document.getElementById('delete-route-btn').addEventListener('click', (e) => {
  map.removeLayer('route');
  map.removeSource('route');
  document.getElementById('delete-route-btn').classList.add('hidden');
});


/** No map related handlers goes here */
document.getElementById('toggle-panel-btn').addEventListener('click', (e) => {
  const sidepanel = document.getElementById('sidepanel');
  sidepanel.classList.toggle('hidden');
});

