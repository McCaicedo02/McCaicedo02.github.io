const states = [
  { name: 'Alabama', abbreviation: 'AL', fips: '01' },
  { name: 'Alaska', abbreviation: 'AK', fips: '02' },
  { name: 'Arizona', abbreviation: 'AZ', fips: '04' },
  { name: 'Arkansas', abbreviation: 'AR', fips: '05' },
  { name: 'California', abbreviation: 'CA', fips: '06' },
  { name: 'Colorado', abbreviation: 'CO', fips: '08' },
  { name: 'Connecticut', abbreviation: 'CT', fips: '09' },
  { name: 'Delaware', abbreviation: 'DE', fips: '10' },
  { name: 'Florida', abbreviation: 'FL', fips: '12' },
  { name: 'Georgia', abbreviation: 'GA', fips: '13' },
  { name: 'Hawaii', abbreviation: 'HI', fips: '15' },
  { name: 'Idaho', abbreviation: 'ID', fips: '16' },
  { name: 'Illinois', abbreviation: 'IL', fips: '17' },
  { name: 'Indiana', abbreviation: 'IN', fips: '18' },
  { name: 'Iowa', abbreviation: 'IA', fips: '19' },
  { name: 'Kansas', abbreviation: 'KS', fips: '20' },
  { name: 'Kentucky', abbreviation: 'KY', fips: '21' },
  { name: 'Louisiana', abbreviation: 'LA', fips: '22' },
  { name: 'Maine', abbreviation: 'ME', fips: '23' },
  { name: 'Maryland', abbreviation: 'MD', fips: '24' },
  { name: 'Massachusetts', abbreviation: 'MA', fips: '25' },
  { name: 'Michigan', abbreviation: 'MI', fips: '26' },
  { name: 'Minnesota', abbreviation: 'MN', fips: '27' },
  { name: 'Mississippi', abbreviation: 'MS', fips: '28' },
  { name: 'Missouri', abbreviation: 'MO', fips: '29' },
  { name: 'Montana', abbreviation: 'MT', fips: '30' },
  { name: 'Nebraska', abbreviation: 'NE', fips: '31' },
  { name: 'Nevada', abbreviation: 'NV', fips: '32' },
  { name: 'New Hampshire', abbreviation: 'NH', fips: '33' },
  { name: 'New Jersey', abbreviation: 'NJ', fips: '34' },
  { name: 'New Mexico', abbreviation: 'NM', fips: '35' },
  { name: 'New York', abbreviation: 'NY', fips: '36' },
  { name: 'North Carolina', abbreviation: 'NC', fips: '37' },
  { name: 'North Dakota', abbreviation: 'ND', fips: '38' },
  { name: 'Ohio', abbreviation: 'OH', fips: '39' },
  { name: 'Oklahoma', abbreviation: 'OK', fips: '40' },
  { name: 'Oregon', abbreviation: 'OR', fips: '41' },
  { name: 'Pennsylvania', abbreviation: 'PA', fips: '42' },
  { name: 'Rhode Island', abbreviation: 'RI', fips: '44' },
  { name: 'South Carolina', abbreviation: 'SC', fips: '45' },
  { name: 'South Dakota', abbreviation: 'SD', fips: '46' },
  { name: 'Tennessee', abbreviation: 'TN', fips: '47' },
  { name: 'Texas', abbreviation: 'TX', fips: '48' },
  { name: 'Utah', abbreviation: 'UT', fips: '49' },
  { name: 'Vermont', abbreviation: 'VT', fips: '50' },
  { name: 'Virginia', abbreviation: 'VA', fips: '51' },
  { name: 'Washington', abbreviation: 'WA', fips: '53' },
  { name: 'West Virginia', abbreviation: 'WV', fips: '54' },
  { name: 'Wisconsin', abbreviation: 'WI', fips: '55' },
  { name: 'Wyoming', abbreviation: 'WY', fips: '56' }
];

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
    { label: 'county', done: countyField.value !== '', fieldId: 'county' }
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

function populateStates() {
  stateField.innerHTML = '<option value="">Select a state</option>';

  for (const state of states) {
    const option = document.createElement('option');
    option.value = state.abbreviation;
    option.textContent = state.name;
    option.dataset.fips = state.fips;
    stateField.appendChild(option);
  }
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
      const stateAbbreviation = place?.['state abbreviation'] ?? '';

      if (stateAbbreviation) {
        stateField.value = stateAbbreviation;
        await handleStateChange();
      }
    }

    updatePageStatus('ZIP verified');
  } catch (error) {
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
      .map((row) => row[0].replace(/\s+(County|Parish|Borough|Census Area|Municipality)$/u, ''))
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
  } catch (error) {
    countyField.innerHTML = '<option value="">Unable to load counties</option>';
    markField(stateField, false);
    setMessage(stateMessage, 'County list could not be loaded right now.', 'error');
    updatePageStatus('County load failed');
  }

  syncStatusPanel();
}

function resetUsernameState() {
  usernameIsAvailable = false;
  clearFieldState(usernameField);
  setMessage(usernameMessage, 'Availability will appear here.', '');
  syncStatusPanel();
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

  if (!locationIsValid) {
    setMessage(zipMessage, 'A valid ZIP code is required to populate city and coordinates.', 'error');
    markField(zipField, false);
  }

  if (!requiredFieldsAreValid || !passwordsValid || !usernameIsAvailable || !locationIsValid) {
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
