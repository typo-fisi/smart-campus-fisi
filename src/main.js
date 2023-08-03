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
    }
  });
  const FISI_FIRST_FLOOR_LAYER_OUTLINE = 'fisiFirstFloorLayerOutline';
  map.addGeoJSONLayer(FISI_FIRST_FLOOR_LAYER_OUTLINE, {
    geoJSONSource: 'fisi_level1.geo.json',
    layerType: 'line',
    paint: {
      'line-color': '#000',
      'line-width': 0.5
    }
  });

  /* Show ambient's names */
  const FISI_FIRST_FLOOR_LAYER_LABELS = 'fisiFirstFloorLayerLabels';
  map.addLayer({
    id: FISI_FIRST_FLOOR_LAYER_LABELS,
    type: 'symbol',
    source: 'fisi_level1.geo.json',
    layout: {
      'text-field': [
        'step',
        ['zoom'],
        '',
        FisiMap.MAP_MAX_ZOOM - 2,
        ['get', 'ambient_id']
      ],
      'text-variable-anchor': ['center'],
      'text-radial-offset': 0.5,
      'text-justify': 'auto',
      'icon-image': ['get', 'icon'], // TODO: icons?
      'text-size': 12, // text size by zoom?
    }
  });

  /* Styles on hover
     https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/
  */
  let hoveredAmbientId = null;
  map.on('mousemove', FISI_FIRST_FLOOR_LAYER, (e) => {
    if (e.features.length === 0) return;

    if (hoveredAmbientId !== null) {
      // If an ambient is currently being hovered, disable it
      map.setFeatureState(
        { source: 'fisi_level1.geo.json', id: hoveredAmbientId  },
        { hover: false }
      );
    }
    hoveredAmbientId = e.features[0].id;
    map.setFeatureState(
      { source: 'fisi_level1.geo.json', id: null, id: hoveredAmbientId },
      { hover: true }
    );
  });

  // When the mouse leaves the state-fill layer, update the feature state of the
  // previously hovered feature.
  map.on('mouseleave', FISI_FIRST_FLOOR_LAYER, () => {
    if (hoveredAmbientId !== null) {
      map.setFeatureState(
        { source: 'fisi_level1.geo.json', id: hoveredAmbientId },
        { hover: false }
      );
    }
    hoveredAmbientId = null;
  });


  map.on('click', FISI_FIRST_FLOOR_LAYER, (e) => {
    const feature = e.features[0];
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`<h3>${feature.properties.ambient_id}</h3>`)
      .addTo(map);
  });
});
