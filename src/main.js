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
});

const buttonElement = document.createElement('div');
buttonElement.style.height = '26px';
const catDragDoll = document.createElement('span');
catDragDoll.style.backgroundImage = 'url(./gato_tesla.png)';
catDragDoll.style.backgroundSize = 'contain';
catDragDoll.style.backgroundRepeat = 'no-repeat';
catDragDoll.style.display = 'block';
catDragDoll.style.width = '100%';
catDragDoll.style.height = '25px';
buttonElement.appendChild(catDragDoll);
document.querySelector('.mapboxgl-ctrl-bottom-right .mapboxgl-ctrl.mapboxgl-ctrl-group').prepend(
  buttonElement
);
const catDragDollClone = catDragDoll.cloneNode(true);
catDragDollClone.style.position = 'absolute';
catDragDollClone.style.top = '0px';
catDragDollClone.style.left = '0px';
catDragDollClone.style.display = 'none';
catDragDollClone.style.width = '30px';
catDragDollClone.style.height = '30px';
catDragDollClone.style['z-index'] = '100000';
document.body.appendChild(catDragDollClone);

let isDraggingTesla = false;

buttonElement.addEventListener('dragstart', () => {
  console.log("dragging!!!!")
  isDraggingTesla = true;

  const handleEndDrag = () => {
    isDraggingTesla = false;
    buttonElement.removeEventListener('drop', handleEndDrag);
    catDragDollClone.style.display = 'none';
    catDragDoll.style.opacity = 1;
  }

  buttonElement.addEventListener('drop', handleEndDrag);
});

window.addEventListener('dragover', (e) => {
  if (isDraggingTesla) {
    e.preventDefault();
    console.log("dragging tesla")
    catDragDollClone.style.display = 'block';
    catDragDoll.style.opacity = 0.01;
    catDragDollClone.style.top = `${e.clientY}px`;
    catDragDollClone.style.left = `${e.clientX}px`;
    map.getCanvas().style.cursor = 'grabbing';
  }
});

document.getElementById('toggle-panel-btn').addEventListener('click', (e) => {
  const sidepanel = document.getElementById('sidepanel');
  sidepanel.classList.toggle('hidden');
})
