import './styles/search.scss'

export class SearchBar {
  /** @type {HTMLInputElement} */
  searchInput = null;
  ambientsData = [];
  assignmentsData = [];
  searchResultsElement = document.getElementById('search-results');
  /** @type {FisiMap} */
  map = null;

  constructor({ ambientsData, assignmentsData, map }) {
    this.map = map;
    this.ambientsData = ambientsData;
    this.assignmentsData = assignmentsData;
    this.searchInput = document.getElementById('search-input');

    // Listen when user types
    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      console.log(query)
      this.search(query);
    });
  }

  search(query) {
    const ambientsResults = this.ambientsData.filter((ambient) => {
      return ambient.name.toLowerCase().includes(query.toLowerCase()) ||
      ambient.description.toLowerCase().includes(query.toLowerCase())
    });

    const assignmentsResults = this.assignmentsData.filter((assignment) => {
      return assignment.name.toLowerCase().includes(query.toLowerCase()) ||
      assignment.groups.some((group) => {
        return group.professor.Name.toLowerCase().includes(query.toLowerCase())
      })
    });

    this.searchResultsElement.innerHTML = '';
    if (query === '') {
      return;
    }
    this.searchResultsElement.appendChild(this.renderAmbientsResults(ambientsResults));
    this.searchResultsElement.appendChild(this.renderAssignmentsResults(assignmentsResults));
  }


  renderAmbientsResults(ambients) {
    const container = document.createElement('div');
    container.classList.add('search-result');
    container.classList.add('search-results-ambients');
    ambients.forEach((ambient) => {
      const ambientElement = document.createElement('div');
      ambientElement.classList.add('search-results-ambient');
      ambientElement.style.cursor = 'pointer';
      ambientElement.innerHTML = `
        <h4>${ambient.name}</h4>
        <p>${
          ambient.description.length > 150
            ? ambient.description.substring(0, 150) + '...'
            : ambient.description
        }</p>
      `;
      ambientElement.addEventListener('click', () => {
        console.log('Navigate to ambient', ambient);
        this.map.flyToAmbient(ambient.ambient_id);
      });
      container.appendChild(ambientElement);
    });
    return container;
  }

  createAssingmentResult(assignment) {
    const container = document.createElement('div');

    const assignments = assignment.groups.map((group) => {
      const goToAmbient = document.createElement('button');
      // buscamos en todos los ambientes el ambiente donde se dicta ese curso
      const ambientWherGroupStudies = this.ambientsData.find((ambient) => {
        return ambient.ambient_id === group.ambient_id;
      });

      goToAmbient.addEventListener('click', () => {
        console.log('Navigate to ambient', ambientWherGroupStudies);
        this.map.flyToAmbient(ambientWherGroupStudies.ambient_id);
        // remove the results
        this.searchResultsElement.innerHTML = '';
      });

      const formattedSchedule = group.schedules.map((schedule) => {
        const day = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'][schedule.day - 1];
        const type = schedule.type === 'T' ? 'Teoría' : 'Práctica';
        const from = schedule.from.substring(0, 2) + ':' + schedule.from.substring(2, 4);
        const to = schedule.to.substring(0, 2) + ':' + schedule.to.substring(2, 4);
        return `${day} ${type} ${from} - ${to}`;
      }).join('<br>');

      goToAmbient.innerHTML = `
        <h4>${ambientWherGroupStudies.name}</h4>
        <p>${group.professor.Name}</p>
        <p>${formattedSchedule}</p>
      `;

      return goToAmbient;
    });

    assignments.forEach((assignment) => {
      container.appendChild(assignment);
    });

    return container;
  }

  renderAssignmentsResults(assignments) {
    const container = document.createElement('div');
    container.classList.add('search-result');
    container.classList.add('search-results-assignments');

    const assignmentsElements = assignments.map((assignment) => {
      console.log({ assignment })
      return this.createAssingmentResult(assignment);
    });

    console.log({ assignmentsElements });

    assignmentsElements.forEach((assignmentElement) => {
      container.appendChild(assignmentElement);
    });

    return container;
  }
}
