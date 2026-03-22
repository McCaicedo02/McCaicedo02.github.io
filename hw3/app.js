const quakeForm = document.getElementById('quakeForm');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const minMagnitudeInput = document.getElementById('minMagnitude');
const searchButton = document.getElementById('searchButton');
const formStatus = document.getElementById('formStatus');
const resultsMeta = document.getElementById('resultsMeta');
const results = document.getElementById('results');
const matchCount = document.getElementById('matchCount');
const topMagnitude = document.getElementById('topMagnitude');
const averageMagnitude = document.getElementById('averageMagnitude');
const latestEvent = document.getElementById('latestEvent');
const insightMessage = document.getElementById('insightMessage');
const startDateMessage = document.getElementById('startDateMessage');
const endDateMessage = document.getElementById('endDateMessage');
const magnitudeMessage = document.getElementById('magnitudeMessage');
const quickPickButtons = document.querySelectorAll('.quick-picks__button');

function formatDateForInput(date) {
  return date.toISOString().split('T')[0];
}

function getTodayString() {
  return formatDateForInput(new Date());
}

function setDefaultDates() {
  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7);

  endDateInput.max = formatDateForInput(today);
  startDateInput.max = formatDateForInput(today);
  endDateInput.value = formatDateForInput(today);
  startDateInput.value = formatDateForInput(lastWeek);
}

function setFieldMessage(input, messageElement, message, type = '') {
  messageElement.textContent = message;
  messageElement.className = type ? `field-message ${type}` : 'field-message';
  input.classList.toggle('invalid', type === 'error');
}

function validateDateInputs() {
  let isValid = true;
  const todayString = getTodayString();

  if (!startDateInput.value) {
    setFieldMessage(startDateInput, startDateMessage, 'Start date is required.', 'error');
    isValid = false;
  } else {
    setFieldMessage(startDateInput, startDateMessage, 'Start date looks good.', 'success');
  }

  if (!endDateInput.value) {
    setFieldMessage(endDateInput, endDateMessage, 'End date is required.', 'error');
    isValid = false;
  } else {
    setFieldMessage(endDateInput, endDateMessage, 'End date looks good.', 'success');
  }

  if (endDateInput.value && endDateInput.value > todayString) {
    setFieldMessage(endDateInput, endDateMessage, 'End date cannot be after today.', 'error');
    isValid = false;
  }

  if (startDateInput.value && startDateInput.value > todayString) {
    setFieldMessage(startDateInput, startDateMessage, 'Start date cannot be after today.', 'error');
    isValid = false;
  }

  if (startDateInput.value && endDateInput.value && startDateInput.value > endDateInput.value) {
    setFieldMessage(startDateInput, startDateMessage, 'Start date must be before end date.', 'error');
    setFieldMessage(endDateInput, endDateMessage, 'End date must be after start date.', 'error');
    isValid = false;
  }

  return isValid;
}

function validateMagnitudeInput() {
  const value = Number(minMagnitudeInput.value);

  if (minMagnitudeInput.value === '' || Number.isNaN(value)) {
    setFieldMessage(minMagnitudeInput, magnitudeMessage, 'Magnitude is required.', 'error');
    return false;
  }

  if (value < 0 || value > 10) {
    setFieldMessage(minMagnitudeInput, magnitudeMessage, 'Use a value between 0.0 and 10.0.', 'error');
    return false;
  }

  setFieldMessage(minMagnitudeInput, magnitudeMessage, 'Magnitude filter is valid.', 'success');
  return true;
}

function validateForm() {
  const datesAreValid = validateDateInputs();
  const magnitudeIsValid = validateMagnitudeInput();
  return datesAreValid && magnitudeIsValid;
}

function setLoadingState(isLoading) {
  searchButton.disabled = isLoading;
  searchButton.textContent = isLoading ? 'Loading...' : 'Run search';
}

function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function formatDepth(depth) {
  return `${depth.toFixed(1)} km deep`;
}

function renderEmptyState(title, message) {
  results.innerHTML = `
    <article class="empty-state">
      <p class="empty-state__title">${title}</p>
      <p class="empty-state__copy">${message}</p>
    </article>
  `;
}

function updateSummary(features) {
  if (features.length === 0) {
    matchCount.textContent = '0';
    topMagnitude.textContent = '--';
    averageMagnitude.textContent = '--';
    latestEvent.textContent = 'No events';
    insightMessage.textContent = 'No earthquakes matched your filters. Try a wider date range or lower minimum magnitude.';
    return;
  }

  const magnitudes = features.map((feature) => feature.properties.mag ?? 0);
  const strongest = Math.max(...magnitudes);
  const average = magnitudes.reduce((sum, value) => sum + value, 0) / magnitudes.length;
  const latestTimestamp = Math.max(...features.map((feature) => feature.properties.time));
  const strongestEvent = features.find((feature) => feature.properties.mag === strongest);

  matchCount.textContent = String(features.length);
  topMagnitude.textContent = strongest.toFixed(1);
  averageMagnitude.textContent = average.toFixed(1);
  latestEvent.textContent = formatDateTime(latestTimestamp);
  insightMessage.textContent = `${strongestEvent.properties.place} was the strongest event in this result set at magnitude ${strongest.toFixed(1)}.`;
}

function renderResults(features) {
  if (features.length === 0) {
    renderEmptyState(
      'No earthquakes found.',
      'There were no earthquake events matching this date range and minimum magnitude.'
    );
    return;
  }

  const cards = features
    .slice(0, 12)
    .map((feature) => {
      const { mag, place, time, url } = feature.properties;
      const [longitude, latitude, depth] = feature.geometry.coordinates;

      return `
        <article class="quake-card">
          <div class="quake-card__magnitude">
            <span>Magnitude</span>
            <strong>${mag?.toFixed(1) ?? 'N/A'}</strong>
          </div>
          <div>
            <h3>${place}</h3>
            <p class="quake-card__details">
              Recorded ${formatDateTime(time)}.<br />
              Depth: ${formatDepth(depth)}.<br />
              Coordinates: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}.
            </p>
          </div>
          <div class="quake-card__meta">
            <span>USGS event</span>
            <a class="quake-card__link" href="${url}" target="_blank" rel="noreferrer">Open details</a>
          </div>
        </article>
      `;
    })
    .join('');

  results.innerHTML = cards;
}

async function fetchEarthquakes() {
  const params = new URLSearchParams({
    format: 'geojson',
    starttime: startDateInput.value,
    endtime: endDateInput.value,
    minmagnitude: minMagnitudeInput.value,
    orderby: 'time'
  });

  const response = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Unable to retrieve earthquake data right now.');
  }

  return response.json();
}

async function handleSearch(event) {
  event.preventDefault();

  if (!validateForm()) {
    formStatus.textContent = 'Fix the highlighted fields before searching.';
    renderEmptyState('Search not ready.', 'Please correct the form inputs and run the search again.');
    return;
  }

  setLoadingState(true);
  formStatus.textContent = 'Loading earthquake data from the USGS API...';
  resultsMeta.textContent = 'Contacting the live earthquake feed.';

  try {
    const data = await fetchEarthquakes();
    const features = data.features ?? [];

    updateSummary(features);
    renderResults(features);

    formStatus.textContent = 'Earthquake data loaded successfully.';
    resultsMeta.textContent = `Showing ${Math.min(features.length, 12)} of ${features.length} matching earthquakes from ${startDateInput.value} to ${endDateInput.value}.`;
  } catch (error) {
    formStatus.textContent = error.message;
    resultsMeta.textContent = 'The request failed.';
    renderEmptyState(
      'Request failed.',
      'The USGS feed could not be loaded. Try again in a moment or change the search filters.'
    );
  } finally {
    setLoadingState(false);
  }
}

function applyQuickRange(days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  endDateInput.max = getTodayString();
  startDateInput.max = getTodayString();
  startDateInput.value = formatDateForInput(startDate);
  endDateInput.value = formatDateForInput(endDate);
  validateDateInputs();
  formStatus.textContent = `Date range updated to the past ${days} day${days === 1 ? '' : 's'}.`;
}

setDefaultDates();
validateDateInputs();
validateMagnitudeInput();

quakeForm.addEventListener('submit', handleSearch);
startDateInput.addEventListener('change', validateDateInputs);
endDateInput.addEventListener('change', validateDateInputs);
minMagnitudeInput.addEventListener('input', validateMagnitudeInput);

quickPickButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applyQuickRange(Number(button.dataset.days));
  });
});
