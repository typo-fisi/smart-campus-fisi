import mapboxgl from 'mapbox-gl';
import { LayerGroup } from './LayerGroup';
import { DraggableCat } from './DraggableCat';

export class FisiMap extends mapboxgl.Map {
  static INITIAL_MAP_ZOOM = 18;
  static MAP_MAX_ZOOM = 20;
  static FISI_COORDINATES = [-77.0854458, -12.0530102];
  static MAP_BOUNDS = [
    [-77.10696407267761, -12.073808103180393], // SW (suroeste)
    [-77.06157625505902, -12.041444357181149], // NE (noreste)
  ];
  /** @type {HTMLElement} container */
  htmlElement = null;
  /**
   * @private @type {mapboxgl.LngLat} */
  mouseCurrentCoordinates = null;
  /**
   * This data map gets populated when loadGeoJSONData is called
   * @type {Object<string, Object>}
   * */
  geoJSONDataMap = {
    'fisi_base_layer.geo.json': null,
    'fisi_outer_layer.geo.json': null,
    'fisi_level1.geo.json': null,
    'fisi_level2.geo.json': null,
    'fisi_level3.geo.json': null,
    'fisi_level3.geo.json': null,
    'fisi_green.geo.json': null,
    'fisi_trees.geo.json': null,
    '360_interactive_points.geo.json': null
  };
  initialVisibleFloor = 1;

  /**
   * Cached ambients information objects from the api (See ambients.json)
   * @type {Array<Object>}
   * */
  ambientsData = [];
  /**
   * Cached assignments data
   *
   * @type {Array<Object>}
   */
  assignmentsData = [];

  /**
   * This contains the list of LayerGroup[] loaded by this.loadFloorLevels
   * @type {Array<LayerGroup>}
   * */
  floorsLayerGroups = [];

  /** @type {LayerGroup} */
  currentFloor = null;

  categoryToColorMap = new Map([
    ['aula', '#8a8bbf'],
    ['laboratorio', '#b0a182'],
    ['sshh', '#8ababf'],
    ['administrativo', '#ba998d'],
    ['stairs', '#ca8b8b'],
  ]);

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
    map.htmlElement = document.getElementById(containerId);

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

    map.on('mousemove', (e) => {
      this.mouseCurrentCoordinates = e.lngLat;
    });
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

  /**
   * @param {{x: number, y: number}} coords coords in pixels relative to canvas
   * @returns {{lng: number, lat: number}} coords in lngLat format
   */
  getCoordsFromMouseCanvasPosition({ x, y }) {
    return this.unproject({ x, y });
  }

  /**
   * @param {{x: number, y: number}} coords coords in pixels relative the document
   * @returns {{lng: number, lat: number}} coords in lngLat format
   */
  getCoordsFromMouseDocumentPosition({ x, y }) {
    const rect = this.htmlElement.getBoundingClientRect();
    const mouseCanvasPosition = {
      x: x - rect.left,
      y: y - rect.top
    };
    return this.getCoordsFromMouseCanvasPosition(mouseCanvasPosition);
  }

  getMouseCurrentCoordinates() {
    return this.mouseCurrentCoordinates;
  }

  waitForMapLoaded() {
    if (this.loaded()) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.on('load', resolve);
    });
  }

  async loadAssignmentsToMemory() {
    try {
      const assignmentsResponse = await fetch(`${import.meta.env.VITE_AMBIENTS_API_URL}/api/assignments/`);
      // const assignmentsResponse = await fetch('./assignments.json');
      this.assignmentsData = await assignmentsResponse.json();
    } catch (e) {
      console.error('Could not fetch assignments data!!', e);
      window.alert('No se pudo cargar la información de las asignaciones. Por favor, recargue la página');
    }
  }

  /**
   * Each GeoJSON file is loaded dynamically with an id set to its filename.geo.json
   *
   * e.g. `static/geojson/fisi_base_layer.geo.json` will have an id of `fisi_base_layer.geo.json`
   * @returns {Promise<void[]>}
   */
  async loadGeoJSONDataToMemory() {
    // Files in static/geojson
    try {
      // const ambientsResponse = await fetch(`${import.meta.env.VITE_AMBIENTS_API_URL}/api/ambients/`);
      const ambientsResponse = await fetch('./ambients.json');
      this.ambientsData = await ambientsResponse.json();
    } catch (e) {
      console.error('Could not fetch ambients data!!', e);
      window.alert('No se pudo cargar la información de los ambientes. Por favor, recargue la página');
    }

    const dynamicImports = Object.keys(this.geoJSONDataMap).map(async (filename) => {
      const response = await fetch(`./geojson/${filename}`);
      const jsonData = await response.json();

      // This logic is applied to all the fisi geojsons levels
      if (filename.startsWith('fisi_level')) {
        // Populate ambient's properties dinamically to the geojsons
        // since they only contain an ambient_id
        jsonData.features.forEach((feature) => {
          const ambientIdToPopulate = feature.properties.ambient_id;
          const properties = this.ambientsData.find((ambient) => (
            ambientIdToPopulate === ambient.ambient_id
          ));
          if (!properties) {
            // TODO: throwing this error is important, but we don't have enough data yet
            // alert(`The geoJSON file '${filename}' contains an ambient_id=${ambientIdToPopulate} that was not found in the ambients json data`)
            // throw Error(
            //   `The geoJSON file '${filename}' contains an ambient_id=${ambientIdToPopulate} that was not found in the ambients json data`
            // );
          }
          else {
            feature.properties = { ...properties };
          }
        });
      }
      this.geoJSONDataMap[filename] = jsonData;
      // the id is the filename filename
      this.addSource(filename, {
        type: 'geojson',
        data: jsonData
      });
    });

    return Promise.all(dynamicImports);
  }

  /**
   * Adds mouse listeners to the layer for hovering and highlighting.
   *
   * Call it only once for each layer created.
   *
   * @param {string} layerId
   */
  makeLayerHoverable(layerId) {
    /* Styles on hover
      https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/
    */
    const geoJSONId = layerId.replace('.fill', '.geo.json');
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
          { source: geoJSONId, id: hoveredAmbientId },
          { hover: false }
        );
      }
      hoveredAmbientId = e.features[0].id;
      this.setFeatureState(
        { source: geoJSONId, id: hoveredAmbientId },
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
          { source: geoJSONId, id: hoveredAmbientId },
          { hover: false }
        );
      }
      hoveredAmbientId = null;
      document.querySelector(
        '.mapboxgl-canvas-container.mapboxgl-interactive'
      ).style.cursor = '';
    });
  }

  /**
   * Dinamically load all the Fisi floors.-
   */
  loadFloorLevels() {
    Object.keys(this.geoJSONDataMap).forEach(geoJSONSourceName => {
      if (!geoJSONSourceName.startsWith('fisi_level')) return;

      const groupId = geoJSONSourceName.replace('.geo.json', '');
      const layerGroup = new LayerGroup({
        map: this,
        groupId,
        isVisible: groupId === `fisi_level${this.initialVisibleFloor}`,
        geoJSONSource: geoJSONSourceName
      });

      // Fill layer
      layerGroup.pushLayer('fill', {
        type: 'fill',
        paint: {
          'fill-color': [
            'match',
            ['get', 'category'],
            ...[...this.categoryToColorMap.entries()].flat(),
            '#e6dbc7' // default
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0.5
          ]
        },
      });

      /* Show ambient's stroke */
      layerGroup.pushLayer('outline', {
        type: 'line',
        paint: {
          'line-color': '#000',
          'line-width': 0.4
        }
      });

      /* Show ambient's names */
      layerGroup.pushLayer('labels', {
        type: 'symbol',
        layout: {
          // Hide text labels for zoom levels below 17.
          'text-field': ['get', 'name'],
          'text-variable-anchor': ['center'],
          'text-radial-offset': 0.5,
          'text-justify': 'auto',
          'icon-image': ['get', 'icon'], // TODO: icons?
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            17, 0, // < 17 zoom -> 0px
            18, 8, // 18 zoom -> 8px
            22, 14 // > 22 zoom -> 14px
          ]
        }
      });

      const clickeableLayerId = layerGroup.getLayerIdByType('fill');
      this.on('click', clickeableLayerId, FisiMap.handleAmbientClick)

      layerGroup.addToMap();
      this.floorsLayerGroups.push(layerGroup);
      this.makeLayerHoverable(clickeableLayerId);
    });

    // Add toggable floor buttons
    const toggableButtons = this.floorsLayerGroups.map((floorGroup, i) => {
      const button = document.createElement('button');
      button.textContent = `${i + 1}`;
      button.dataset.groupToToggle = floorGroup.groupID;
      if ((i + 1) === this.initialVisibleFloor) {
        button.classList.add('active');
        this.currentFloor = floorGroup;
      }
      return button;
    });

    toggableButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this.floorsLayerGroups.forEach((floorGroup) => {
          floorGroup.setIsVisible(floorGroup.groupID === button.dataset.groupToToggle);
        });
        toggableButtons.forEach((button) => {
          button.classList.remove('active');
        });
        button.classList.add('active');
      });
      const layers = document.getElementById('toggleable-layers');
      layers.prepend(button);
    });
  }

  /**
   * This defines the logic when an ambient is clicked.
   *
   * @param {mapboxgl.MapMouseEvent & {features?: mapboxgl.MapboxGeoJSONFeature[] | undefined;} & mapboxgl.EventData} e
   */
  static handleAmbientClick(e) {
    const feature = e.features[0];
    const ambient = this.ambientsData.find((ambient) => ambient.ambient_id === feature.id);

    this.flyTo({
      center: e.lngLat,
      zoom: 20,
      offset: [100, 0]
    });

    // Update the sidepanel information based on the ambient_id
    const information = document.getElementById('sidepanel-information');
    const title = information.getElementsByTagName('h4')[0];
    title.textContent = ambient.name;
    const description = information.getElementsByTagName('p')[0];
    description.textContent = ambient.description;

    const sidepanel = document.getElementById('sidepanel');
    sidepanel.classList.remove('hidden');

    if (ambient.category === "salones" || ambient.category === "aulas") {
      // cuando es un salón, buscamos en todos los assignments los cursos que se dictan ahí
      const gruposQueDictan = [];
      this.assignmentsData.filter((assignment) => {
        assignment.groups.forEach((group) => {
          if (group.ambient_id === ambient.ambient_id) {
            group.course = assignment.name;
            gruposQueDictan.push(group);
          }
        });
      });

      if (gruposQueDictan.length === 0) {
        // delelete information about groups
        const groups = information.getElementsByClassName('groups-container')[0];
        groups.innerHTML = '';
        return;
      }

      const formatGroup = (group) => {
        console.log({ group })
        return `
          <div class="group">
            <h5>${group.course}</h5>
            <p>${group.professor.Name}</p>
            <p>${group.enrolled} estudiantes</p>
            <p>${group.schedules.map((schedule) => {
              const dayMap = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][schedule.day]
              const formatearHora = (hora) => {
                const horaString = hora.toString();
                const horaFormateada = `${horaString.slice(0, -2)}:${horaString.slice(-2)}`;
                return horaFormateada;
              }
              return `${dayMap} de ${formatearHora(schedule.from)} a ${formatearHora(schedule.to)}`
            }).join(', ')}</p>
          </div>
        `;
      }

      const groupsContainer = document.createElement('div');
      groupsContainer.classList.add('groups-container');
      const title = document.createElement('h4');
      title.classList.add('title');
      title.textContent = 'Grupos que dictan';

      groupsContainer.appendChild(title);

      gruposQueDictan.forEach((group) => {
        groupsContainer.innerHTML += formatGroup(group);
      });

      const groups = information.getElementsByClassName('groups-container')[0];
      groups.replaceWith(groupsContainer);
    }
  }

  setupCat() {
    new DraggableCat({
      map: this
    });
  }


  flyToAmbient(ambientId) {
    let foundFeatures = null;
    let floorGroupIdToFly = '';
    this.floorsLayerGroups.forEach((layerGroup) => {
      const layer = layerGroup.getLayerIdByType('fill');
      const query = this.queryRenderedFeatures({
        layers: [layer],
        filter: ['==', 'ambient_id', ambientId]
      });
      if (query.length > 0) {
        foundFeatures = query;
        floorGroupIdToFly = layerGroup.groupID
      }
    });

    if (!foundFeatures) {
      console.error('Ambient not found');
      return;
    }

    let foundFeature = foundFeatures[0];

    this.floorsLayerGroups.forEach((floorGroup) => {
      floorGroup.setIsVisible(floorGroup.groupID === floorGroupIdToFly);
    });

    console.log({foundFeature})
    console.log('floorToFly', foundFeature.geometry.coordinates[0]);

    this.flyTo({
      center: {
        lng: foundFeature.geometry.coordinates[0][1][0],
        lat: foundFeature.geometry.coordinates[0][1][1]
      },
      zoom: 20,
      offset: [0, 0]
    });

    document.getElementById('search-results').inerHTML = '';
  }
}
