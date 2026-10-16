(() => {
  document.querySelectorAll('.market-carousel').forEach(root => {
  const slides = [...root.querySelectorAll('.market-slide')];
  const dots = [...root.querySelectorAll('.market-controls button:not(.carousel-play)')];
  let current = 0;
  let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let hovered = false, visible = false;
  const play = root.querySelector('.carousel-play');
  const syncPlay = () => {
    play.innerHTML = playing
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z"/></svg>';
    play.title = playing ? '暫停自動輪播' : '播放自動輪播';
    play.setAttribute('aria-label', playing ? '暫停自動輪播' : '播放自動輪播');
    root.querySelector('.market-slides').setAttribute('aria-live', playing ? 'off' : 'polite');
  };
  play.addEventListener('click', () => { playing = !playing; syncPlay(); });
  root.addEventListener('pointerenter', e => { if(e.pointerType === 'mouse') hovered = true; });
  root.addEventListener('pointerleave', () => { hovered = false; });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, {threshold: 0.25}).observe(root);
  syncPlay();
  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === current)));
    root.querySelector('.market-count').textContent = `${current + 1} / ${slides.length}`;
  };
  root.querySelector('.market-prev').addEventListener('click', () => show(current - 1));
  root.querySelector('.market-next').addEventListener('click', () => show(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    show(current + (e.key === 'ArrowRight' ? 1 : -1));
  });
  let start = null;
  root.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || e.pointerType === 'mouse') return;
    start = { x: e.clientX, y: e.clientY };
  });
  root.addEventListener('pointerup', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
  });
  root.addEventListener('pointercancel', () => { start = null; });
  setInterval(() => {
    if (playing && visible && !hovered && !document.hidden) show(current + 1);
  }, 5000);
  });
})();
