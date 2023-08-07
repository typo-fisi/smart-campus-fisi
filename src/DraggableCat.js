import View360, { ControlBar, EquirectProjection, LoadingSpinner } from "@egjs/view360";
import distance from '@turf/distance';
import { FisiMap } from './FisiMap';

export const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 600;

export class DraggableCat {
  static FISI_MAP_ID = 'fisimap';
  static VIEWER_ID = 'sphere-viewer';

  /** @type {FisiMap} */
  map = null;

  catButtonContainer = null;
  catImage = null;
  draggableCat = null;
  is360ViewerActive = false;

  // Variables to store initial pointer/touch position and element position
  initialX = 0;
  initialY = 0;
  offsetX = 0;
  offsetY = 0;
  isDragging = false;

  /** @param {{ map: FisiMap }} constructor */
  constructor({ map }) {
    this.map = map;

    this.catButtonContainer = document.createElement('div');
    this.catButtonContainer.style.height = '26px';

    this.catImage = document.createElement('span');
    this.catImage.style.backgroundImage = 'url(./gato_tesla.png)';
    this.catImage.style.backgroundSize = 'contain';
    this.catImage.style.backgroundRepeat = 'no-repeat';
    this.catImage.style.display = 'block';
    this.catImage.style.width = '100%';
    this.catImage.style.height = '25px';
    this.catButtonContainer.appendChild(this.catImage);
    document.querySelector('.mapboxgl-ctrl-bottom-right .mapboxgl-ctrl.mapboxgl-ctrl-group').prepend(
      this.catButtonContainer
    );

    this.draggableCat = this.catImage.cloneNode(true);
    this.draggableCat.style.position = 'absolute';
    this.draggableCat.style.display = 'none';
    this.draggableCat.style.top = '0';
    document.body.appendChild(this.draggableCat);

    // Add event listeners for both mouse and touch events (works on both web and mobile)
    this.catImage.addEventListener('mousedown', (event) => {
      this.onCatStartDragging(event);
    });
    this.catImage.addEventListener('touchstart', (event) => {
      this.onCatStartDragging(event);
    });
    document.addEventListener('touchmove', (event) => {
      this.onCatMoving(event)
    });
    document.addEventListener('mousemove', (event) => {
      this.onCatMoving(event)
    });
    document.addEventListener('mouseup', (event) => {
      this.onCatDrop(event)
    });
    document.addEventListener('touchend', (event) => {
      this.onCatDrop(event)
    });

    // listen to ESC key to close the 360 viewer
    document.addEventListener('keydown', (event) => {
      if (!this.is360ViewerActive) return;
      if (event.key === 'Escape') {
        this.close360Viewer();
      }
    });
    document.querySelector('#sphere-viewer button').addEventListener('click', () => {
      this.close360Viewer();
    });
  }

  onCatMoving (event) {
    if (!this.isDragging) return; // Return if dragging hasn't started
    this.draggableCat.style.display = 'block';

    // Get the current pointer/touch position
    const { x: eventX, y: eventY } = this.getEventPosition(event);

    const x = eventX - this.offsetX;
    const y = eventY - this.offsetY;

    // Set the new position of the draggable element
    this.draggableCat.style.left = `${x}px`;
    this.draggableCat.style.top = `${y + this.offsetY + 10}px`;
  }

  onCatStartDragging(event) {
    this.map.setLayoutProperty('fisiVRPoints', 'visibility', 'visible');
    // Prevent default behavior for both mouse and touch events
    event.preventDefault();
    // Store the initial pointer/touch position
    const { x, y } = this.getEventPosition(event);
    this.initialX = x;
    this.initialY = y;

    // Get the current position of the draggable element
    const rect = this.catImage.getBoundingClientRect();
    this.offsetX = x - rect.left;
    this.offsetY = y - rect.top;

    // Set the dragging flag to true
    this.isDragging = true;
  }

  onCatDrop(event)  {
    if (!this.isDragging) return; // Return if dragging hasn't started
    this.map.setLayoutProperty('fisiVRPoints', 'visibility', 'none');
    // Set the dragging flag to false
    this.isDragging = false;
    this.draggableCat.style.display = 'none';
    const { x: eventX, y: eventY } = this.getEventPosition(event);
    const droppedCoords = Object.values(this.map.getCoordsFromMouseDocumentPosition({
      x: eventX,
      y: eventY
    }));

    // get all the vr interactive points
    const vrPoints = this.map.queryRenderedFeatures({
      layers: ['fisiVRPoints']
    }).map((f) => ({
      image_id: f.properties.image_id,
      distance: distance(droppedCoords, f.geometry.coordinates)
    }));

    const nearestPoint = vrPoints.reduce((prev, curr) => {
      if (prev.distance > curr.distance) {
        return curr;
      }
      return prev;
    }, { distance: Infinity });

    console.log({nearestPoint})
    if (nearestPoint.distance > 0.0107109) return;
    this.show360Viewer(nearestPoint.image_id);
  }

  async show360Viewer(image_id) {
    // Hide UI elements
    document.getElementById('app-header').style.display = 'none';
    document.getElementById('directionbar').style.display = 'none';
    document.getElementById('fisimap').style.display = 'none';
    const view = document.getElementById('sphere-viewer');
    const canvas = document.createElement('canvas');
    view.style.display = 'block';
    canvas.classList.add('view360-canvas');
    view.appendChild(canvas);
    this.is360ViewerActive = true;
    try {
      // view.requestFullscreen();
    } catch {

    }

    const viewer = new View360("#sphere-viewer", {
      useResizeObserver: true,
      useGrabCursor: true,
      disableContextMenu: true,
      scrollable: false,
      projection: new EquirectProjection({
        // Image URL to your 360 panorama image/video
        src: `./360/${image_id}.jpg`,
        // It's false, as it's gonna display image not video here
        video: false,
      }),
      initialZoom: IS_MOBILE ? 2 : 0.5,
      plugins: [new LoadingSpinner(), new ControlBar({
        keyboardControls: true,
        fullscreenButton: false
      })]
    });

    viewer.on('load', () => {
    });
  }

  close360Viewer() {
    if (!this.is360ViewerActive) return;
    document.getElementById('sphere-viewer').style.display = 'none';
    document.getElementById('app-header').style.display = 'block';
    document.getElementById('directionbar').style.display = 'block';
    document.getElementById('fisimap').style.display = 'block';
    document.querySelector('.view360-canvas').remove();
    this.is360ViewerActive = false;
    // document.exitFullscreen();
  }

  // Function to get the event position (x, y) for both mouse and touch events
  getEventPosition(event) {
    if (event.type === 'touchend') {
      return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
    }
    if (event instanceof MouseEvent) {
      return { x: event.clientX, y: event.clientY };
    }
    else if (event instanceof TouchEvent) {
      const touch = event.targetTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    }
    return { x: 0, y: 0 };
  }
}
