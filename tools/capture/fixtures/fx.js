const canvas = document.querySelector('.fx');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const dots = Array.from({ length: 70 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  r: Math.random() * 1.8 + 0.4,
  s: Math.random() * 0.25 + 0.05,
  a: Math.random() * 0.5 + 0.2
}));

function frame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const dot of dots) {
    dot.y -= dot.s;
    if (dot.y < -4) dot.y = canvas.height + 4;
    ctx.beginPath();
    ctx.fillStyle = `rgba(230, 200, 255, ${dot.a})`;
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

const splash = document.querySelector('.splash');
splash.addEventListener('click', () => {
  document.body.classList.add('playing');
  splash.hidden = true;
});
