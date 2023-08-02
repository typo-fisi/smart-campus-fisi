import mapboxgl from 'mapbox-gl';
import { FisiMap } from './FisiMap';
import fisiGeoJSON from './static/fisi_base_layer.geo.json'
import firstFloorLayerGeoJSON from './static/level1.fisi.geo.json'

import 'mapbox-gl/dist/mapbox-gl.css';
import './styles/globals.scss';
import './styles/map.scss';
import './styles/layout.scss';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOXGL_API_KEY;

const map = new FisiMap('fisimap');

map.on('load', () => {
  map.addSource('fisiBaseSource', {
    type: 'geojson',
    data: fisiGeoJSON
  });
  map.addSource('firstFloorSource', {
    type: 'geojson',
    data: firstFloorLayerGeoJSON
  });

  const categoryToColorMap = new Map([
    ['aula', '#8a8bbf'],
    ['laboratorio', '#b0a182'],
    ['sshh', '#8ababf'],
    ['administrativo', '#ba998d']
  ]);

  // Layers spec: https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/
  map.addLayer({
    id: 'fisiBaseLayer',
    type: 'fill',
    source: 'fisiBaseSource',
    layout: {},
    paint: {
      'fill-color': [
        'match',
        ['get', 'category'],
        ...[...categoryToColorMap.entries()].flat(),
        '#8a8bbf' // default
      ],
      'fill-opacity': 1
    }
  });

  map.addLayer({
    id: 'firstFloorLayer',
    type: 'fill',
    source: 'firstFloorSource',
    layout: {},
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
