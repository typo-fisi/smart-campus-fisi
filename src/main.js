import mapboxgl from 'mapbox-gl';
import { FisiMap } from './FisiMap';

import 'mapbox-gl/dist/mapbox-gl.css';
import './styles/globals.scss';
import './styles/map.scss';
import './styles/layout.scss';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOXGL_API_KEY;

const map = new FisiMap('fisimap');
const ready = Promise.all([
  map.waitForMapLoaded(),
  map.loadGeoJSONData()
]);

ready.then(() => {
  const categoryToColorMap = new Map([
    ['aula', '#8a8bbf'],
    ['laboratorio', '#b0a182'],
    ['sshh', '#8ababf'],
    ['administrativo', '#ba998d']
  ]);

  map.addGeoJSONLayer('fisiOuterLayer', {
    geoJSONSource: 'fisi_outer_layer.geo.json',
    layerType: 'fill',
    paint: {
      'fill-color': '#000',
      'fill-opacity': 0.2
    }
  });

  map.addGeoJSONLayer('fisiBaseLayer', {
    geoJSONSource: 'fisi_base_layer.geo.json',
    layerType: 'fill',
    paint: {
      'fill-color': '#aac',
      'fill-opacity': 1
    }
  });

  map.addGeoJSONLayer('firstFloorLayer', {
    geoJSONSource: 'fisi_level1.geo.json',
    layerType: 'fill',
    paint: {
      'fill-color': [
        'match',
        ['get', 'category'],
        ...[...categoryToColorMap.entries()].flat(),
        '#ffaabb' // default
      ],
      'fill-opacity': 1
    }
  });

  map.on('click', 'firstFloorLayer', (e) => {
    console.log(e.features.length)

    // if (e.features
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML('<h3>Hello World!</h3>')
      .addTo(map);
  });
})
