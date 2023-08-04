import distance from '@turf/distance';
import { FisiMap } from './FisiMap';

export class DraggableCat {
  map = null;

  /** @param {{ map: FisiMap }} constructor */
  constructor({ map }) {
    this.map = map;

    const elementContainer = document.createElement('div');
    elementContainer.style.height = '26px';

    const catButton = document.createElement('span');
    catButton.style.backgroundImage = 'url(./gato_tesla.png)';
    catButton.style.backgroundSize = 'contain';
    catButton.style.backgroundRepeat = 'no-repeat';
    catButton.style.display = 'block';
    catButton.style.width = '100%';
    catButton.style.height = '25px';
    elementContainer.appendChild(catButton);
    document.querySelector('.mapboxgl-ctrl-bottom-right .mapboxgl-ctrl.mapboxgl-ctrl-group').prepend(
      elementContainer
    );

    const draggableCat = catButton.cloneNode(true);
    draggableCat.style.position = 'absolute';
    document.body.appendChild(draggableCat);

    // Variables to store initial pointer/touch position and element position
    let initialX, initialY;
    let offsetX = 0, offsetY = 0;
    let isDragging = false;

    // Function to get the event position (x, y) for both mouse and touch events
    function getEventPosition(event) {
      if (event instanceof MouseEvent) {
        return { x: event.clientX, y: event.clientY };
      } else if (event instanceof TouchEvent) {
        const touch = event.targetTouches[0];
        return { x: touch.clientX, y: touch.clientY };
      }
      return { x: 0, y: 0 };
    }

    // Function to handle pointer/touch down event
    function handlePointerDown(event) {
      // Prevent default behavior for both mouse and touch events
      event.preventDefault();

      // Store the initial pointer/touch position
      const { x, y } = getEventPosition(event);
      initialX = x;
      initialY = y;

      // Get the current position of the draggable element
      const rect = catButton.getBoundingClientRect();
      offsetX = x - rect.left;
      offsetY = y - rect.top;

      // Set the dragging flag to true
      isDragging = true;

      // Add event listeners for pointer/touch move and up events
      document.addEventListener(event.type === 'mousedown' ? 'mousemove' : 'touchmove', handlePointerMove);
      document.addEventListener(event.type === 'mousedown' ? 'mouseup' : 'touchend', handlePointerUp);
    }

    // Function to handle pointer/touch move event
    function handlePointerMove(event) {
      if (!isDragging) return; // Return if dragging hasn't started

      // Get the current pointer/touch position
      const { x: eventX, y: eventY } = getEventPosition(event);

      const x = eventX - offsetX;
      const y = eventY - offsetY;

      document.getElementById('position').innerHTML = `x: ${x}, y: ${y}`;

      // Set the new position of the draggable element
      draggableCat.style.left = `${x}px`;
      draggableCat.style.top = `${y + offsetY + 10}px`;
    }

    /// Cat dropped
    // Function to handle pointer/touch up event
    function handlePointerUp(event) {
      // Set the dragging flag to false
      isDragging = false;
      const mouseUpEvent = event.type === 'touchend' ? event.changedTouches[0] : event;
      const droppedCoords = Object.values(map.getCoordsFromMouseDocumentPosition({
        x: mouseUpEvent.clientX,
        y: mouseUpEvent.clientY
      }));

      // get all the vr interactive points
      const vrPoints = map.queryRenderedFeatures({
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

      // Remove the pointer/touch move and up event listeners
      document.removeEventListener(event.type === 'mousemove' ? 'mousemove' : 'touchmove', handlePointerMove);
      document.removeEventListener(event.type === 'mouseup' ? 'mouseup' : 'touchend', handlePointerUp);
    }

    // Add event listeners for both mouse and touch events (works on both web and mobile)
    catButton.addEventListener('mousedown', handlePointerDown);
    catButton.addEventListener('touchstart', handlePointerDown);

  }
}
