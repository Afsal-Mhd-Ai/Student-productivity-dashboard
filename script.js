// ─── STATE ───────────────────────────────────────────────────────────────────
let state = {
  tasks: JSON.parse(localStorage.getItem('afsal_tasks') || '[]'),
  habits: JSON.parse(localStorage.getItem('afsal_habits') || JSON.stringify([
    {name:'Morning Run',color:'#00e5a0',days:[false,false,false,false,false,false,false]},
    {name:'DSA Practice',color:'#7c6bff',days:[false,false,false,false,false,false,false]},
    {name:'Read 30min',color:'#38bdf8',days:[false,false,false,false,false,false,false]},
    {name:'No Phone 1h',color:'#ffc43d',days:[false,false,false,false,false,false,false]},
    {name:'Cold Shower',color:'#ff6b6b',days:[false,false,false,false,false,false,false]},
  ])),
  finance: JSON.parse(localStorage.getItem('afsal_finance') || JSON.stringify([
    {cat:'Freelance Income',amt:3500,type:'income'},
    {cat:'College Expenses',amt:-800,type:'expense'},
    {cat:'Food & Transport',amt:-1200,type:'expense'},
    {cat:'Courses / Books',amt:-500,type:'expense'},
    {cat:'Savings',amt:1000,type:'income'},
  ])),
  pomoDuration: 25 * 60,
  pomoBreak: 5 * 60,
  pomoTime: 25 * 60,
  pomoRunning: false,
  pomoInterval: null,
  pomoSessions: parseInt(localStorage.getItem('afsal_pomo_sessions') || '0'),
  pomoMode: 'focus',
  streak: parseInt(localStorage.getItem('afsal_streak') || '1'),
};

const QUOTES = [
  {q:"The best time to plant a tree was 20 years ago. The second best time is now.", a:"Chinese Proverb"},
  {q:"An investment in knowledge pays the best interest.", a:"Benjamin Franklin"},
  {q:"You don't have to be great to start, but you have to start to be great.", a:"Zig Ziglar"},
  {q:"The secret of getting ahead is getting started.", a:"Mark Twain"},
  {q:"Success is the sum of small efforts repeated day in and day out.", a:"Robert Collier"},
  {q:"Don't watch the clock; do what it does. Keep going.", a:"Sam Levenson"},
  {q:"Opportunities don't happen. You create them.", a:"Chris Grosser"},
  {q:"It always seems impossible until it's done.", a:"Nelson Mandela"},
  {q:"The harder you work for something, the greater you'll feel when you achieve it.", a:"Unknown"},
  {q:"Push yourself, because no one else is going to do it for you.", a:"Unknown"},
  {q:"Great things never come from comfort zones.", a:"Neil Strauss"},
  {q:"Dream it. Wish it. Do it.", a:"Unknown"},
];

const AI_FEED = [
  [
    {topic:'Claude Sonnet 4.6',source:'Anthropic · 2025',desc:'Anthropic releases Sonnet 4.6 with improved reasoning and faster response times, now powering Claude.ai.'},
    {topic:'Gemini 2.0 Flash',source:'Google · 2025',desc:'Google launches Flash 2.0 with 1M token context and real-time multimodal capabilities.'}
  ],
  [
    {topic:'GPT-5 Benchmarks',source:'OpenAI · 2025',desc:'GPT-5 achieves PhD-level performance on science and math benchmarks, outperforming human experts.'},
    {topic:'LLM on Mobile',source:'Meta AI · 2025',desc:'Llama 3 running fully on-device on Android — 7B model inference at 30 tok/s with no internet required.'}
  ],
  [
    {topic:'n8n AI Nodes',source:'n8n.io · 2025',desc:'n8n adds native AI agent nodes — build autonomous workflows with Claude or GPT without writing code.'},
    {topic:'India AI Mission',source:'GoI · 2025',desc:'10,000 Cr IndiaAI mission announced — compute infrastructure, startup grants, GPU access for students.'}
  ],
];

// ─── INIT ────────────────────────────────────────────────────────────────────
function init() {
  updateClock();
  setInterval(updateClock, 1000);
  renderQuote();
  renderTasks();
  renderExams();
  renderHabits();
  renderFinance();
  renderAIFeed();
  updateStats();
  updatePomoUI();
  document.getElementById('streak-count').textContent = state.streak;
  document.getElementById('pomo-session-count').textContent = 'Sessions today: ' + state.pomoSessions;
  document.getElementById('pomo-status').textContent = '🍅 ' + state.pomoSessions + ' sessions';
  const focusHours = (state.pomoSessions * 25 / 60).toFixed(1);
  document.getElementById('stat-focus').textContent = focusHours + 'h';
}

// ─── CLOCK ───────────────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const h = now.getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = greet + ', Afsal 👋';
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('date-line').textContent =
    days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear() + ' · BTech CSE Year 3';
  document.getElementById('live-clock').textContent =
    now.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'});
}

// ─── QUOTE ───────────────────────────────────────────────────────────────────
function renderQuote() {
  const idx = new Date().getDate() % QUOTES.length;
  document.getElementById('daily-quote').textContent = '"' + QUOTES[idx].q + '"';
  document.getElementById('quote-author').textContent = '— ' + QUOTES[idx].a + ' · Daily Fuel';
}

// ─── TASKS ───────────────────────────────────────────────────────────────────
function renderTasks() {
  const list = document.getElementById('task-list');
  const today = todayKey();
  const todayTasks = state.tasks.filter(function(t) { return t.date === today; });

  if (todayTasks.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:20px 0;color:var(--muted);font-size:12px;font-family:var(--mono)">No tasks yet. Add your first task! 💪</div>';
  } else {
    list.innerHTML = todayTasks.map(function(t) {
      return '<div class="task-item" onclick="toggleTask(\'' + t.id + '\')">' +
        '<div class="task-cb ' + (t.done ? 'done' : '') + '"></div>' +
        '<div class="task-text ' + (t.done ? 'done' : '') + '">' + t.text + '</div>' +
        '<div class="task-tag tag-' + t.tag + '">' + tagLabel(t.tag) + '</div>' +
        '<div onclick="event.stopPropagation();deleteTask(\'' + t.id + '\')" style="color:var(--muted);font-size:12px;cursor:pointer;padding:2px 6px;border-radius:4px;" title="Delete">✕</div>' +
        '</div>';
    }).join('');
  }

  updateStats();

  const pending = todayTasks.filter(function(t) { return !t.done; }).length;
  const badge = document.getElementById('task-count-badge');
  badge.textContent = pending;
  badge.style.display = pending > 0 ? 'inline' : 'none';
}

function tagLabel(tag) {
  var map = {cse:'💻 CSE', exam:'📚 Exam', biz:'🚀 Biz', ai:'🤖 AI', life:'❤️ Life'};
  return map[tag] || tag;
}

function toggleTask(id) {
  var t = state.tasks.find(function(t) { return t.id === id; });
  if (t) {
    t.done = !t.done;
    save();
    renderTasks();
  }
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(function(t) { return t.id !== id; });
  save();
  renderTasks();
}

function openAddTask() {
  document.getElementById('task-input').value = '';
  openModal('task-modal');
  setTimeout(function() { document.getElementById('task-input').focus(); }, 100);
}

function saveTask() {
  var text = document.getElementById('task-input').value.trim();
  if (!text) return;
  var tag = document.getElementById('task-tag-select').value;
  state.tasks.push({
    id: Date.now().toString(),
    text: text,
    tag: tag,
    done: false,
    date: todayKey()
  });
  save();
  renderTasks();
  closeModal('task-modal');
}

// ─── EXAMS ───────────────────────────────────────────────────────────────────
function renderExams() {
  var exams = [
    {name:'GATE CS 2026', date:'2026-02-01', color:'var(--accent4)'},
    {name:'SSC CGL 2025', date:'2025-09-15', color:'var(--accent2)'},
    {name:'Kerala PSC',   date:'2025-12-01', color:'var(--accent)'},
    {name:'TIFR GS',      date:'2025-12-08', color:'var(--accent5)'},
  ];
  var now = new Date();
  document.getElementById('exam-list').innerHTML = exams.map(function(e) {
    var diff = Math.ceil((new Date(e.date) - now) / (1000 * 60 * 60 * 24));
    var color = diff < 30 ? 'var(--accent3)' : diff < 90 ? 'var(--accent4)' : e.color;
    if (e.name === 'GATE CS 2026') {
      document.getElementById('stat-gate').textContent = diff > 0 ? diff : '—';
    }
    return '<div class="exam-item">' +
      '<div><div class="exam-name">' + e.name + '</div><div class="exam-date">' + e.date + '</div></div>' +
      '<div class="exam-days"><div class="n" style="color:' + color + '">' + (diff > 0 ? diff : '✓') + '</div><div class="u">days left</div></div>' +
      '</div>';
  }).join('');
}

// ─── HABITS ──────────────────────────────────────────────────────────────────
function renderHabits() {
  var days = ['M','T','W','T','F','S','S'];
  document.getElementById('habit-list').innerHTML = state.habits.map(function(h, hi) {
    return '<div class="habit-row">' +
      '<div class="habit-name">' + h.name.split(' ')[0] + '</div>' +
      '<div class="habit-dots">' +
      h.days.map(function(d, di) {
        return '<div class="habit-dot ' + (d ? 'done' : '') + '" ' +
          'style="' + (d ? 'background:' + h.color + ';border-color:' + h.color : '') + '" ' +
          'title="' + days[di] + '" ' +
          'onclick="toggleHabit(' + hi + ',' + di + ')"></div>';
      }).join('') +
      '</div></div>';
  }).join('');

  var today = new Date().getDay();
  var todayIdx = today === 0 ? 6 : today - 1;
  var done = state.habits.filter(function(h) { return h.days[todayIdx]; }).length;
  var pct = Math.round(done / state.habits.length * 100);
  document.getElementById('stat-habits').textContent = pct + '%';
  document.getElementById('habit-streak-label').textContent =
    pct === 100 ? '🔥 Perfect day!' : pct >= 50 ? '💪 Keep pushing' : '⚡ Start habits';
}

function toggleHabit(hi, di) {
  state.habits[hi].days[di] = !state.habits[hi].days[di];
  localStorage.setItem('afsal_habits', JSON.stringify(state.habits));
  renderHabits();
}

// ─── FINANCE ─────────────────────────────────────────────────────────────────
function renderFinance() {
  var net = 0;
  document.getElementById('finance-list').innerHTML = state.finance.map(function(f) {
    net += f.amt;
    return '<div class="finance-row">' +
      '<div class="finance-cat">' + f.cat + '</div>' +
      '<div class="finance-amt ' + f.type + '">' +
      (f.amt > 0 ? '+ ₹' + f.amt : '- ₹' + Math.abs(f.amt)) +
      '</div></div>';
  }).join('');
  var netEl = document.getElementById('net-balance');
  netEl.textContent = (net >= 0 ? '+ ₹' : '- ₹') + Math.abs(net);
  netEl.style.color = net >= 0 ? 'var(--accent2)' : 'var(--accent3)';
}

// ─── AI FEED ─────────────────────────────────────────────────────────────────
function renderAIFeed() {
  AI_FEED.forEach(function(col, i) {
    document.getElementById('ai-feed-' + (i + 1)).innerHTML = col.map(function(item) {
      return '<div class="ai-item">' +
        '<div class="ai-item-head"><div class="ai-dot"></div><div class="ai-topic">' + item.topic + '</div></div>' +
        '<div class="ai-source">' + item.source + '</div>' +
        '<div class="ai-desc" style="margin-top:4px">' + item.desc + '</div>' +
        '</div>';
    }).join('');
  });
}

// ─── POMODORO ────────────────────────────────────────────────────────────────
function togglePomo() {
  if (state.pomoRunning) {
    clearInterval(state.pomoInterval);
    state.pomoRunning = false;
    document.getElementById('pomo-start-btn').textContent = 'Resume';
  } else {
    state.pomoRunning = true;
    document.getElementById('pomo-start-btn').textContent = 'Pause';
    state.pomoInterval = setInterval(tickPomo, 1000);
  }
}

function tickPomo() {
  state.pomoTime--;
  if (state.pomoTime <= 0) {
    clearInterval(state.pomoInterval);
    state.pomoRunning = false;
    if (state.pomoMode === 'focus') {
      state.pomoSessions++;
      localStorage.setItem('afsal_pomo_sessions', state.pomoSessions);
      var focusHours = (state.pomoSessions * 25 / 60).toFixed(1);
      document.getElementById('stat-focus').textContent = focusHours + 'h';
      document.getElementById('pomo-status').textContent = '🍅 ' + state.pomoSessions + ' sessions';
      document.getElementById('pomo-session-count').textContent = 'Sessions today: ' + state.pomoSessions;
      state.pomoMode = 'break';
      state.pomoTime = state.pomoBreak;
      document.getElementById('pomo-mode-label').textContent = '☕ Break Time';
      document.getElementById('pomo-start-btn').textContent = 'Start Break';
      alert('🍅 Focus session done! Take a 5-min break.');
    } else {
      state.pomoMode = 'focus';
      state.pomoTime = state.pomoDuration;
      document.getElementById('pomo-mode-label').textContent = '🎯 Focus Session';
      document.getElementById('pomo-start-btn').textContent = 'Start Focus';
    }
  }
  updatePomoUI();
}

function resetPomo() {
  clearInterval(state.pomoInterval);
  state.pomoRunning = false;
  state.pomoMode = 'focus';
  state.pomoTime = state.pomoDuration;
  document.getElementById('pomo-start-btn').textContent = 'Start';
  document.getElementById('pomo-mode-label').textContent = '🎯 Focus Session';
  updatePomoUI();
}

function updatePomoUI() {
  var m = Math.floor(state.pomoTime / 60).toString().padStart(2, '0');
  var s = (state.pomoTime % 60).toString().padStart(2, '0');
  document.getElementById('pomo-display').textContent = m + ':' + s;
  var total = state.pomoMode === 'focus' ? state.pomoDuration : state.pomoBreak;
  var pct = state.pomoTime / total;
  var circumference = 314;
  var ring = document.getElementById('pomo-ring');
  ring.style.strokeDashoffset = circumference * (1 - pct);
  ring.style.stroke = state.pomoMode === 'focus' ? 'var(--accent)' : 'var(--accent2)';
}

// ─── STATS ───────────────────────────────────────────────────────────────────
function updateStats() {
  var today = todayKey();
  var todayTasks = state.tasks.filter(function(t) { return t.date === today; });
  var done = todayTasks.filter(function(t) { return t.done; }).length;
  document.getElementById('stat-tasks').textContent = todayTasks.length;
  document.getElementById('stat-tasks-done').textContent = '↑ ' + done + ' completed';
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function save() {
  localStorage.setItem('afsal_tasks', JSON.stringify(state.tasks));
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function setPage(page) {
  document.querySelectorAll('.nav-item').forEach(function(el) {
    el.classList.remove('active');
  });
  event.target.closest('.nav-item').classList.add('active');
}

// ─── MODAL CLOSE ON OVERLAY CLICK ────────────────────────────────────────────
document.getElementById('task-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal('task-modal');
});

// ─── ENTER KEY ON TASK INPUT ─────────────────────────────────────────────────
document.getElementById('task-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') saveTask();
});

// ─── RUN ─────────────────────────────────────────────────────────────────────
init();
