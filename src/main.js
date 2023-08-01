import './style.css'
// import fisiGeoJSON from './static/fisi.geo.json'
import L from 'leaflet'
import geoJSON from './static/fisi.geo.json'

const fisiCoords = [-12.0530102, -77.0854458];
const initialZoom = 16;
const maxZoom = 30;

const map = new L.Map('map', {
  center: fisiCoords,
  zoom: initialZoom,
	minZoom: initialZoom,
  maxZoom: maxZoom,
});

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: maxZoom,
  attribution: '© OpenStreetMap',
  // avoid pixelation by using double resolution tiles on retina devices
  detectRetina: true
}).addTo(map);


L.geoJSON(geoJSON, {
  style: {
  color: "#000",
  opacity: 1,
  fillColor: "#000",
  fillOpacity: 0.8
  }
}).addTo(map);

// listen to zoom change
map.on('zoomend', (e) => {
  console.log('zoom level', map.getZoom());
});
