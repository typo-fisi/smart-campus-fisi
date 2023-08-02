import mapboxgl from 'mapbox-gl'; // or "const mapboxgl = require('mapbox-gl');"
import fisiGeoJSON from './static/fisi.geo.json'

import './style.css';
import './map.css';
import 'mapbox-gl/dist/mapbox-gl.css';

const fisiCoords = [-77.0854458, -12.0530102];
const initialZoom = 18;
const maxZoom = 20;

mapboxgl.accessToken = import.meta.env.VITE_MAPBOXGL_API_KEY;

const map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/mapbox/streets-v12', // style URL
  center: fisiCoords,
  zoom: initialZoom, // starting zoom
  maxZoom
});

document.querySelector('.mapboxgl-ctrl-bottom-left').remove();
