let completedSessions = 0;
let totalWorkSeconds = 0;

const completedSessionsEl = document.getElementById("completedSessions");
const totalTimeEl = document.getElementById("totalTime");
const notification = document.getElementById("notification");

const STORAGE_KEY = "kdb_pomodoro_state";

const darkModeSwitch = document.getElementById("darkModeSwitch");
const THEME_KEY = "kdb_pomodoro_theme";

const durations = {
  work: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const workInput = document.getElementById("workInput");
const shortInput = document.getElementById("shortInput");
const longInput = document.getElementById("longInput");
const resetSettingsBtn = document.getElementById("resetSettingsBtn");

let sessionType = "work";
let sessionCount = 1;

function getCurrentDuration() {
  return durations[sessionType];
}

let timeLeft = getCurrentDuration();
let timerId = null;

const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const progressBar = document.getElementById("progressBar");
const sessionLabel = document.getElementById("sessionLabel");

function updateDisplay() {
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;

  const total = getCurrentDuration();
  const percent = ((total - timeLeft) / total) * 100;
  progressBar.style.width = `${percent}%`;
}

function updateSessionLabel() {
  if (sessionType === "work") {
    sessionLabel.textContent = `Work Session • ${sessionCount}`;
    completedSessions++;
    totalWorkSeconds += durations.work;
    updateStats();
  } else if (sessionType === "short") {
    sessionLabel.textContent = `Short Break`;
  } else {
    sessionLabel.textContent = `Long Break`;
  }
}

function startTimer() {
  if (timerId !== null) return;

  updateDurationsFromInput();

  if (timeLeft <= 0 || timeLeft > getCurrentDuration()) {
    timeLeft = getCurrentDuration();
    updateDisplay();
  }

  timerId = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateDisplay();
    } else {
      clearInterval(timerId);
      timerId = null;

      if (sessionType === "work") {
        completedSessions++;
        totalWorkSeconds += durations.work;
        updateStats();

        sessionCount++;
        sessionType = sessionCount % 5 === 0 ? "long" : "short";
      } else {
        sessionType = "work";
      }

      updateDurationsFromInput();
      timeLeft = getCurrentDuration();
      updateSessionLabel();
      updateDisplay();
      playBeep();
      showNotification();
      startTimer();
    }
  }, 1000);

  startBtn.disabled = true;
  pauseBtn.disabled = false;
}

function pauseTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }
}

function resetTimer() {
  clearInterval(timerId);
  timerId = null;
  sessionType = "work";
  sessionCount = 1;
  updateDurationsFromInput();
  timeLeft = getCurrentDuration();
  updateSessionLabel();
  updateDisplay();
  progressBar.style.width = "0%";
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  //
  completedSessions = 0;
  totalWorkSeconds = 0;
  updateStats();
}

function updateStats() {
  completedSessionsEl.textContent = completedSessions;
  const hours = Math.floor(totalWorkSeconds / 3600);
  const minutes = Math.floor((totalWorkSeconds % 3600) / 60);
  totalTimeEl.textContent = `${hours}h ${minutes}m`;
  saveState();
}

function updateDurationsFromInput() {
  durations.work = parseInt(workInput.value, 10) * 60;
  durations.short = parseInt(shortInput.value, 10) * 60;
  durations.long = parseInt(longInput.value, 10) * 60;
  saveState();
}

function showNotification() {
  notification.classList.add("show");
  setTimeout(() => {
    notification.classList.remove("show");
  }, 2000);
}
//
function playBeep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, ctx.currentTime);
  oscillator.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.2);
}

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
//
resetSettingsBtn.addEventListener("click", () => {
  workInput.value = 25;
  shortInput.value = 5;
  longInput.value = 15;
  updateDurationsFromInput();
  resetTimer();
  saveState();
});

function saveState() {
  const state = {
    durations: {
      work: parseInt(workInput.value, 10),
      short: parseInt(shortInput.value, 10),
      long: parseInt(longInput.value, 10),
    },
    stats: {
      completedSessions,
      totalWorkSeconds,
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;

  try {
    const parsed = JSON.parse(stored);
    if (parsed.durations) {
      workInput.value = parsed.durations.work;
      shortInput.value = parsed.durations.short;
      longInput.value = parsed.durations.long;
      updateDurationsFromInput();
    }
    if (parsed.stats) {
      completedSessions = parsed.stats.completedSessions || 0;
      totalWorkSeconds = parsed.stats.totalWorkSeconds || 0;
      updateStats();
    }
  } catch (err) {
    console.warn("Could not parse saved state:", err);
  }
  timeLeft = getCurrentDuration();
  updateDisplay();
}

function applyTheme(mode) {
  document.body.classList.toggle("dark", mode === "dark");
  darkModeSwitch.checked = mode === "dark";
}

function saveTheme(mode) {
  localStorage.setItem(THEME_KEY, mode);
}

darkModeSwitch.addEventListener("change", () => {
  const mode = darkModeSwitch.checked ? "dark" : "light";
  applyTheme(mode);
  saveTheme(mode);
});

loadState();
updateDisplay();
updateSessionLabel();
updateStats();
const savedTheme = localStorage.getItem(THEME_KEY) || "light";
applyTheme(savedTheme);
