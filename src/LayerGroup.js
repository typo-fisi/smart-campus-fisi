import mapboxgl from "mapbox-gl";

export class LayerGroup {
  /** @type {Map<string, mapboxgl.AnyLayer>} */
  layers = new Map();
  groupID = '';
  isVisible = true;
  geoJSONSource = '';
  /** @type {mapboxgl.Map} */
  map = null;

  /** @param {{ map: mapboxgl.Map, groupId: string, isVisible: boolean, geoJSONSource: string }} param0 */
  constructor({ map ,groupId, isVisible, geoJSONSource }) {
    this.map = map;
    this.groupID = groupId;
    this.isVisible = isVisible;
    this.geoJSONSource = geoJSONSource;
  }

  /**
   * Push a new layer to the layer group.
   *
   * An automatic id will be created with the format {groupId}.{layerName}
   *
   * Note that the layers pushed are not attached to any map until
   * layerGroup.addToMap is called.
   *
   * This layer.id then can be retrieved either by type with getLayerIdByType()
   * or by layerName with getLayerIdByName()
   *
   * @param {string} layerName
   * @param {mapboxgl.AnyLayer} layer
  */
  pushLayer(layerName, layer) {
    layer.id = this.getLayerIdByName(layerName);
    layer.source = this.geoJSONSource;
    layer.layout = {
      ...layer.layout,
      visibility: this.isVisible ? 'visible' : 'none'
    };
    this.layers.set(layerName, layer);
  }

  /**
   * @param {boolean} isVisible
   */
  setIsVisible(isVisible) {
    this.layers.forEach((layer) => {
      this.map.setLayoutProperty(layer.id,
        'visibility', isVisible ? 'visible' : 'none'
      );
    });
  }
  toggleVisibility() {
    console.log(this)
    this.layers.forEach((layer) => {
      const visibility = this.map.getLayoutProperty(layer.id, 'visibility');
      this.map.setLayoutProperty(layer.id,
        'visibility', visibility === 'visible' ? 'none' : 'visible'
      );
    });
  }

  addToMap() {
    this.layers.forEach(layer => {
      this.map.addLayer(layer);
    });
  }

  /**
   * @param {'fill' | 'line' | 'symbol' | 'circle' | 'raster' | 'fill-extrusion' | 'background'} layerType
   *
   * @throws {Error} if no layer of type 'layerType' is found in group
   * @returns {string} layerId
   */
  getLayerIdByType(layerType) {
    for (const layer of this.layers.values()) {
      if (layer.type === layerType) {
        return layer.id;
      }
    }
    throw new Error(`No layer of type ${layerType} found in group`);
  }

  /**
   * Returns the layer.id from the layer name passed to pushLayer
   * @param {string} layerName
   */
  getLayerIdByName(layerName) {
    return `${this.groupID}.${layerName}`;
  }
}
