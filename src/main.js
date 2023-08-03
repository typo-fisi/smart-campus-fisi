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

  // Covers the whole Fisi terrain
  const FISI_TERRAIN_COVER_LAYER = 'fisiOuterLayer';
  map.addGeoJSONLayer(FISI_TERRAIN_COVER_LAYER, {
    geoJSONSource: 'fisi_outer_layer.geo.json',
    layerType: 'fill',
    paint: {
      'fill-color': '#f8f0e8',
      'fill-opacity': 1
    }
  });

  const FISI_BUILDING_BASE_LAYER = 'fisiBuildingLayerOutline';
  map.addGeoJSONLayer(FISI_BUILDING_BASE_LAYER, {
    geoJSONSource: 'fisi_base_layer.geo.json',
    layerType: 'line',
    paint: {
      'line-color': '#717668',
      'line-width': 2
    }
  });

  const FISI_FIRST_FLOOR_LAYER = 'fisiFirstFloorLayer';
  map.addGeoJSONLayer(FISI_FIRST_FLOOR_LAYER, {
    geoJSONSource: 'fisi_level1.geo.json',
    layerType: 'fill',
    paint: {
      'fill-color': [
        'match',
        ['get', 'category'],
        ...[...categoryToColorMap.entries()].flat(),
        '#ffaabb' // default
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0.5
      ]
    },
    addOutline: true,
    addLabels: true,
    addClickEvent: true,
    visibility: 'visible'
  });
  map.addLayerHover(FISI_FIRST_FLOOR_LAYER);

  const FISI_SECOND_FLOOR_LAYER = 'fisiSecondFloorLayer';
  map.addGeoJSONLayer(FISI_SECOND_FLOOR_LAYER, {
    geoJSONSource: 'fisi_level2.geo.json',
    layerType: 'fill',
    paint: {
      'fill-color': [
        'match',
        ['get', 'category'],
        ...[...categoryToColorMap.entries()].flat(),
        '#ffaabb' // default
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0.5
      ]
    },
    addOutline: true,
    addLabels: true,
    addClickEvent: true,
    visibility: 'none'
  });
  map.addLayerHover(FISI_SECOND_FLOOR_LAYER);

  map.on('idle', () => {
    const toggleableLayers = [
      FISI_FIRST_FLOOR_LAYER,
      FISI_SECOND_FLOOR_LAYER
    ];

    // set up toggleable buttons for each layer
    for (const layerId of toggleableLayers) {
      if (document.getElementById(layerId)) {
        continue;
      }
      const link = document.createElement('a');
      link.id = layerId;
      link.href = '#';
      link.textContent = layerId;
      link.className = 'active';

      link.onclick = function (e) {
        const clickedLayer = this.textContent;
        e.preventDefault();
        e.stopPropagation();

        const visibility = map.getLayoutProperty(clickedLayer, 'visibility');

        if (visibility === 'none') {
          map.changeVisibility(clickedLayer, 'visible');
          this.className = 'active';

          toggleableLayers.forEach((layer) => {
            if (layer !== clickedLayer) {
              map.changeVisibility(layer, 'none');
              document.getElementById(layer).className = '';
            }
          })};
        };
      const layers = document.getElementById('toggleable-layers');
      layers.appendChild(link);
  }
});
});

document.getElementById('toggle-panel-btn').addEventListener('click', (e) => {
  const sidepanel = document.getElementById('sidepanel');
  sidepanel.classList.toggle('hidden');
})
