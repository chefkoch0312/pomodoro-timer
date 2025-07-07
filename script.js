let timeLeft = 25 * 60; // 25 Minuten in Sekunden
let timerId = null;

const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");

function updateDisplay() {
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function startTimer() {
  if (timerId !== null) return; // bereits laufend

  timerId = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateDisplay();
    } else {
      clearInterval(timerId);
      timerId = null;
      alert("Time's up!");
    }
  }, 1000);
}

startBtn.addEventListener("click", startTimer);
updateDisplay();
