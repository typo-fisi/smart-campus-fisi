import './style.css';
import './map.css';

import L from 'leaflet'
import fisiGeoJSON from './static/fisi.geo.json'

const fisiCoords = [-12.0530102, -77.0854458];
const initialZoom = 19;
const maxZoom = 21;

const map = new L.Map('map', {
  maxZoom: maxZoom,
}).fitWorld();

const tilesProvider = (
  `https://b.tile.thunderforest.com/transport/{z}/{x}/{y}@2x.png?apikey=${import.meta.env.VITE_THUNDERFORST_API_KEY}`
);

L.tileLayer(tilesProvider, {
  attribution: '© OpenStreetMap',
  maxZoom: maxZoom
}).addTo(map);

L.geoJSON(fisiGeoJSON, {
    style: {
    color: "#000",
    opacity: 1,
    fillColor: "#000",
    fillOpacity: 0.8
  }
})
.addTo(map);

map.setView(fisiCoords, initialZoom);

// listen to zoom change
map.on('zoomend', (e) => {
  console.log('zoom level', map.getZoom());
});

