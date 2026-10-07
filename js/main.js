/* Академия массажа лица FN — анимации и интерактив
   GSAP + ScrollTrigger + Lenis + SplitType + Vanta Fog */
(() => {
  gsap.registerPlugin(ScrollTrigger);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = n => Math.round(n).toLocaleString('ru-RU');

  /* ---------- плавный скролл ---------- */
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: !reduce });
  lenis.on('scroll', ScrollTrigger.update);
  window.__lenis = lenis; // для отладки
  // закреплённые сцены меняют высоту страницы — пересчитываем границы скролла
  ScrollTrigger.addEventListener('refresh', () => lenis.resize());
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const el = $(id); if (!el) return;
    e.preventDefault();
    lenis.scrollTo(el, { offset: id === '#price' ? -40 : 0, duration: 1.6 });
  }));

  /* ---------- навигация: прячется при скролле вниз, светлеет над тёмными блоками ---------- */
  const nav = $('#nav');
  let lastY = 0;
  lenis.on('scroll', ({ scroll }) => {
    nav.classList.toggle('hide', scroll > lastY && scroll > 300);
    lastY = scroll;
  });
  // над первым экраном меню светлое, пока его не накроет следующий экран
  ScrollTrigger.create({ trigger: '.hero', start: 'top 40px', endTrigger: '.overview', end: 'top 40px',
    onToggle: s => nav.classList.toggle('dark', s.isActive) });
  $$('.arc, .fog, .cta, footer, .full').forEach(sec => ScrollTrigger.create({
    trigger: sec, start: 'top 40px', end: 'bottom 40px',
    onToggle: s => nav.classList.toggle('dark', s.isActive)
  }));

  /* ---------- мобильное меню ---------- */
  const menuBtn = $('#menuBtn'), mmenu = $('#mmenu');
  const setMenu = open => {
    mmenu.classList.toggle('open', open);
    mmenu.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));
    $('.t', menuBtn).textContent = open ? 'Закрыть' : 'Меню';
    nav.classList.toggle('menu-open', open);
    nav.classList.remove('hide');
    open ? lenis.stop() : lenis.start();
  };
  menuBtn.addEventListener('click', () => setMenu(!mmenu.classList.contains('open')));
  // capture: сначала закрываем меню (и включаем прокрутку), потом срабатывает переход к разделу
  $$('#mmenu a[href^="#"]').forEach(a => a.addEventListener('click', () => setMenu(false), true));
  addEventListener('keydown', e => { if (e.key === 'Escape' && mmenu.classList.contains('open')) setMenu(false); });

  /* ---------- разбивка заголовков на строки/слова ---------- */
  const splitAll = () => $$('.split').forEach(el => new SplitType(el, { types: 'lines,words' }));
  splitAll();

  /* ---------- 1. первый экран ---------- */
  // заголовок: строки в маске, слова поднимаются снизу из лёгкого размытия
  const ht = $('#heroTitle');
  ht.innerHTML = ht.innerHTML.split('<br>').map(l =>
    '<span class="ln">' + l.split(' ').map(w => '<span class="w" style="display:inline-block">' + w + '</span>').join(' ') + '</span>').join('');
  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
  intro.from('.hero-media img', { opacity: 0, duration: 1.4, ease: 'power2.out' })
       .from('#heroTitle .w', { yPercent: 105, filter: 'blur(6px)', duration: 1.2, stagger: 0.09 }, 0.3)
       .from('.hf-feats li', { opacity: 0, y: 24, duration: 1, stagger: 0.12 }, 0.9)
       .from('.hf-sub > *', { opacity: 0, y: 24, duration: 1, stagger: 0.12 }, 1);
  if (reduce) intro.progress(1);

  // при прокрутке: фото темнеет, текст первого экрана уходит, появляется манифест
  // при прокрутке следующий экран сразу наезжает листом, а первый темнеет и уходит вглубь
  const heroTl = gsap.timeline({
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=100%', pin: true, pinSpacing: false, scrub: 0.8, anticipatePin: 1 }
  });
  heroTl.to('.hero-shade', { opacity: 1, ease: 'none', duration: 1 }, 0)
        .to('.hero-copy', { opacity: 0, y: -50, ease: 'none', duration: 0.6 }, 0)
        .to('.hero-media', { scale: 0.9, borderRadius: 28, ease: 'none', duration: 1 }, 0);
  // верхние углы следующего экрана распрямляются, когда он доходит до верха
  gsap.fromTo('.overview', { borderTopLeftRadius: 36, borderTopRightRadius: 36 }, { borderTopLeftRadius: 0, borderTopRightRadius: 0, ease: 'none',
    scrollTrigger: { trigger: '.overview', start: 'top 60%', end: 'top top', scrub: true } });

  /* ---------- появление заголовков ---------- */
  $$('.split').forEach(el => {
    gsap.from($$('.word', el), {
      yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.035,
      scrollTrigger: { trigger: el, start: 'top 86%' }
    });
  });

  /* ---------- 2. карточки: на компьютере блок закрепляется и карточки листаются колесом,
     на телефоне — свайпом пальцем ---------- */
  const cards = $('#cards');
  const cardsMM = gsap.matchMedia();
  cardsMM.add('(min-width: 901px)', () => {
    const dist = () => Math.max(0, cards.scrollWidth - innerWidth);
    gsap.to(cards, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '#cardsPin', start: 'center center', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true }
    });
  });
  gsap.from('.cols4 > div', { y: 40, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out',
    scrollTrigger: { trigger: '.cols4', start: 'top 85%' } });

  /* ---------- 3. дуга «5 техник» ---------- */
  const wheel = $('#wheel');
  const texts = $$('#arcText > div');
  const N = texts.length, STEP = 20; // градусов между точками
  const pts = texts.map((_, i) => {
    const pt = document.createElement('div');
    pt.className = 'pt' + (i === 0 ? ' on' : '');
    pt.innerHTML = `<div class="p"><div class="n">${i + 1}</div><div class="d"></div></div>`;
    wheel.appendChild(pt);
    return pt;
  });
  const placePts = rot => {
    const R = wheel.offsetWidth / 2;
    pts.forEach((pt, i) => {
      const a = i * STEP;
      pt.style.transform = `rotate(${a}deg)`;
      pt.firstElementChild.style.transform = `translate(-50%,-50%) translateY(${-R}px) rotate(${-(a + rot)}deg)`;
    });
  };
  let arcIdx = 0;
  const setArc = i => {
    if (i === arcIdx) return;
    arcIdx = i;
    texts.forEach((t, j) => t.classList.toggle('on', j === i));
    pts.forEach((p, j) => p.classList.toggle('on', j === i));
    $('#arcN').textContent = i + 1;
  };
  placePts(0);
  ScrollTrigger.create({
    trigger: '.arc', start: 'top top', end: () => '+=' + innerHeight * (N * 0.75), pin: true, scrub: 0.6,
    onUpdate: s => {
      const rot = -s.progress * (N - 1) * STEP;
      gsap.set(wheel, { rotate: rot });
      placePts(rot);
      setArc(Math.min(N - 1, Math.round(s.progress * (N - 1))));
    }
  });
  gsap.from('.arc-stem', { scaleY: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.arc', start: 'top 60%' } });
  addEventListener('resize', () => placePts(gsap.getProperty(wheel, 'rotate')));

  /* ---------- 4. автор: светящаяся линия + счётчики ---------- */
  const glow = $('#glow');
  if (glow) {
    const len = glow.getTotalLength();
    gsap.set(glow, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(glow, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.sides', start: 'top 70%', end: 'center 40%', scrub: 1 } });
  }
  gsap.to('.sides-ph img', { scale: 1, ease: 'none', scrollTrigger: { trigger: '.sides', start: 'top bottom', end: 'bottom top', scrub: true } });
  $$('.count').forEach(c => {
    const o = { v: 0 };
    gsap.to(o, { v: +c.dataset.to, duration: 2, ease: 'power3.out',
      scrollTrigger: { trigger: c, start: 'top 90%' },
      onUpdate: () => (c.textContent = fmt(o.v)) });
  });

  /* ---------- 5. планшет встаёт ---------- */
  gsap.fromTo('#tablet', { rotateX: 28, scale: 0.86, y: 40 }, { rotateX: 0, scale: 1, y: 0, ease: 'none',
    scrollTrigger: { trigger: '#tablet', start: 'top 95%', end: 'top 25%', scrub: 0.8 } });
  gsap.to('#progBar', { width: '44%', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '#tablet', start: 'top 50%' } });

  /* ---------- 6. списки ---------- */
  gsap.from('.blist li', { y: 30, opacity: 0, stagger: 0.07, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.blist', start: 'top 80%' } });
  $$('.program > div').forEach(col => gsap.from($$('li', col), { y: 20, opacity: 0, stagger: 0.05, duration: 0.9, ease: 'expo.out',
    scrollTrigger: { trigger: col, start: 'top 75%' } }));

  /* ---------- 7, 13. параллакс фото ---------- */
  $$('.full > img, .cta-ph img').forEach(img => gsap.to(img, { scale: 1, yPercent: 6, ease: 'none',
    scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
  /* ---------- 12. фото у FAQ: плавное появление + параллакс на мобильном ---------- */
  const faqPh = $('.faq-ph'), faqImg = $('.faq-ph img');
  if (faqPh && faqImg) {
    gsap.set(faqImg, { scale: 1.18 });
    gsap.timeline({ scrollTrigger: { trigger: faqPh, start: 'top 88%' } })
      .from(faqPh, { clipPath: 'inset(14% 10% 14% 10% round 36px)', opacity: 0, duration: 1.6, ease: 'expo.out' })
      .from(faqImg, { scale: 1.4, duration: 2, ease: 'expo.out' }, 0);
    // на десктопе фото и так «едет» (sticky), на мобильном — двигаем картинку внутри рамки
    gsap.matchMedia().add('(max-width: 900px)', () => {
      gsap.fromTo(faqImg, { yPercent: -7 }, { yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: faqPh, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }
  gsap.from('.chips span', { y: 16, opacity: 0, stagger: 0.05, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: '.chips', start: 'top 85%' } });
  gsap.from('.gc li', { y: 20, opacity: 0, stagger: 0.04, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: '.gcards', start: 'top 75%' } });

  /* ---------- 9. туман (Vanta) — запускаем, только когда блок рядом ---------- */
  let fog = null;
  const fogEl = $('#fogBg');
  if (fogEl && window.VANTA && !reduce) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !fog) {
        fog = VANTA.FOG({ el: fogEl, mouseControls: true, touchControls: false, gyroControls: false,
          highlightColor: 0xc9967a, midtoneColor: 0x8a5d45, lowlightColor: 0x33251e, baseColor: 0x1a1411,
          blurFactor: 0.62, speed: 1.1, zoom: 0.75 });
      } else if (!e.isIntersecting && fog) { fog.destroy(); fog = null; }
    }, { rootMargin: '200px' }).observe(fogEl);
  }
  gsap.from('.step', { y: 40, opacity: 0, stagger: 0.12, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.steps', start: 'top 80%' } });

  /* ---------- 10. калькулятор ---------- */
  const P = $('#cPrice'), C = $('#cClients');
  const st = { s: 7, m: 64500 };
  const calc = () => {
    const p = +P.value, c = +C.value;
    $('#cPriceV').textContent = fmt(p) + ' ₽';
    $('#cClientsV').textContent = c;
    gsap.to(st, { s: Math.ceil(19900 / p), m: p * c * 4.3, duration: 0.6, ease: 'power3.out',
      onUpdate: () => { $('#rSessions').textContent = Math.round(st.s); $('#rMonth').textContent = fmt(st.m) + ' ₽'; } });
  };
  P.addEventListener('input', calc); C.addEventListener('input', calc); calc();
  gsap.from(['.tcard', '.calc'], { y: 60, opacity: 0, stagger: 0.12, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.tariff', start: 'top 70%' } });

  /* ---------- 11. отзывы ---------- */
  gsap.from('.vc', { y: 50, opacity: 0, stagger: 0.1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.vgrid', start: 'top 80%' } });

  /* ---------- 12. FAQ: плавное раскрытие ---------- */
  $$('.qa details').forEach(d => {
    const s = $('summary', d), a = $('.a', d);
    s.addEventListener('click', e => {
      e.preventDefault();
      if (d.open) {
        gsap.to(a, { height: 0, duration: 0.45, ease: 'power3.inOut', onComplete: () => { d.open = false; ScrollTrigger.refresh(); } });
      } else {
        d.open = true;
        gsap.fromTo(a, { height: 0 }, { height: a.scrollHeight, duration: 0.55, ease: 'power3.out', onComplete: () => { a.style.height = 'auto'; ScrollTrigger.refresh(); } });
      }
    });
  });

  /* ---------- мобильная кнопка «Купить» ---------- */
  const mbar = $('#mbar'), price = $('#price');
  lenis.on('scroll', ({ scroll }) => {
    const r = price.getBoundingClientRect();
    mbar.classList.toggle('show', scroll > innerHeight * 1.2 && !(r.top < innerHeight && r.bottom > 0));
  });

  /* пересчёт после загрузки шрифтов и картинок */
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
})();
