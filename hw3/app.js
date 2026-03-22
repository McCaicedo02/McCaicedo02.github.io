const quakeForm = document.getElementById('quakeForm');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const minMagnitudeInput = document.getElementById('minMagnitude');
const searchButton = document.getElementById('searchButton');
const resetButton = document.getElementById('resetButton');
const formStatus = document.getElementById('formStatus');
const resultsMeta = document.getElementById('resultsMeta');
const results = document.getElementById('results');
const regionFilter = document.getElementById('regionFilter');
const resultLimit = document.getElementById('resultLimit');
const matchCount = document.getElementById('matchCount');
const topMagnitude = document.getElementById('topMagnitude');
const averageMagnitude = document.getElementById('averageMagnitude');
const latestEvent = document.getElementById('latestEvent');
const insightMessage = document.getElementById('insightMessage');
const hazardMeterCard = document.getElementById('hazardMeterCard');
const hazardMeterValue = document.getElementById('hazardMeterValue');
const hazardMeterLabel = document.getElementById('hazardMeterLabel');
const startDateMessage = document.getElementById('startDateMessage');
const endDateMessage = document.getElementById('endDateMessage');
const magnitudeMessage = document.getElementById('magnitudeMessage');
const quickPickButtons = document.querySelectorAll('.quick-picks__button');
const heroMonitorScreen = document.getElementById('heroMonitorScreen');
const monitorEpicenter = document.getElementById('monitorEpicenter');
const waveformBars = Array.from(document.querySelectorAll('.waveform span'));
const monitorPrompt = document.getElementById('monitorPrompt');
const monitorHoverCue = document.getElementById('monitorHoverCue');
const randomQuakeButton = document.getElementById('randomQuakeButton');
const randomQuakeCard = document.getElementById('randomQuakeCard');
const randomQuakeTitle = document.getElementById('randomQuakeTitle');
const randomQuakeMeta = document.getElementById('randomQuakeMeta');
const randomQuakeFact = document.getElementById('randomQuakeFact');
const randomQuakeAction = document.getElementById('randomQuakeAction');

const majorEarthquakeEvents = [
  {
    title: 'Valdivia, Chile',
    year: '1960',
    magnitude: '9.5',
    detail: 'The strongest earthquake ever instrumentally recorded triggered tsunamis across the Pacific.'
  },
  {
    title: 'Prince William Sound, Alaska',
    year: '1964',
    magnitude: '9.2',
    detail: 'This Good Friday earthquake caused major ground failure, landslides, and a destructive tsunami.'
  },
  {
    title: 'Indian Ocean, Sumatra-Andaman',
    year: '2004',
    magnitude: '9.1',
    detail: 'A massive undersea rupture generated a tsunami that impacted countries across the Indian Ocean.'
  },
  {
    title: 'Tohoku, Japan',
    year: '2011',
    magnitude: '9.1',
    detail: 'The quake and tsunami devastated northeastern Japan and triggered the Fukushima nuclear disaster.'
  },
  {
    title: 'Maule, Chile',
    year: '2010',
    magnitude: '8.8',
    detail: 'One of the largest recorded Chilean earthquakes caused severe shaking and tsunami damage.'
  },
  {
    title: 'Kamchatka, Russia',
    year: '1952',
    magnitude: '9.0',
    detail: 'This giant subduction quake produced a Pacific-wide tsunami observed as far as Hawaii.'
  },
  {
    title: 'Lisbon, Portugal',
    year: '1755',
    magnitude: '8.5-9.0',
    detail: 'The quake, fires, and tsunami destroyed much of Lisbon and reshaped European disaster thinking.'
  },
  {
    title: 'San Francisco, California',
    year: '1906',
    magnitude: '7.9',
    detail: 'Fires after the rupture devastated the city and made this one of the most famous U.S. earthquakes.'
  },
  {
    title: 'Assam-Tibet',
    year: '1950',
    magnitude: '8.6',
    detail: 'Violent shaking triggered landslides across the Himalayas and altered river systems in the region.'
  },
  {
    title: 'Rat Islands, Alaska',
    year: '1965',
    magnitude: '8.7',
    detail: 'A major Aleutian subduction quake generated a tsunami that was recorded across the Pacific basin.'
  },
  {
    title: 'Chile-Argentina Border',
    year: '1894',
    magnitude: '8.5',
    detail: 'This powerful Andes earthquake damaged settlements over a wide area and was felt across western Argentina.'
  },
  {
    title: 'Arica, Peru',
    year: '1868',
    magnitude: '8.8',
    detail: 'A destructive tsunami followed the rupture and affected coastal communities far beyond South America.'
  },
  {
    title: 'Messina, Italy',
    year: '1908',
    magnitude: '7.1',
    detail: 'The quake and tsunami devastated Messina and Reggio Calabria, causing one of Europe\'s deadliest seismic disasters.'
  },
  {
    title: 'Tangshan, China',
    year: '1976',
    magnitude: '7.5',
    detail: 'This catastrophic urban earthquake caused immense destruction and remains one of the deadliest of the twentieth century.'
  }
];

let lastMajorEarthquakeIndex = -1;
let currentFeatures = [];

function getHazardLevel(magnitude) {
  if (!Number.isFinite(magnitude) || magnitude <= 0) {
    return {
      level: 0,
      name: 'Standby',
      detail: 'Awaiting signal from the live feed.'
    };
  }

  if (magnitude < 3) {
    return {
      level: 2,
      name: 'Advisory',
      detail: 'Low tremor energy detected.'
    };
  }

  if (magnitude < 5) {
    return {
      level: 3,
      name: 'Elevated',
      detail: 'Noticeable activity in the current set.'
    };
  }

  if (magnitude < 6.5) {
    return {
      level: 4,
      name: 'High',
      detail: 'Strong shaking potential in the strongest event.'
    };
  }

  return {
    level: 5,
    name: 'Critical',
    detail: 'Major seismic energy detected.'
  };
}

function updateHazardMeter(magnitude) {
  if (!hazardMeterCard || !hazardMeterValue || !hazardMeterLabel) {
    return;
  }

  const hazard = getHazardLevel(magnitude);
  hazardMeterCard.dataset.level = String(hazard.level);
  hazardMeterValue.textContent = hazard.name;
  hazardMeterLabel.textContent = hazard.detail;
}

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

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return entities[character];
  });
}

function getRegionName(place = '') {
  const parts = place
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return 'Unspecified region';
  }

  return parts[parts.length - 1];
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
    updateHazardMeter(0);
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
  updateHazardMeter(strongest);
}

function getMagnitudeTier(magnitude) {
  if (!Number.isFinite(magnitude)) {
    return {
      tone: 'unknown',
      label: 'Unrated'
    };
  }

  if (magnitude < 3.5) {
    return {
      tone: 'low',
      label: 'Light'
    };
  }

  if (magnitude < 5) {
    return {
      tone: 'medium',
      label: 'Elevated'
    };
  }

  if (magnitude < 6.5) {
    return {
      tone: 'high',
      label: 'Strong'
    };
  }

  return {
    tone: 'extreme',
    label: 'Severe'
  };
}

function renderResults(features) {
  if (features.length === 0) {
    renderEmptyState(
      'No earthquakes found.',
      'There were no earthquake events matching the current search and filter settings.'
    );
    return;
  }

  const limitValue = resultLimit?.value ?? '12';
  const visibleFeatures = limitValue === 'all' ? features : features.slice(0, Number(limitValue));

  const cards = visibleFeatures
    .map((feature) => {
      const { mag, place, time, url } = feature.properties;
      const [longitude, latitude, depth] = feature.geometry.coordinates;
      const tier = getMagnitudeTier(mag);
      const region = getRegionName(place);

      return `
        <article class="quake-card quake-card--${tier.tone}">
          <div class="quake-card__magnitude">
            <span>Magnitude</span>
            <strong>${mag?.toFixed(1) ?? 'N/A'}</strong>
          </div>
          <div class="quake-card__body">
            <h3>${place}</h3>
            <p class="quake-card__details">
              Recorded ${formatDateTime(time)}.
            </p>
            <div class="quake-card__chips">
              <span>${tier.label}</span>
              <span>${formatDepth(depth)}</span>
              <span>${escapeHtml(region)}</span>
              <span>${latitude.toFixed(2)}, ${longitude.toFixed(2)}</span>
            </div>
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

function populateRegionFilter(features) {
  if (!regionFilter) {
    return;
  }

  const regions = [...new Set(features.map((feature) => getRegionName(feature.properties.place)))].sort((a, b) =>
    a.localeCompare(b)
  );

  regionFilter.innerHTML = '<option value="all">All regions</option>';
  regions.forEach((region) => {
    regionFilter.insertAdjacentHTML(
      'beforeend',
      `<option value="${escapeHtml(region)}">${escapeHtml(region)}</option>`
    );
  });

  regionFilter.disabled = regions.length === 0;
}

function getFilteredFeatures() {
  if (!regionFilter || regionFilter.value === 'all') {
    return currentFeatures;
  }

  return currentFeatures.filter(
    (feature) => getRegionName(feature.properties.place) === regionFilter.value
  );
}

function updateResultsMeta(filteredFeatures) {
  const totalMatches = currentFeatures.length;
  const filteredMatches = filteredFeatures.length;
  const limitValue = resultLimit?.value ?? '12';
  const visibleMatches = limitValue === 'all' ? filteredMatches : Math.min(filteredMatches, Number(limitValue));
  const regionLabel =
    regionFilter && regionFilter.value !== 'all' ? ` in ${regionFilter.value}` : '';

  resultsMeta.textContent =
    `Showing ${visibleMatches} of ${filteredMatches} filtered earthquakes` +
    `${regionLabel}. ${totalMatches} total matches from ${startDateInput.value} to ${endDateInput.value}.`;
}

function updateResultsView() {
  const filteredFeatures = getFilteredFeatures();
  updateSummary(filteredFeatures);
  renderResults(filteredFeatures);
  updateResultsMeta(filteredFeatures);
}

function resetResultsControls() {
  if (regionFilter) {
    regionFilter.innerHTML = '<option value="all">All regions</option>';
    regionFilter.value = 'all';
    regionFilter.disabled = true;
  }

  if (resultLimit) {
    resultLimit.value = '12';
    resultLimit.disabled = true;
  }

  if (resetButton) {
    resetButton.disabled = true;
  }
}

function resetSearchExperience() {
  currentFeatures = [];
  updateSummary([]);
  resetResultsControls();
  renderEmptyState(
    'Your results will appear here.',
    'Try a 7-day search with magnitude 4.5 or higher to start with a useful data set.'
  );
  formStatus.textContent = 'Detected earthquakes cleared. Your search filters are unchanged.';
  resultsMeta.textContent = 'No search performed yet.';
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
    currentFeatures = data.features ?? [];

    populateRegionFilter(currentFeatures);

    if (resultLimit) {
      resultLimit.disabled = currentFeatures.length === 0;
    }

    if (resetButton) {
      resetButton.disabled = currentFeatures.length === 0;
    }

    updateResultsView();

    formStatus.textContent = 'Earthquake data loaded successfully.';
  } catch (error) {
    currentFeatures = [];
    formStatus.textContent = error.message;
    resultsMeta.textContent = 'The request failed.';
    renderEmptyState(
      'Request failed.',
      'The USGS feed could not be loaded. Try again in a moment or change the search filters.'
    );
    updateSummary([]);
    resetResultsControls();
    if (resetButton) {
      resetButton.disabled = true;
    }
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

function showRandomMajorEarthquake() {
  if (!randomQuakeFact || !randomQuakeTitle || !randomQuakeMeta) {
    return;
  }

  let eventIndex = Math.floor(Math.random() * majorEarthquakeEvents.length);

  if (majorEarthquakeEvents.length > 1) {
    while (eventIndex === lastMajorEarthquakeIndex) {
      eventIndex = Math.floor(Math.random() * majorEarthquakeEvents.length);
    }
  }

  lastMajorEarthquakeIndex = eventIndex;
  const event = majorEarthquakeEvents[eventIndex];
  randomQuakeTitle.textContent = event.title;
  randomQuakeMeta.textContent = `${event.year} · Magnitude ${event.magnitude}`;
  randomQuakeFact.textContent = event.detail;

  if (randomQuakeAction) {
    randomQuakeAction.textContent = 'Click again for another historic quake.';
  }
}

function initializeMonitor() {
  if (!heroMonitorScreen || !monitorEpicenter || waveformBars.length === 0) {
    return;
  }

  const baseHeights = [16, 22, 30, 24, 42, 28, 54, 34, 66, 38, 58, 30, 46, 26, 36, 22];
  let motion = 0;
  let pointerX = 0.5;
  let pointerY = 0.5;
  let lastX = 0.5;
  let lastY = 0.5;
  let isActive = false;
  let hasInteracted = false;
  let animationFrameId = 0;

  function updateBars() {
    waveformBars.forEach((bar, index) => {
      const spread = waveformBars.length > 1 ? index / (waveformBars.length - 1) : 0.5;
      const distance = Math.abs(spread - pointerX);
      const proximity = Math.max(0, 1 - distance * 2.35);
      const verticalLift = Math.max(0.2, 1 - pointerY * 0.75);
      const pulse = Math.sin(performance.now() / 120 + index * 0.8) * 0.5 + 0.5;
      const quakeBoost = proximity * (42 + motion * 26) * verticalLift;
      const height = Math.min(94, baseHeights[index] + quakeBoost + pulse * 8);
      const glow = Math.min(0.9, 0.24 + proximity * 0.4 + motion * 0.12);

      bar.style.setProperty('--bar-height', `${height}%`);
      bar.style.setProperty('--bar-scale', `${1 + proximity * 0.16 + motion * 0.05}`);
      bar.style.setProperty('--bar-glow', glow.toFixed(2));
      bar.style.boxShadow = `0 0 ${12 + proximity * 18 + motion * 8}px rgba(255, 106, 61, ${0.26 + glow * 0.28})`;
    });
  }

  function animateMonitor() {
    motion *= isActive ? 0.92 : 0.88;

    if (!isActive) {
      pointerX += (0.5 - pointerX) * 0.08;
      pointerY += (0.62 - pointerY) * 0.08;
    }

    heroMonitorScreen.style.setProperty('--monitor-tilt-x', `${(pointerX - 0.5) * 8}`);
    heroMonitorScreen.style.setProperty('--monitor-tilt-y', `${(0.5 - pointerY) * 6}`);
    heroMonitorScreen.style.setProperty('--monitor-shift-x', `${(Math.random() - 0.5) * motion * 7}px`);
    heroMonitorScreen.style.setProperty('--monitor-shift-y', `${(Math.random() - 0.5) * motion * 10}px`);
    heroMonitorScreen.style.setProperty('--epicenter-x', `${(pointerX * 100).toFixed(2)}%`);
    heroMonitorScreen.style.setProperty('--epicenter-y', `${(pointerY * 100).toFixed(2)}%`);
    heroMonitorScreen.style.setProperty('--epicenter-opacity', `${Math.min(0.92, 0.16 + motion * 0.24)}`);
    heroMonitorScreen.style.setProperty('--epicenter-scale', `${0.72 + motion * 0.1}`);
    heroMonitorScreen.style.setProperty('--monitor-invite-opacity', hasInteracted ? '0.08' : '0.45');

    updateBars();

    animationFrameId = window.requestAnimationFrame(animateMonitor);
  }

  heroMonitorScreen.addEventListener('pointerenter', () => {
    isActive = true;
    if (monitorPrompt) {
      monitorPrompt.textContent = 'Shake the cursor to drive live signal spikes';
    }
    if (monitorHoverCue) {
      monitorHoverCue.classList.remove('is-hidden');
    }
  });

  heroMonitorScreen.addEventListener('pointermove', (event) => {
    const bounds = heroMonitorScreen.getBoundingClientRect();
    const nextX = (event.clientX - bounds.left) / bounds.width;
    const nextY = (event.clientY - bounds.top) / bounds.height;

    pointerX = Math.min(1, Math.max(0, nextX));
    pointerY = Math.min(1, Math.max(0, nextY));

    const deltaX = pointerX - lastX;
    const deltaY = pointerY - lastY;
    motion = Math.min(3.2, motion + Math.hypot(deltaX, deltaY) * 22);
    lastX = pointerX;
    lastY = pointerY;

    if (!hasInteracted && motion > 0.5) {
      hasInteracted = true;

      if (monitorPrompt) {
        monitorPrompt.textContent = 'Live seismic simulation active';
        monitorPrompt.classList.add('is-hidden');
      }

      if (monitorHoverCue) {
        monitorHoverCue.classList.add('is-hidden');
      }
    }
  });

  heroMonitorScreen.addEventListener('pointerleave', () => {
    isActive = false;

    if (!hasInteracted && monitorPrompt) {
      monitorPrompt.textContent = 'Hover here and shake the cursor to spike the bars';
    }

    if (!hasInteracted && monitorHoverCue) {
      monitorHoverCue.classList.remove('is-hidden');
    }
  });

  monitorEpicenter.setAttribute('aria-hidden', 'true');
  updateBars();
  animationFrameId = window.requestAnimationFrame(animateMonitor);

  window.addEventListener('beforeunload', () => {
    window.cancelAnimationFrame(animationFrameId);
  });
}

setDefaultDates();
validateDateInputs();
validateMagnitudeInput();
updateHazardMeter(0);
initializeMonitor();
resetResultsControls();

if (resetButton) {
  resetButton.disabled = true;
}

quakeForm.addEventListener('submit', handleSearch);
startDateInput.addEventListener('change', validateDateInputs);
endDateInput.addEventListener('change', validateDateInputs);
minMagnitudeInput.addEventListener('input', validateMagnitudeInput);

if (resetButton) {
  resetButton.addEventListener('click', resetSearchExperience);
}

if (randomQuakeButton) {
  randomQuakeButton.addEventListener('click', showRandomMajorEarthquake);
}

if (randomQuakeCard) {
  randomQuakeCard.addEventListener('click', showRandomMajorEarthquake);
  randomQuakeCard.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      showRandomMajorEarthquake();
    }
  });
}

if (regionFilter) {
  regionFilter.addEventListener('change', updateResultsView);
}

if (resultLimit) {
  resultLimit.addEventListener('change', updateResultsView);
}

quickPickButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applyQuickRange(Number(button.dataset.days));
  });
});
