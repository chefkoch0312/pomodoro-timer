"use strict";

/* ==================== Konfiguration ==================== */
const STORAGE_KEY = "kdb_pomodoro_state";
const THEME_KEY = "kdb_pomodoro_theme";

/* ==================== Zustände ==================== */
let sessionType = "work";
let sessionCount = 1;
let completedSessions = 0;
let totalWorkSeconds = 0;
let timeLeft = 0;
let timerId = null;

const durations = {
  work: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

/* ==================== DOM-Elemente ==================== */
const timerDisplay = document.getElementById("timer");
const sessionLabel = document.getElementById("sessionLabel");
const progressBar = document.getElementById("progressBar");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const workInput = document.getElementById("workInput");
const shortInput = document.getElementById("shortInput");
const longInput = document.getElementById("longInput");
const completedSessionsEl = document.getElementById("completedSessions");
const totalTimeEl = document.getElementById("totalTime");
const notification = document.getElementById("notification");
const darkModeSwitch = document.getElementById("darkModeSwitch");
const resetSettingsBtn = document.getElementById("resetSettingsBtn");

/* ==================== Timerlogik ==================== */
const getCurrentDuration = () => {
  return durations[sessionType];
};

const startTimerLogic = () => {
  if (timerId !== null) return;
  updateDurationsFromInput();

  if (timeLeft <= 0 || timeLeft > getCurrentDuration()) {
    timeLeft = getCurrentDuration();
    updateDisplay();
  }

  timerId = setInterval(tick, 1000);
  startBtn.disabled = true;
  pauseBtn.disabled = false;
};

const tick = () => {
  if (timeLeft > 0) {
    timeLeft--;
    updateDisplay();
  } else {
    handleSessionEnd();
  }
};

const handleSessionEnd = () => {
  clearInterval(timerId);
  timerId = null;

  if (sessionType === "work") {
    completedSessions++;
    totalWorkSeconds += durations.work;
    sessionCount++;
    sessionType = sessionCount % 5 === 0 ? "long" : "short";
    updateStats();
  } else {
    sessionType = "work";
  }

  updateDurationsFromInput();
  timeLeft = getCurrentDuration();
  updateSessionLabel();
  updateDisplay();
  playNotificationSound();
  showNotification();
  startTimerLogic();
};

const pauseTimer = () => {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }
};

const resetTimer = () => {
  clearInterval(timerId);
  timerId = null;
  sessionType = "work";
  sessionCount = 1;
  completedSessions = 0;
  totalWorkSeconds = 0;
  updateDurationsFromInput();
  timeLeft = getCurrentDuration();
  updateDisplay();
  updateSessionLabel();
  updateStats();
  progressBar.style.width = "0%";
  startBtn.disabled = false;
  pauseBtn.disabled = true;
};

/* ==================== Anzeige / UI ==================== */
const updateDisplay = () => {
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;

  const total = getCurrentDuration();
  const percent = ((total - timeLeft) / total) * 100;
  progressBar.style.width = `${percent}%`;
};

const updateSessionLabel = () => {
  if (sessionType === "work") {
    sessionLabel.textContent = `Work Session • ${sessionCount}`;
  } else if (sessionType === "short") {
    sessionLabel.textContent = `Short Break`;
  } else {
    sessionLabel.textContent = `Long Break`;
  }
};

const updateStats = () => {
  completedSessionsEl.textContent = completedSessions;
  const hours = Math.floor(totalWorkSeconds / 3600);
  const minutes = Math.floor((totalWorkSeconds % 3600) / 60);
  totalTimeEl.textContent = `${hours}h ${minutes}m`;
  saveState();
};

/* ==================== Sound & Benachrichtigung ==================== */
const playSound = (frequency = 800, duration = 0.5, volume = 0.1) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  if (!audioContext) return;

  try {
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn("Fehler beim Abspielen des Sounds:", error);
  }
};

const playNotificationSound = () => {
  setTimeout(() => playSound(800, 0.2, 0.1), 250);
};

const showNotification = () => {
  notification.classList.add("show");
  setTimeout(() => {
    notification.classList.remove("show");
  }, 2000);
};

/* ==================== Settings & Speicherung ==================== */
const updateDurationsFromInput = () => {
  durations.work = parseInt(workInput.value, 10) * 60;
  durations.short = parseInt(shortInput.value, 10) * 60;
  durations.long = parseInt(longInput.value, 10) * 60;
  saveState();
};

const saveState = () => {
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
    theme: darkModeSwitch.checked ? "dark" : "light",
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem(THEME_KEY, state.theme);
};

const loadState = () => {
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
};

const applyTheme = (mode) => {
  document.body.classList.toggle("dark", mode === "dark");
  darkModeSwitch.checked = mode === "dark";
};

/* ==================== Events ==================== */
const addEventListeners = () => {
  startBtn.addEventListener("click", startTimerLogic);
  pauseBtn.addEventListener("click", pauseTimer);
  resetBtn.addEventListener("click", resetTimer);

  resetSettingsBtn.addEventListener("click", () => {
    workInput.value = 25;
    shortInput.value = 5;
    longInput.value = 15;
    updateDurationsFromInput();
    resetTimer();
  });

  darkModeSwitch.addEventListener("change", () => {
    const mode = darkModeSwitch.checked ? "dark" : "light";
    applyTheme(mode);
    saveState();
  });
};

/* ==================== Initialisierung ==================== */
const LABELS_EN = {
  work: "Work Duration",
  short: "Short Break",
  long: "Long Break",
};
const LABELS_DE = {
  work: "Arbeitszeit",
  short: "Pause",
  long: "Lange Pause",
};

const initLabels = (labels = LABELS_EN) => {
  document.querySelector('label[for="workInput"]').textContent = labels.work;
  document.querySelector('label[for="shortInput"]').textContent = labels.short;
  document.querySelector('label[for="longInput"]').textContent = labels.long;
};

const initApp = () => {
  loadState();
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  initLabels(LABELS_EN);
  // initLabels(LABELS_DE);
  applyTheme(savedTheme);
  updateSessionLabel();
  updateDisplay();
  updateStats();
  addEventListeners();
};
document.addEventListener("DOMContentLoaded", initApp);
