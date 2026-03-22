const unavailableUsernames = new Set([
  'admin',
  'root',
  'test',
  'guest',
  'student',
  'otter',
  'csumb',
  'cst336'
]);

let lastZipLookup = '';
let usernameIsAvailable = false;
let currentSuggestion = '';
let usernameCheckTimer = 0;
let lastUsernameChecked = '';
let expectedCountyFromZip = '';

const form = document.getElementById('signupForm');
const pageStatus = document.getElementById('pageStatus');
const statusModule = document.querySelector('.status-module');
const statusDetail = document.getElementById('statusDetail');
const statusAction = document.getElementById('statusAction');
const statusHint = document.getElementById('statusHint');
const statusBars = Array.from(document.querySelectorAll('.status-track__bar'));
const submitMessage = document.getElementById('submitMessage');
const firstNameField = document.getElementById('firstName');
const lastNameField = document.getElementById('lastName');
const usernameField = document.getElementById('username');
const usernameMessage = document.getElementById('usernameMessage');
const zipField = document.getElementById('zip');
const zipMessage = document.getElementById('zipMessage');
const stateField = document.getElementById('state');
const stateMessage = document.getElementById('stateMessage');
const countyField = document.getElementById('county');
const cityField = document.getElementById('city');
const longitudeField = document.getElementById('longitude');
const latitudeField = document.getElementById('latitude');
const passwordField = document.getElementById('password');
const passwordMessage = document.getElementById('passwordMessage');
const confirmPasswordField = document.getElementById('confirmPassword');
const confirmMessage = document.getElementById('confirmMessage');
const passwordSuggestion = document.getElementById('passwordSuggestion');
const submitButton = document.getElementById('submitButton');
const welcomePanel = document.getElementById('welcomePanel');
const welcomeTitle = document.getElementById('welcomeTitle');
const welcomeSummary = document.getElementById('welcomeSummary');

function setMessage(element, message, type = '') {
  element.textContent = message;
  element.className = type ? `message ${type}` : 'message';
}

function setSubmitMessage(message, type = '') {
  submitMessage.textContent = message;
  submitMessage.className = type ? `submit-message ${type}` : 'submit-message';
}

function markField(field, isValid) {
  field.classList.remove('valid', 'invalid');
  field.classList.add(isValid ? 'valid' : 'invalid');
}

function clearFieldState(field) {
  field.classList.remove('valid', 'invalid');
}

function updatePageStatus(message) {
  pageStatus.textContent = message;
  pageStatus.classList.remove('status-pill--ready', 'status-pill--error');

  if (message === 'Ready to submit' || message === 'Signup complete') {
    pageStatus.classList.add('status-pill--ready');
  }

  if (message === 'Form needs attention') {
    pageStatus.classList.add('status-pill--error');
  }
}

function fetchJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `jsonpCallback_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const script = document.createElement('script');
    const separator = url.includes('?') ? '&' : '?';

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    function cleanup() {
      delete window[callbackName];
      script.remove();
    }

    script.onerror = () => {
      cleanup();
      reject(new Error('JSONP request failed'));
    };

    script.src = `${url}${separator}format=jsonp&callback=${callbackName}`;
    document.body.appendChild(script);
  });
}

function getCompletionPercent(completed, total) {
  return `${Math.max(14, Math.round((completed / total) * 100))}%`;
}

function getFormProgress() {
  const identityChecks = [
    { label: 'first name', done: firstNameField.value.trim() !== '', fieldId: 'firstName' },
    { label: 'last name', done: lastNameField.value.trim() !== '', fieldId: 'lastName' },
    {
      label: 'username check',
      done: usernameField.value.trim() !== '' && usernameIsAvailable,
      fieldId: 'username'
    }
  ];
  const locationChecks = [
    {
      label: 'ZIP lookup',
      done: zipField.value.length === 5 && cityField.value && longitudeField.value && latitudeField.value,
      fieldId: 'zip'
    },
    { label: 'state', done: stateField.value !== '', fieldId: 'state' },
    {
      label: expectedCountyFromZip ? 'county match' : 'county',
      done:
        countyField.value !== '' &&
        (!expectedCountyFromZip || countyField.value === expectedCountyFromZip),
      fieldId: 'county'
    }
  ];
  const securityChecks = [
    {
      label: 'password setup',
      done:
        passwordField.value.length >= 6 &&
        confirmPasswordField.value !== '' &&
        passwordField.value === confirmPasswordField.value,
      fieldId: 'password'
    }
  ];

  const allChecks = [...identityChecks, ...locationChecks, ...securityChecks];
  const pending = allChecks.filter((check) => !check.done);

  return {
    isReady: pending.length === 0,
    pending,
    firstIncompleteId: pending[0]?.fieldId ?? 'submitButton',
    identityPercent: getCompletionPercent(
      identityChecks.filter((check) => check.done).length,
      identityChecks.length
    ),
    locationPercent: getCompletionPercent(
      locationChecks.filter((check) => check.done).length,
      locationChecks.length
    ),
    securityPercent: getCompletionPercent(
      securityChecks.filter((check) => check.done).length,
      securityChecks.length
    )
  };
}

function syncStatusPanel() {
  const progress = getFormProgress();
  const hintItems = progress.pending.slice(0, 3).map((check) => check.label);

  statusBars[0]?.style.setProperty('--status-fill', progress.identityPercent);
  statusBars[1]?.style.setProperty('--status-fill', progress.locationPercent);
  statusBars[2]?.style.setProperty('--status-fill', progress.securityPercent);

  statusModule.classList.toggle('is-ready', progress.isReady);
  statusAction.classList.toggle('status-cta--ready', progress.isReady);

  if (progress.isReady) {
    updatePageStatus('Ready to submit');
    statusDetail.textContent = 'All profile checks are green. You can launch straight to the final submit button.';
    statusHint.textContent = 'Ready to submit. Jump down and finish the signup.';
    statusAction.textContent = 'Go to submit';
    return;
  }

  statusDetail.textContent = `Profile scan in progress. ${progress.pending.length} checkpoint${progress.pending.length === 1 ? '' : 's'} left before launch.`;
  statusHint.textContent = `Still needed: ${hintItems.join(', ')}.`;
  statusAction.textContent = `Fix ${progress.pending[0].label}`;
}

function normalizeCountyName(countyName) {
  return countyName
    .split(',')[0]
    .replace(/\s+(County|Parish|Borough|Census Area|Municipality)$/u, '')
    .trim();
}

async function autoSelectCountyFromCoordinates() {
  if (!longitudeField.value || !latitudeField.value || !stateField.value) {
    return;
  }

  try {
    const data = await fetchJsonp(
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${encodeURIComponent(longitudeField.value)}&y=${encodeURIComponent(latitudeField.value)}&benchmark=Public_AR_Current&vintage=Current_Current&layers=Counties`
    );

    const countyName = data?.result?.geographies?.Counties?.[0]?.NAME;

    if (!countyName) {
      return;
    }

    const normalizedCounty = normalizeCountyName(countyName);
    const matchingOption = Array.from(countyField.options).find(
      (option) => option.value === normalizedCounty
    );

    expectedCountyFromZip = normalizedCounty;

    if (!matchingOption) {
      return;
    }

    countyField.value = matchingOption.value;
    markField(countyField, true);
    setMessage(stateMessage, `${matchingOption.value} county selected automatically from ZIP.`, 'success');
  } catch (error) {
    // Leave county manual if the reverse lookup is unavailable.
  } finally {
    syncStatusPanel();
  }
}

function jumpToField(fieldId) {
  const field = document.getElementById(fieldId);

  if (!field) {
    return;
  }

  field.scrollIntoView({ behavior: 'smooth', block: 'center' });

  window.setTimeout(() => {
    field.focus({ preventScroll: true });
  }, 250);

  const fieldLabel =
    field.closest('.field')?.querySelector('span')?.textContent ?? field.name ?? 'Field';

  updatePageStatus(`${fieldLabel} ready`);
}

function jumpToSubmitButton() {
  submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });

  window.setTimeout(() => {
    submitButton.focus({ preventScroll: true });
  }, 250);
}

function jumpToSection(sectionId) {
  const target = document.getElementById(sectionId);

  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  window.setTimeout(() => {
    document.getElementById('firstName')?.focus({ preventScroll: true });
  }, 300);

  updatePageStatus('Signup form ready');
}

function handleStatusAction() {
  const progress = getFormProgress();

  if (form.classList.contains('hidden')) {
    welcomePanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    updatePageStatus('Signup complete');
    return;
  }

  if (progress.isReady) {
    jumpToSubmitButton();
    updatePageStatus('Ready to submit');
    return;
  }

  jumpToField(progress.firstIncompleteId);
  updatePageStatus(`Needs ${progress.pending[0].label}`);
}

async function populateStates() {
  stateField.innerHTML = '<option value="">Loading states...</option>';
  setMessage(stateMessage, 'Select a state to load counties.', '');

  try {
    const response = await fetch('https://api.census.gov/data/2020/dec/pl?get=NAME&for=state:*');

    if (!response.ok) {
      throw new Error('Unable to load states');
    }

    const data = await response.json();
    const states = data
      .slice(1)
      .map((row) => ({
        name: row[0],
        fips: row[1]
      }))
      .sort((first, second) => first.name.localeCompare(second.name));

    stateField.innerHTML = '<option value="">Select a state</option>';

    for (const state of states) {
      const option = document.createElement('option');
      option.value = state.name;
      option.textContent = state.name;
      option.dataset.fips = state.fips;
      stateField.appendChild(option);
    }

    setMessage(stateMessage, 'Select a state to load counties.', '');
  } catch (error) {
    stateField.innerHTML = '<option value="">Unable to load states</option>';
    setMessage(stateMessage, 'State list could not be loaded right now.', 'error');
    updatePageStatus('State load failed');
  }

  syncStatusPanel();
}

async function handleZipInput() {
  const zip = zipField.value.replace(/\D/g, '').slice(0, 5);
  zipField.value = zip;

  if (zip.length < 5) {
    lastZipLookup = '';
    cityField.value = '';
    longitudeField.value = '';
    latitudeField.value = '';
    clearFieldState(zipField);
    setMessage(zipMessage, 'Enter a full 5-digit ZIP code.', '');
    updatePageStatus('Waiting for ZIP lookup');
    syncStatusPanel();
    return;
  }

  if (zip === lastZipLookup) {
    return;
  }

  lastZipLookup = zip;
  expectedCountyFromZip = '';
  setMessage(zipMessage, 'Checking ZIP code...', 'warning');
  updatePageStatus('Looking up ZIP');

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zip}`);

    if (!response.ok) {
      throw new Error('ZIP not found');
    }

    const data = await response.json();
    const place = data.places?.[0];

    cityField.value = place?.['place name'] ?? '';
    longitudeField.value = place?.longitude ?? '';
    latitudeField.value = place?.latitude ?? '';

    setMessage(zipMessage, 'ZIP code found.', 'success');
    markField(zipField, true);

    if (data['post code']) {
      const stateName = place?.state ?? '';

      if (stateName) {
        stateField.value = stateName;
        await handleStateChange();
        await autoSelectCountyFromCoordinates();
      }
    }

    updatePageStatus('ZIP verified');
  } catch (error) {
    expectedCountyFromZip = '';
    cityField.value = '';
    longitudeField.value = '';
    latitudeField.value = '';
    markField(zipField, false);
    setMessage(zipMessage, 'ZIP code not found. Please enter a valid U.S. ZIP.', 'error');
    updatePageStatus('ZIP lookup failed');
  }

  syncStatusPanel();
}

async function handleStateChange() {
  const selectedOption = stateField.selectedOptions[0];
  const stateAbbreviation = stateField.value;

  countyField.innerHTML = '<option value="">Loading counties...</option>';

  if (!stateAbbreviation || !selectedOption?.dataset.fips) {
    countyField.innerHTML = '<option value="">Select a state first</option>';
    clearFieldState(stateField);
    setMessage(stateMessage, 'Select a state to load counties.', '');
    syncStatusPanel();
    return;
  }

  markField(stateField, true);
  setMessage(stateMessage, `Loading counties for ${selectedOption.textContent}...`, 'warning');
  updatePageStatus('Loading county list');

  try {
    const response = await fetch(
      `https://api.census.gov/data/2020/dec/pl?get=NAME&for=county:*&in=state:${selectedOption.dataset.fips}`
    );

    if (!response.ok) {
      throw new Error('Unable to load counties');
    }

    const data = await response.json();
    const counties = data
      .slice(1)
      .map((row) => normalizeCountyName(row[0]))
      .sort((first, second) => first.localeCompare(second));

    countyField.innerHTML = '<option value="">Select a county</option>';

    for (const county of counties) {
      const option = document.createElement('option');
      option.value = county;
      option.textContent = county;
      countyField.appendChild(option);
    }

    setMessage(stateMessage, `${counties.length} counties loaded successfully.`, 'success');
    updatePageStatus('County list ready');

    if (countyField.value && expectedCountyFromZip && countyField.value !== expectedCountyFromZip) {
      setMessage(stateMessage, `County does not match the ZIP code. Choose ${expectedCountyFromZip}.`, 'error');
    }
  } catch (error) {
    countyField.innerHTML = '<option value="">Unable to load counties</option>';
    markField(stateField, false);
    setMessage(stateMessage, 'County list could not be loaded right now.', 'error');
    updatePageStatus('County load failed');
  }

  syncStatusPanel();
}

function validateCountySelection() {
  if (!countyField.value) {
    clearFieldState(countyField);
    syncStatusPanel();
    return false;
  }

  if (expectedCountyFromZip && countyField.value !== expectedCountyFromZip) {
    markField(countyField, false);
    setMessage(stateMessage, `County does not match the ZIP code. Choose ${expectedCountyFromZip}.`, 'error');
    syncStatusPanel();
    return false;
  }

  markField(countyField, true);
  setMessage(stateMessage, 'County selected.', 'success');
  syncStatusPanel();
  return true;
}

function resetUsernameState() {
  window.clearTimeout(usernameCheckTimer);
  usernameIsAvailable = false;
  lastUsernameChecked = '';
  clearFieldState(usernameField);
  setMessage(usernameMessage, 'Availability will appear here.', '');
  syncStatusPanel();
}

function handleUsernameInput() {
  resetUsernameState();

  const username = usernameField.value.trim().toLowerCase();

  if (!username) {
    return;
  }

  if (username.length < 4) {
    setMessage(usernameMessage, 'Username must be at least 4 characters long.', 'error');
    markField(usernameField, false);
    syncStatusPanel();
    return;
  }

  setMessage(usernameMessage, 'Checking username availability...', 'warning');
  usernameCheckTimer = window.setTimeout(() => {
    checkUsernameAvailability();
  }, 300);
}

async function checkUsernameAvailability() {
  const username = usernameField.value.trim().toLowerCase();

  if (!username) {
    setMessage(usernameMessage, 'Enter a username first.', '');
    clearFieldState(usernameField);
    syncStatusPanel();
    return;
  }

  if (username.length < 4) {
    setMessage(usernameMessage, 'Username must be at least 4 characters long.', 'error');
    markField(usernameField, false);
    syncStatusPanel();
    return;
  }

  if (username === lastUsernameChecked && usernameIsAvailable) {
    setMessage(usernameMessage, 'That username is available.', 'success');
    markField(usernameField, true);
    syncStatusPanel();
    return;
  }

  setMessage(usernameMessage, 'Checking username availability...', 'warning');
  updatePageStatus('Checking username');

  await new Promise((resolve) => {
    window.setTimeout(resolve, 350);
  });

  const taken =
    unavailableUsernames.has(username) ||
    /\d{4,}$/u.test(username) ||
    username.includes('taken') ||
    username.startsWith('user');

  usernameIsAvailable = !taken;
  lastUsernameChecked = username;

  if (taken) {
    setMessage(usernameMessage, 'That username is unavailable. Please choose another.', 'error');
    markField(usernameField, false);
    updatePageStatus('Username unavailable');
    syncStatusPanel();
    return;
  }

  setMessage(usernameMessage, 'That username is available.', 'success');
  markField(usernameField, true);
  updatePageStatus('Username available');
  syncStatusPanel();
}

function generatePasswordSuggestion() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*?';
  const allCharacters = upper + lower + digits + symbols;
  let suggestion = '';

  suggestion += upper[Math.floor(Math.random() * upper.length)];
  suggestion += lower[Math.floor(Math.random() * lower.length)];
  suggestion += digits[Math.floor(Math.random() * digits.length)];
  suggestion += symbols[Math.floor(Math.random() * symbols.length)];

  while (suggestion.length < 12) {
    suggestion += allCharacters[Math.floor(Math.random() * allCharacters.length)];
  }

  currentSuggestion = suggestion
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');

  passwordSuggestion.textContent = currentSuggestion;
}

function showPasswordSuggestion() {
  if (!currentSuggestion) {
    generatePasswordSuggestion();
  }

  setMessage(passwordMessage, 'Suggested password generated. You can use it or type your own.', 'success');
  updatePageStatus('Password suggestion ready');
  syncStatusPanel();
}

function applySuggestedPassword() {
  if (!currentSuggestion) {
    generatePasswordSuggestion();
  }

  passwordField.value = currentSuggestion;
  confirmPasswordField.value = currentSuggestion;
  validatePasswords();
  syncStatusPanel();
}

function validatePasswords() {
  const password = passwordField.value;
  const confirmation = confirmPasswordField.value;
  let valid = true;

  if (password.length < 6) {
    setMessage(passwordMessage, 'Password must be at least 6 characters long.', 'error');
    markField(passwordField, false);
    valid = false;
  } else {
    setMessage(passwordMessage, 'Password length looks good.', 'success');
    markField(passwordField, true);
  }

  if (!confirmation) {
    setMessage(confirmMessage, 'Retype the password to confirm it.', '');
    clearFieldState(confirmPasswordField);
    valid = false;
  } else if (password !== confirmation) {
    setMessage(confirmMessage, 'Passwords do not match.', 'error');
    markField(confirmPasswordField, false);
    valid = false;
  } else {
    setMessage(confirmMessage, 'Passwords match.', 'success');
    markField(confirmPasswordField, true);
  }

  syncStatusPanel();
  return valid;
}

function validateRequiredField(field) {
  const hasValue = field.value.trim() !== '';
  markField(field, hasValue);
  return hasValue;
}

function validateSelectField(field) {
  const hasValue = field.value !== '';
  markField(field, hasValue);
  return hasValue;
}

function handleSubmit(event) {
  event.preventDefault();

  const requiredFieldsAreValid = [
    validateRequiredField(document.getElementById('firstName')),
    validateRequiredField(document.getElementById('lastName')),
    validateRequiredField(usernameField),
    validateRequiredField(zipField),
    validateSelectField(stateField),
    validateSelectField(countyField)
  ].every(Boolean);

  const passwordsValid = validatePasswords();

  if (!usernameIsAvailable) {
    setMessage(usernameMessage, 'Please choose an available username before submitting.', 'error');
    markField(usernameField, false);
  }

  const locationIsValid = cityField.value && longitudeField.value && latitudeField.value;
  const countyMatchesZip = validateCountySelection();

  if (!locationIsValid) {
    setMessage(zipMessage, 'A valid ZIP code is required to populate city and coordinates.', 'error');
    markField(zipField, false);
  }

  if (
    !requiredFieldsAreValid ||
    !passwordsValid ||
    !usernameIsAvailable ||
    !locationIsValid ||
    !countyMatchesZip
  ) {
    setSubmitMessage('Please fix the highlighted fields and try again.', 'error');
    updatePageStatus('Form needs attention');
    pageStatus.classList.add('status-pill--error');
    syncStatusPanel();
    return;
  }

  const firstName = document.getElementById('firstName').value.trim();
  const county = countyField.value;
  const city = cityField.value;
  const state = stateField.value;

  form.classList.add('hidden');
  welcomePanel.classList.remove('hidden');
  welcomeTitle.textContent = `Welcome, ${firstName}!`;
  welcomeSummary.textContent =
    `${usernameField.value.trim()} is ready to go. Your profile was created for ${city}, ${state} in ${county}.`;

  setSubmitMessage('Signup complete.', 'success');
  updatePageStatus('Signup complete');
  statusModule.classList.add('is-ready');
  statusDetail.textContent = 'Profile creation complete. Your account packet is active and ready to go.';
  statusHint.textContent = 'Signup complete. Use the button above to jump back to this summary.';
  statusAction.textContent = 'View welcome';
  statusAction.classList.add('status-cta--ready');
  pageStatus.classList.add('status-pill--ready');
}

function resetFormState() {
  lastZipLookup = '';
  usernameIsAvailable = false;
  currentSuggestion = '';
  expectedCountyFromZip = '';
  form.classList.remove('hidden');
  welcomePanel.classList.add('hidden');

  for (const field of form.querySelectorAll('input, select')) {
    clearFieldState(field);
  }

  cityField.value = '';
  longitudeField.value = '';
  latitudeField.value = '';
  passwordSuggestion.textContent = 'Click inside the password field';
  countyField.innerHTML = '<option value="">Select a state first</option>';

  setMessage(usernameMessage, 'Availability will appear here.', '');
  setMessage(zipMessage, 'Enter a 5-digit ZIP code.', '');
  setMessage(stateMessage, 'Select a state to load counties.', '');
  setMessage(passwordMessage, 'Password must be at least 6 characters.', '');
  setMessage(confirmMessage, 'Retype the same password.', '');
  setSubmitMessage('Complete the form to create your profile.', '');
  updatePageStatus('Ready to validate');
  pageStatus.classList.remove('status-pill--ready', 'status-pill--error');
  statusAction.classList.remove('status-cta--ready');
  syncStatusPanel();
}

function startAnotherSignup() {
  form.reset();
  resetFormState();
  populateStates();
}

populateStates();
resetFormState();

for (const field of form.querySelectorAll('input, select')) {
  field.addEventListener('input', syncStatusPanel);
  field.addEventListener('change', syncStatusPanel);
}

countyField.addEventListener('change', validateCountySelection);
