import mapboxgl from 'mapbox-gl';

export class FisiMap extends mapboxgl.Map {
  static INITIAL_MAP_ZOOM = 18;
  static MAP_MAX_ZOOM = 20;
  static FISI_COORDINATES = [-77.0854458, -12.0530102];
  static MAP_BOUNDS = [
    [-77.10696407267761, -12.073808103180393], // SW (suroeste)
    [-77.06157625505902, -12.041444357181149], // NE (noreste)
  ];
  // This data map gets populated when loadGeoJSONData is called
  /** @type {Object<string, Object>} */
  geoJSONDataMap = {
    'fisi_base_layer.geo.json': null,
    'fisi_outer_layer.geo.json': null,
    'fisi_level1.geo.json': null,
    'fisi_level2.geo.json': null,
  };
  /** @type {Array<Object>} */
  ambientsData = [];

  constructor(containerId) {
    // calls the mapboxgl.Map constructor
    super({
      container: containerId, // container ID
      // styles API: https://docs.mapbox.com/api/maps/styles/
      // styles gallery: https://www.mapbox.com/gallery
      style: 'mapbox://styles/paoloose/clku5av4d001501p4agbi6cbo?optimize=true',
      // style: 'mapbox://styles/mapbox/satellite-streets-v12?optimize=true', // (satelital)
      zoom: FisiMap.INITIAL_MAP_ZOOM, // starting zoom
      maxZoom: FisiMap.MAP_MAX_ZOOM,
      center: FisiMap.FISI_COORDINATES,
      maxBounds: FisiMap.MAP_BOUNDS,
      attributionControl: false,
      // improve performance
      // https://docs.mapbox.com/help/troubleshooting/mapbox-gl-js-performance/
    });
    // To write map.(...) instead of this.(...)
    const map = this;

    // Interactive controls that modify the UI:
    // https://docs.mapbox.com/mapbox-gl-js/api/markers/
    map.addControl(
      new mapboxgl.AttributionControl({
        customAttribution: '<a href="https://sistemas.unmsm.edu.pe/" target="blank">Fisi UNMSM</a>',
      })
    )
    map.addControl(
      new mapboxgl.FullscreenControl({
        container: document.querySelector('body')
      })
    );

    map.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true
      }),
      'bottom-right'
    );
  }

  printMap() {
    this.getCanvas().toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'map.png';
      anchor.click();
    });
  }

  waitForMapLoaded() {
    if (this.loaded()) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.on('load', resolve);
    });
  }

  /**
   * Each GeoJSON file is loaded dynamically with an id set to its filename.geo.json
   *
   * e.g. `static/geojson/fisi_base_layer.geo.json` will have an id of `fisi_base_layer.geo.json`
   */
  async loadGeoJSONData() {
    // Files in static/geojson
    try {
      const ambientsResponse = await fetch(`${import.meta.env.VITE_AMBIENTS_API_URL}/api/ambients/`);
      // const ambientsResponse = await fetch('./ambients.json');
      this.ambientsData = await ambientsResponse.json();
    } catch (e) {
      console.log('Could not fetch ambients data!!', e);
    }

    const dynamicImports = Object.keys(this.geoJSONDataMap).map(async (filename) => {
      const response = await fetch(`./geojson/${filename}`);
      const data = await response.json();
      this.geoJSONDataMap[filename] = data;
      // id = filename
      this.addSource(filename, {
        type: 'geojson',
        data
      });
    });

    return Promise.all(dynamicImports);
  }

  // add method to add a source and a layer given the geoJSON path and the source ID
  // this method shoul be asynchrnous

  /**
   * Calls addSource and addLayer to a given map
   *
   * @param {string} layerId
   * @param {Object} options
   * @param {string} options.geoJSONSource
   * @param {'fill' | 'line' | 'symbol' | 'circle'} options.layerType
   * @param {mapboxgl.FillPaint | mapboxgl.LinePaint | mapboxgl.SymbolPaint | mapboxgl.CirclePaint} options.paint
   * @param {boolean} [options.addOutline=false]
   * @param {boolean} [options.addLabels=false]
   * @param {boolean} [options.addClickEvent=false]
   * @param {'visible' | 'none'} [options.visibility='visible']
   */
  addGeoJSONLayer(layerId, { geoJSONSource, layerType, paint , addOutline = false, addLabels = false, addClickEvent = false, visibility = 'visible'}) {
    if (!this.geoJSONDataMap[geoJSONSource]) {
      throw new Error(`No geoJSON source with name ${geoJSONSource} was found`);
    }

    // Layers spec: https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/
    this.addLayer({
      id: layerId,
      type: layerType,
      source: geoJSONSource,
      paint: paint,
      layout: {
        visibility: visibility
      }
    });

    if (addOutline) {
      this.addLayer({
        id: layerId + 'Outline',
        type: 'line',
        source: geoJSONSource,
        paint: {
          'line-color': '#000',
          'line-width': 0.5
        },
        layout: {
          visibility: visibility
        }
      });
    }

    if (addLabels) {
      /* Show ambient's names */
      this.addLayer({
        id: layerId + 'Labels',
        type: 'symbol',
        source: geoJSONSource,
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
          'visibility': visibility,
        }
      });
    }

    if (addClickEvent) {
      this.on('click', layerId, (e) => {
        const feature = e.features[0];
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<h3>${feature.properties.ambient_id}</h3>`)
          .addTo(this);

        this.flyTo({
          center: e.lngLat,
          zoom: 20,
          offset: [100, 0]
        });

        console.log({data: this.ambientsData})
        const ambient = this.ambientsData.find((ambient) => ambient.ambient_id === feature.id);
        const information = document.getElementById('sidepanel-information');
        const title = information.getElementsByTagName('h4')[0];
        title.textContent = ambient.name;
        const description = information.getElementsByTagName('p')[0];
        description.textContent = ambient.description;

        const sidepanel = document.getElementById('sidepanel');
        sidepanel.classList.remove('hidden');
      });
    }
  }

  /**
   * Adds a layer to the map that shows the ambients
   * @param {string} layerId
   */
  addLayerHover(layerId) {
    /* Styles on hover
      https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/
    */
    const layerMap = {
      'fisiFirstFloorLayer': 'fisi_level1.geo.json',
      'fisiSecondFloorLayer': 'fisi_level2.geo.json',
    }
    let hoveredAmbientId = null;
    let currentlyShownAmbientId = null;
    this.on('mousemove', layerId, (e) => {
      if (e.features.length === 0) return;
      document.querySelector(
        '.mapboxgl-canvas-container.mapboxgl-interactive'
      ).style.cursor = 'pointer';

      if (hoveredAmbientId !== null) {
        // If an ambient is currently being hovered, disable it
        this.setFeatureState(
          { source: layerMap[layerId], id: hoveredAmbientId  },
          { hover: false }
        );
      }
      hoveredAmbientId = e.features[0].id;
      this.setFeatureState(
        { source: layerMap[layerId], id: hoveredAmbientId },
        { hover: true }
      );
      if (currentlyShownAmbientId !== hoveredAmbientId) {
        currentlyShownAmbientId = hoveredAmbientId;
      }
    });

    // When the mouse leaves the state-fill layer, update the feature state of the
    // previously hovered feature.
    this.on('mouseleave', layerId, () => {
      if (hoveredAmbientId !== null) {
        this.setFeatureState(
          { source: layerMap[layerId], id: hoveredAmbientId },
          { hover: false }
        );
      }
      hoveredAmbientId = null;
      document.querySelector(
        '.mapboxgl-canvas-container.mapboxgl-interactive'
      ).style.cursor = '';
  });
  }

  changeVisibility(layerId, visibility) {
    const layerIds = [layerId, layerId + 'Outline', layerId + 'Labels'];
    layerIds.forEach((layerId) => {
      const layer = this.getLayer(layerId);
      if (layer) {
        this.setLayoutProperty(layerId, 'visibility', visibility);
      }
    });
  }



  // Change layer's paint property dinamically:
  // https://docs.mapbox.com/mapbox-gl-js/api/map/#map#setpaintproperty
}

