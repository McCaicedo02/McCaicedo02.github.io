const quizForm = document.getElementById('quizForm');
const scoreBadge = document.getElementById('scoreBadge');
const scoreText = document.getElementById('scoreText');
const scoreBar = document.getElementById('scoreBar');
const congratsMessage = document.getElementById('congratsMessage');
const timesTakenEl = document.getElementById('timesTaken');
const lastScoreEl = document.getElementById('lastScore');
const q10Value = document.getElementById('q10Value');
const sparkleLayer = document.getElementById('sparkleLayer');

const TIMES_KEY = 'usGeoQuizTimes';
const LAST_SCORE_KEY = 'usGeoQuizLastScore';

const questionConfig = [
  {
    id: 'q1',
    type: 'radio',
    correct: 'sacramento',
    answerText: 'Sacramento',
  },
  {
    id: 'q2',
    type: 'radio',
    correct: 'florida',
    answerText: 'Florida',
  },
  {
    id: 'q3',
    type: 'radio',
    correct: 'alaska',
    answerText: 'Alaska',
  },
  {
    id: 'q4',
    type: 'radio',
    correct: 'gulf-of-mexico',
    answerText: 'Gulf of Mexico',
  },
  {
    id: 'q5',
    type: 'radio',
    correct: 'arizona',
    answerText: 'Arizona',
  },
  {
    id: 'q6',
    type: 'checkbox',
    correct: ['california', 'oregon', 'washington'],
    answerText: 'California, Oregon, Washington',
  },
  {
    id: 'q7',
    type: 'select',
    correct: 'eastern',
    answerText: 'Eastern',
  },
  {
    id: 'q8',
    type: 'text',
    correct: (value) => {
      const normalized = normalizeText(value);
      return (
        normalized === 'denali' ||
        normalized === 'mount mckinley' ||
        normalized === 'mt mckinley' ||
        normalized === 'mt. mckinley'
      );
    },
    answerText: 'Denali (Mount McKinley)',
  },
  {
    id: 'q9',
    type: 'number',
    correct: 4,
    answerText: '4',
  },
  {
    id: 'q10',
    type: 'range',
    correct: 5,
    answerText: '5',
  },
];

const correctIcon = createIcon(
  '#2e9a6f',
  'M15.8 23.2 9.6 17l2-2.1 4.2 4.3 8.6-9 2.2 2.1z'
);
const wrongIcon = createIcon(
  '#d7475b',
  'M11.2 11.2 24.8 24.8M24.8 11.2 11.2 24.8'
);

function createIcon(color, path) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="17" fill="${color}" opacity="0.15" />
      <circle cx="18" cy="18" r="13" fill="${color}" opacity="0.9" />
      <path d="${path}" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function normalizeText(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function updateTimesTaken() {
  const timesTaken = Number(localStorage.getItem(TIMES_KEY) || 0);
  timesTakenEl.textContent = timesTaken;
}

function updateLastScore() {
  const lastScore = localStorage.getItem(LAST_SCORE_KEY);
  lastScoreEl.textContent = lastScore ? `${lastScore} / 100` : '--';
}

function shuffleChoices() {
  document.querySelectorAll('[data-shuffle="true"]').forEach((container) => {
    const items = Array.from(container.children);
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    items.forEach((item) => container.appendChild(item));
  });
}

function setFeedback(id, isCorrect, answerText, detailText = '') {
  const feedback = document.getElementById(`feedback-${id}`);
  if (!feedback) return;

  const img = feedback.querySelector('img');
  const text = feedback.querySelector('span');

  feedback.classList.remove('d-none', 'is-correct', 'is-wrong');
  feedback.classList.add(isCorrect ? 'is-correct' : 'is-wrong');

  if (img) {
    img.src = isCorrect ? correctIcon : wrongIcon;
    img.alt = isCorrect ? 'Correct' : 'Incorrect';
  }

  if (text) {
    const detail = detailText ? ` ${detailText}` : '';
    text.textContent = isCorrect
      ? 'Correct!'
      : `Incorrect. Correct answer: ${answerText}.${detail}`;
  }
}

function gradeQuestion(config) {
  const { id, type, correct, answerText } = config;
  let isCorrect = false;
  let detailText = '';

  if (type === 'radio') {
    const selected = quizForm.querySelector(`input[name="${id}"]:checked`);
    if (selected) {
      isCorrect = selected.value === correct;
    } else {
      detailText = ' No answer selected.';
    }
  }

  if (type === 'checkbox') {
    const selected = Array.from(quizForm.querySelectorAll(`input[name="${id}"]:checked`))
      .map((input) => input.value)
      .sort();
    const correctSorted = [...correct].sort();
    if (selected.length) {
      isCorrect =
        selected.length === correctSorted.length &&
        selected.every((value, index) => value === correctSorted[index]);
    } else {
      detailText = ' No answer selected.';
    }
  }

  if (type === 'select') {
    const selected = quizForm.querySelector(`#${id}`).value;
    if (selected) {
      isCorrect = selected === correct;
    } else {
      detailText = ' No answer selected.';
    }
  }

  if (type === 'text') {
    const value = quizForm.querySelector(`#${id}`).value;
    if (value.trim()) {
      isCorrect = typeof correct === 'function' ? correct(value) : normalizeText(value) === correct;
    } else {
      detailText = ' No answer selected.';
    }
  }

  if (type === 'number') {
    const value = quizForm.querySelector(`#${id}`).value;
    if (value !== '') {
      isCorrect = Number(value) === correct;
    } else {
      detailText = ' No answer selected.';
    }
  }

  if (type === 'range') {
    const value = quizForm.querySelector(`#${id}`).value;
    if (value !== '') {
      isCorrect = Number(value) === correct;
    }
  }

  setFeedback(id, isCorrect, answerText, detailText);
  return isCorrect;
}

function handleSubmit(event) {
  event.preventDefault();
  let score = 0;

  questionConfig.forEach((config) => {
    if (gradeQuestion(config)) {
      score += 10;
    }
  });

  scoreBadge.textContent = score;
  scoreText.textContent = `Your total score is ${score} / 100.`;
  scoreBar.style.width = `${score}%`;
  scoreBar.textContent = `${score}%`;

  if (score > 80) {
    congratsMessage.classList.remove('d-none');
  } else {
    congratsMessage.classList.add('d-none');
  }

  const timesTaken = Number(localStorage.getItem(TIMES_KEY) || 0) + 1;
  localStorage.setItem(TIMES_KEY, timesTaken);
  localStorage.setItem(LAST_SCORE_KEY, String(score));
  updateTimesTaken();
  updateLastScore();
}

function handleReset() {
  document.querySelectorAll('.feedback').forEach((feedback) => {
    feedback.classList.add('d-none');
    feedback.classList.remove('is-correct', 'is-wrong');
  });
  scoreBadge.textContent = '0';
  scoreText.textContent = 'Submit the quiz to see your score.';
  scoreBar.style.width = '0%';
  scoreBar.textContent = '0%';
  congratsMessage.classList.add('d-none');
  q10Value.textContent = '5';
}

quizForm.addEventListener('submit', handleSubmit);
quizForm.addEventListener('reset', handleReset);

if (q10Value) {
  const rangeInput = document.getElementById('q10');
  rangeInput.addEventListener('input', () => {
    q10Value.textContent = rangeInput.value;
  });
}

shuffleChoices();
updateTimesTaken();
updateLastScore();

if (sparkleLayer && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let lastSparkleTime = 0;

  const spawnSparkle = (x, y) => {
    const now = performance.now();
    if (now - lastSparkleTime < 40) return;
    lastSparkleTime = now;

    const sparkle = document.createElement('span');
    sparkle.className = 'sparkle';
    const size = 6 + Math.random() * 10;
    sparkle.style.width = `${size}px`;
    sparkle.style.height = `${size}px`;
    sparkle.style.left = `${x - size / 2}px`;
    sparkle.style.top = `${y - size / 2}px`;
    sparkle.style.filter = `hue-rotate(${Math.random() * 20 - 10}deg)`;

    sparkleLayer.appendChild(sparkle);
    sparkle.addEventListener('animationend', () => sparkle.remove());
  };

  document.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse') {
      spawnSparkle(event.clientX, event.clientY);
    }
  });

  document.addEventListener('click', (event) => {
    for (let i = 0; i < 6; i += 1) {
      const offsetX = (Math.random() - 0.5) * 30;
      const offsetY = (Math.random() - 0.5) * 30;
      spawnSparkle(event.clientX + offsetX, event.clientY + offsetY);
    }
  });
}
