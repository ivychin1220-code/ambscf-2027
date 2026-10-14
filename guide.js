(() => {
  const panels = [...document.querySelectorAll('.guide-panel')];
  const tabs = [...document.querySelectorAll('.guide-tabs a')];
  function route() {
    const hash = location.hash.slice(1);
    const isFAQ = hash === 'qa' || /^q\d+$/.test(hash);
    const active = isFAQ ? 'qa' : 'steps';
    panels.forEach(p => p.hidden = p.id !== active);
    tabs.forEach(t => {if(t.getAttribute('href') === '#' + active) t.setAttribute('aria-current','page'); else t.removeAttribute('aria-current');});
    const target = document.getElementById(hash);
    if(target && /^q\d+$/.test(hash)) target.open = true;
    if(target) requestAnimationFrame(() => (hash === 'steps' || hash === 'qa' ? document.querySelector('.guide-shell') : target).scrollIntoView({block:'start',behavior:'instant'}));
  }
  addEventListener('hashchange',route); route();
  const viewer = document.getElementById('image-viewer');
  const image = document.getElementById('viewer-image');
  let opener;
  document.querySelectorAll('.image-button').forEach(button => button.addEventListener('click',() => {
    opener=button; image.src=button.dataset.image; image.alt=button.querySelector('img').alt;
    document.getElementById('viewer-title').textContent=button.getAttribute('aria-label').replace('放大 ','');
    viewer.showModal(); document.body.style.overflow='hidden';
    document.getElementById('close-viewer').focus();
    document.querySelector('.viewer-scroll').scrollTo(0,0);
  }));
  document.getElementById('close-viewer').addEventListener('click',()=>viewer.close());
  viewer.addEventListener('click',e=>{if(e.target===viewer){const r=viewer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)viewer.close();}});
  viewer.addEventListener('close',()=>{document.body.style.overflow='';opener?.focus();});
})();
