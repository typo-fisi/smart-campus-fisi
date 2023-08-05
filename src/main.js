import mapboxgl from 'mapbox-gl';
import { FisiMap } from './FisiMap';

import 'mapbox-gl/dist/mapbox-gl.css';
import './styles/globals.scss';
import './styles/map.scss';
import './styles/layout.scss';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOXGL_API_KEY;

const map = new FisiMap('fisimap');
map.setupCat();
const ready = Promise.all([
  map.waitForMapLoaded(),
  map.loadGeoJSONDataToMemory()
]);

ready.then(() => {
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

  const FISI_VR_POINTS = 'fisiVRPoints';
  map.addLayer({
    id: FISI_VR_POINTS,
    source: '360_interactive_points.geo.json',
    type: 'circle',
    paint: {
      'circle-color': '#3f5c9e',
      'circle-radius': 5,
      'circle-blur': 0.5,
      'circle-opacity': 0.5
    },
    layout: {
      visibility: 'none'
    }
  });
});

/** No map related handlers goes here */
document.getElementById('toggle-panel-btn').addEventListener('click', (e) => {
  const sidepanel = document.getElementById('sidepanel');
  sidepanel.classList.toggle('hidden');
});
