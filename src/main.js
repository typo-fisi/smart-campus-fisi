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

  const categoryToColorMap = new Map([
    ['aula', '#8a8bbf'],
    ['laboratorio', '#b0a182'],
    ['sshh', '#8ababf'],
    ['administrativo', '#ba998d']
  ]);

  map.addGeoJSONLayer(fisiGeoJSON, 'fisiBaseLayer', 'fill', {
    'fill-color': [
      'match',
      ['get', 'category'],
      ...[...categoryToColorMap.entries()].flat(),
      '#8a8bbf' // default
    ],
    'fill-opacity': 1
  });

  map.addGeoJSONLayer(firstFloorLayerGeoJSON, 'firstFloorLayer', 'fill', {
    'fill-color': [
      'match',
      ['get', 'category'],
      ...[...categoryToColorMap.entries()].flat(),
      '#ffaabb' // default
    ],
    'fill-opacity': 1
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
