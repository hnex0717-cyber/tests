const questions = window.QUESTION_DATA;
const chapterLabels = {
  all: '전체 장',
  '1': '1장 · 데이터베이스 기본 개념',
  '2': '2장 · 데이터베이스 관리 시스템',
  '3': '3장 · 데이터베이스 시스템',
  '4': '4장 · 데이터 모델링',
  '5': '5장 · 관계 데이터 모델',
  '6': '6장 · 관계 데이터 연산',
  '7': '7장 · SQL'
};

let state = {
  filter: '1',
  index: 0,
  order: questions.map((_, index) => index),
  answers: {},
  random: false,
  wrongOnly: false
};

const $ = id => document.getElementById(id);
const escapeHtml = value => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[character]));

function visibleQuestions() {
  let list = state.order
    .map(index => ({ question: questions[index], index }))
    .filter(item => state.filter === 'all' || item.question.chapter === state.filter);
  if (state.wrongOnly) {
    list = list.filter(item => state.answers[item.question.id] !== undefined
      && state.answers[item.question.id] !== item.question.correct);
  }
  return list;
}

function questionPrompt(text) {
  const firstChoice = text.search(/[①②③④⑤⑥⑦⑧]/);
  return firstChoice >= 0 ? text.slice(0, firstChoice).trim() : text;
}

function render() {
  const list = visibleQuestions();
  $('questionCount').textContent = `${list.length}문제`;

  if (!list.length) {
    $('quizCard').innerHTML = '<div class="empty-state"><h3>복습할 오답이 없습니다.</h3><p>이 장의 문제를 먼저 풀어보세요.</p><button class="primary-button" onclick="clearWrongMode()">전체 문제 보기</button></div>';
    updateStats();
    return;
  }

  if (state.index >= list.length) state.index = 0;
  const item = list[state.index];
  const question = item.question;
  const selected = state.answers[question.id];
  const answered = selected !== undefined;

  $('chapterPill').textContent = chapterLabels[question.chapter];
  $('progressText').textContent = `${state.index + 1} / ${list.length}`;
  $('progressBar').style.width = `${((state.index + 1) / list.length) * 100}%`;
  $('questionNumber').textContent = `QUESTION ${String(state.index + 1).padStart(2, '0')}`;
  $('questionText').textContent = questionPrompt(question.text);
  $('answers').innerHTML = '';

  if (question.options.length) {
    question.options.forEach((text, index) => {
      const button = document.createElement('button');
      button.className = 'answer';
      button.type = 'button';
      button.disabled = answered;
      button.innerHTML = `<span class="answer-letter">${String.fromCharCode(65 + index)}</span><span>${text}</span>`;
      if (answered && index === question.correct) button.classList.add('correct');
      if (answered && index === selected && index !== question.correct) button.classList.add('incorrect');
      button.onclick = () => answer(question.id, index);
      $('answers').appendChild(button);
    });
  } else {
    const reveal = document.createElement('button');
    reveal.className = 'reveal-button';
    reveal.type = 'button';
    reveal.textContent = answered ? '정답 확인 완료' : '정답 및 해설 보기';
    reveal.disabled = answered;
    reveal.onclick = () => answer(question.id, -1);
    $('answers').appendChild(reveal);
  }

  $('feedback').hidden = !answered;
  $('feedback').innerHTML = answered
    ? `<strong>${question.correct >= 0 && selected === question.correct ? '정답입니다!' : '정답 및 해설'}</strong><br>${escapeHtml(question.answer).replace(/\n/g, '<br>')}`
    : '';
  $('prevButton').disabled = state.index === 0;
  $('nextButton').innerHTML = state.index === list.length - 1 ? '처음으로 <span>↺</span>' : '다음 문제 <span>→</span>';
  updateStats();
}

function answer(id, choice) {
  if (state.answers[id] !== undefined) return;
  state.answers[id] = choice;
  render();
}

function navigate(step) {
  const list = visibleQuestions();
  state.index = (state.index + step + list.length) % list.length;
  render();
}

function updateStats() {
  const chapterQuestions = questions.filter(question => state.filter === 'all' || question.chapter === state.filter);
  const ids = new Set(chapterQuestions.map(question => question.id));
  const entries = Object.entries(state.answers).filter(([id]) => ids.has(id));
  const answered = entries.length;
  const correct = entries.filter(([id, choice]) => questions.find(question => question.id === id).correct === choice).length;
  const completion = chapterQuestions.length ? Math.round(answered / chapterQuestions.length * 100) : 0;
  const score = answered ? Math.round(correct / answered * 100) : 0;
  $('solvedCount').textContent = answered;
  $('correctCount').textContent = correct;
  $('wrongCount').textContent = answered - correct;
  $('accuracy').textContent = answered ? `${score}%` : '0%';
  $('completionText').textContent = `${completion}%`;
  $('completionBar').style.width = `${completion}%`;
  $('completionMessage').textContent = completion === 100
    ? '이 장의 모든 문제를 풀었습니다. 훌륭해요!'
    : answered ? '이 장의 문제를 계속 풀어보세요.' : '이 장의 첫 문제를 풀어보세요.';
  $('bestScore').textContent = answered ? `${score}%` : '-';
}

function clearWrongMode() {
  state.wrongOnly = false;
  $('wrongOnlyButton').classList.remove('active');
  state.index = 0;
  render();
}

document.querySelectorAll('.filter').forEach(button => {
  button.onclick = () => {
    document.querySelectorAll('.filter').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    state.filter = button.dataset.chapter;
    state.wrongOnly = false;
    state.index = 0;
    $('wrongOnlyButton').classList.remove('active');
    render();
  };
});

$('nextButton').onclick = () => navigate(1);
$('prevButton').onclick = () => navigate(-1);
$('wrongOnlyButton').onclick = () => {
  state.wrongOnly = !state.wrongOnly;
  state.index = 0;
  $('wrongOnlyButton').classList.toggle('active', state.wrongOnly);
  render();
};
$('startButton').onclick = () => {
  state.wrongOnly = false;
  state.index = 0;
  $('wrongOnlyButton').classList.remove('active');
  render();
};
$('randomStartButton').onclick = () => {
  const chapterIndexes = questions
    .map((question, index) => ({ question, index }))
    .filter(item => state.filter === 'all' || item.question.chapter === state.filter)
    .map(item => item.index);
  const rest = state.order.filter(index => !chapterIndexes.includes(index));
  chapterIndexes.sort(() => Math.random() - 0.5);
  state.order = chapterIndexes.concat(rest);
  state.wrongOnly = false;
  state.index = 0;
  $('wrongOnlyButton').classList.remove('active');
  render();
};
$('randomToggle').onchange = event => {
  state.random = event.target.checked;
  if (state.random) state.order.sort(() => Math.random() - 0.5);
  else state.order = questions.map((_, index) => index);
  state.index = 0;
  render();
};
$('themeToggle').onclick = () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('db-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
};
$('resetButton').onclick = () => {
  state.answers = {};
  render();
};

state.answers = {};
document.querySelectorAll('.filter').forEach(button => {
  button.classList.toggle('active', button.dataset.chapter === state.filter);
});
if (localStorage.getItem('db-theme') === 'dark') document.body.classList.add('dark');
render();
