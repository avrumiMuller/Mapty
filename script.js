'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const workout = [];

class Workout {
  date = new Date();
  id = String(Date.now()).slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; //km'
    this.duration = duration; // nin'
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.name[0].toUpperCase()}${this.name.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDay()}`;
  }
}

class Running extends Workout {
  name = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace(); // in min
    this._setDescription();
  }

  calcPace() {
    this.pace = (this.duration / this.distance).toFixed(2);
    return this.pace;
  }
}

class Cycling extends Workout {
  name = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed(); // in hours
    this._setDescription();
  }

  calcSpeed() {
    this.speed = (this.distance / (this.duration / 60)).toFixed(2);
    return this.speed;
  }
}

class Map {
  #map;
  #mapEvent;
  #workout = [];
  #mapZoomLevel = 13;

  constructor() {
    this._getPosition();

    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._muveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap./copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Hndling clicks on maps
    this.#map.on('click', this._showForm.bind(this));

    this.#workout.forEach(el => this.renderWorkoutMarker(el));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // prettier-ignore
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    // Get dade from form
    const { lat, lng } = this.#mapEvent.latlng;
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const elevationGain = inputElevation.value;
    const cadence = +inputCadence.value;
    let workoutObj;

    // check if date is valid
    if (
      distance > 0 &&
      duration > 0 &&
      ((Number.isFinite(+elevationGain) && elevationGain !== '') || cadence > 0)
    ) {
      // If workout is running create a ranning object
      if (type === 'running') {
        workoutObj = new Running([lat, lng], distance, duration, cadence);
      }

      // If workout is sycling create a sycling object
      if (type === 'cycling') {
        workoutObj = new Cycling([lat, lng], distance, duration, elevationGain);
      }

      // Add new object to workout array
      this.#workout.push(workoutObj);
      // this._setLocalStorage();

      // Render workout on the map
      this.renderWorkoutMarker(workoutObj);

      // Render workout on list
      this._renderWorkout(workoutObj);

      // Hide form + clear input fields
      this._hideForm();

      // set local storage to all workouts
      this._setLocalStorage();

      // if date isn't valid
    } else {
      alert('Inputs have to be positive numbers!');
    }
  }

  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          minWidth: 100,
          maxWidth: 250,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.name}-popup`,
        })
      )
      .setPopupContent(
        `${workout.name === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    const html = `
      <li class="workout workout--${workout.name}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.name === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }
          </span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${
            workout.name === 'running' ? workout.pace : workout.speed
          }
          </span>
          <span class="workout__unit">${
            workout.name === 'running' ? 'min/km' : 'km/h'
          }
          </span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.name === 'running' ? '🦶🏼' : '⛰'
          }</span>
          <span class="workout__value">${
            workout.name === 'running' ? workout.cadence : workout.elevationGain
          }</span>
          <span class="workout__unit">${
            workout.name === 'running' ? 'spm' : 'm'
          }</span>
        </div>
      </li>`;

    document.querySelector('form').insertAdjacentHTML('afterend', html);
  }

  _muveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const clickedWorkout = this.#workout.find(
      el => el.id === workoutEl.dataset.id
    );
    console.log(clickedWorkout);

    this.#map.setView(clickedWorkout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workout));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));

    if (!data) return;

    this.#workout = data;

    this.#workout.forEach(el => this._renderWorkout(el));
  }

  reset() {
    localStorage.removeItem('workout');
    location.reload();
  }
}

const app = new Map();
