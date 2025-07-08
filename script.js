const durations = {
  work: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

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
  } else if (sessionType === "short") {
    sessionLabel.textContent = `Short Break`;
  } else {
    sessionLabel.textContent = `Long Break`;
  }
}

function startTimer() {
  if (timerId !== null) return;

  timerId = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateDisplay();
    } else {
      clearInterval(timerId);
      timerId = null;

      if (sessionType === "work") {
        sessionCount++;
        sessionType = sessionCount % 5 === 0 ? "long" : "short";
      } else {
        sessionType = "work";
      }

      timeLeft = getCurrentDuration();
      updateSessionLabel();
      updateDisplay();
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
  timeLeft = getCurrentDuration();
  updateSessionLabel();
  updateDisplay();
  progressBar.style.width = "0%";
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

updateDisplay();
updateSessionLabel();
