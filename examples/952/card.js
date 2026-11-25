const options = JSON.parse(document.querySelector("#profile-options").textContent);
const card = document.querySelector(".card");
const audio = document.querySelector("#audio");
const scene = document.querySelector("#scene");
const play = document.querySelector("#play");
const sceneControl = document.querySelector("#scene-control");
const seek = document.querySelector("#seek");
const notice = document.querySelector("#notice");
const wave = document.querySelector("#wave");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
let videoChosen = false;
let noticeTimer;

document.documentElement.classList.toggle("has-grain", options.grain);
for (const amplitude of options.waveform) {
  const bar = document.createElement("i");
  bar.style.setProperty("--bar", amplitude + "%");
  wave.append(bar);
}
const bars = Array.from(wave.children);

function tell(message) {
  clearTimeout(noticeTimer);
  notice.textContent = message;
  noticeTimer = setTimeout(() => { notice.textContent = ""; }, 5000);
}

function timeLabel(seconds) {
  const t = Math.floor(seconds);
  return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
}

function drawTime() {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  const ratio = audio.currentTime / audio.duration;
  const elapsed = timeLabel(audio.currentTime);
  const duration = timeLabel(audio.duration);
  document.querySelector("#elapsed").textContent = elapsed;
  document.querySelector("#duration").textContent = duration;
  seek.value = Math.round(ratio * 1000);
  seek.setAttribute("aria-valuetext", elapsed + " из " + duration);
  bars.forEach((bar, i) => bar.classList.toggle("passed", i < ratio * bars.length));
}

function showAudioState() {
  const active = !audio.paused;
  const label = active ? "Приостановить музыку" : "Воспроизвести музыку";
  play.classList.toggle("playing", active);
  play.setAttribute("aria-label", label);
  play.title = label;
}
function showVideoState() {
  const active = !scene.paused;
  sceneControl.setAttribute("aria-pressed", String(active));
  document.querySelector("#scene-label").textContent = active ? "Остановить видео" : "Включить видео";
}
function alignVideo() {
  if (Number.isFinite(scene.duration) && scene.duration > 0) {
    scene.currentTime = audio.currentTime % scene.duration;
  }
}
function playVideo() {
  alignVideo();
  scene.play().catch(() => {
    showVideoState();
    tell("Видео не запустилось. Можно слушать музыку с обложкой.");
  });
}

play.addEventListener("click", () => {
  if (!audio.paused) {
    audio.pause();
    return;
  }
  audio.play().catch(() => tell("Не удалось включить музыку. Попробуйте ещё раз."));
  if (scene.paused && !videoChosen && options.startVideoWithMusic && !reducedMotion.matches) {
    playVideo();
  } else if (!scene.paused) {
    alignVideo();
  }
});
sceneControl.addEventListener("click", () => {
  videoChosen = true;
  if (scene.paused) playVideo();
  else scene.pause();
});
for (const event of ["play", "pause", "ended", "error"]) {
  audio.addEventListener(event, showAudioState);
  scene.addEventListener(event, showVideoState);
}
for (const event of ["loadedmetadata", "durationchange", "timeupdate", "seeked"]) {
  audio.addEventListener(event, drawTime);
}
scene.addEventListener("loadedmetadata", alignVideo);
seek.addEventListener("input", () => {
  if (!Number.isFinite(audio.duration)) return;
  audio.currentTime = audio.duration * Number(seek.value) / 1000;
  if (!scene.paused) alignVideo();
  drawTime();
});
document.querySelector("#copy").addEventListener("click", async () => {
  const name = document.querySelector("#nickname");
  try {
    await navigator.clipboard.writeText(name.textContent);
    tell("Ник скопирован");
  } catch {
    const range = document.createRange();
    range.selectNodeContents(name);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    tell("Ник выделен для копирования");
  }
});

function clearTilt() {
  card.style.removeProperty("--tilt-x");
  card.style.removeProperty("--tilt-y");
}
card.addEventListener("pointermove", event => {
  if (!options.tilt || !finePointer.matches || reducedMotion.matches) return;
  const box = card.getBoundingClientRect();
  const dx = (event.clientX - box.left) / box.width - .5;
  const dy = (event.clientY - box.top) / box.height - .5;
  card.style.setProperty("--tilt-x", (-dy * 5).toFixed(2) + "deg");
  card.style.setProperty("--tilt-y", (dx * 5).toFixed(2) + "deg");
});
card.addEventListener("pointerleave", clearTilt);
reducedMotion.addEventListener("change", () => {
  clearTilt();
  if (reducedMotion.matches) scene.pause();
});
drawTime();
showAudioState();
showVideoState();
document.documentElement.classList.add("ready");
