import mapboxgl from 'mapbox-gl';

export class FisiMap extends mapboxgl.Map {
  static INITIAL_MAP_ZOOM = 18;
  static MAP_MAX_ZOOM = 20;
  static FISI_COORDINATES = [-77.0854458, -12.0530102];
  static MAP_BOUNDS = [
    [-77.10696407267761, -12.073808103180393], // SW (suroeste)
    [-77.06157625505902, -12.041444357181149], // NE (noreste)
  ]

  constructor(containerId) {
    // calls the mapboxgl.Map constructor
    super({
      container: containerId, // container ID
      // styles API: https://docs.mapbox.com/api/maps/styles/
      // styles gallery: https://www.mapbox.com/gallery
      style: 'mapbox://styles/paoloose/clku5av4d001501p4agbi6cbo?optimize=true',
      // style: 'mapbox://styles/mapbox/satellite-streets-v12?optimize=true', (satelital)
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

  // Change layer's paint property dinamically:
  // https://docs.mapbox.com/mapbox-gl-js/api/map/#map#setpaintproperty
}

