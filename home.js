// tunetransit.app homepage: the route map and its split-flap trip board.
(() => {
  const map = document.getElementById('map');
  if (!map) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVG = 'http://www.w3.org/2000/svg';
  const svg = map.querySelector('.map-lines');
  const hub = map.querySelector('.hub svg');
  const sides = ['from', 'to'].map(side => ({
    side,
    stops: [...map.querySelectorAll(`.stops-${side} .stop`)].map(stop => {
      const path = svg.appendChild(document.createElementNS(SVG, 'path'));
      path.setAttribute('stroke', stop.style.getPropertyValue('--line'));
      return { input: stop.querySelector('input'), disc: stop.querySelector('.service'), path, points: [] };
    }),
  }));

  // The song: a dot that rides out on your line and leaves on theirs.
  let dot, motion;
  if (!still) {
    dot = svg.appendChild(document.createElementNS(SVG, 'circle'));
    dot.setAttribute('class', 'map-song');
    motion = dot.appendChild(document.createElementNS(SVG, 'animateMotion'));
    motion.setAttribute('dur', '2.6s');
    motion.setAttribute('repeatCount', 'indefinite');
  }

  const toPath = points => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

  // Lines are routed from where the stops actually sit: straight out of the stop, one 45° bend,
  // then straight into the hub in a bundle. Wide screens run left to right, phones top to bottom.
  const layout = () => {
    const box = map.getBoundingClientRect();
    if (!box.width) return;
    const center = el => {
      const r = el.getBoundingClientRect();
      return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top, r.width / 2];
    };
    const [hx, hy, hubRadius] = center(hub);
    const first = center(sides[0].stops[0].disc);
    const across = Math.abs(first[0] - hx) > Math.abs(first[1] - hy);
    const width = across ? 8 : 6;
    const pitch = width + 4;
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.style.setProperty('--stroke', width);

    for (const { stops } of sides) {
      stops.forEach((stop, i) => {
        const [sx, sy] = center(stop.disc);
        const slot = (i - (stops.length - 1) / 2) * pitch;
        const outer = i === 0 || i === stops.length - 1;
        // Along = the axis the line travels on; cross = the axis the stops are spread over.
        const [a0, c0, a1, c1] = across ? [sx, sy, hx, hy + slot] : [sy, sx, hy, hx + slot];
        const dir = Math.sign(a1 - a0);
        // Outer lines bend a little later so the diagonals stay evenly spaced.
        const bendEnd = a1 - dir * (hubRadius + 22 - (outer ? pitch * 0.414 : 0));
        let bendStart = bendEnd - dir * Math.abs(c1 - c0);
        if ((bendStart - a0) * dir < 16) bendStart = a0 + dir * 16;
        const along = [[a0, c0], [bendStart, c0], [bendEnd, c1], [a1, c1]];
        stop.points = across ? along : along.map(([a, c]) => [c, a]);
        stop.path.setAttribute('d', toPath(stop.points));
      });
    }
    ride();
  };

  const chosen = side => sides.find(s => s.side === side).stops.find(stop => stop.input.checked);
  const ride = () => {
    const from = chosen('from');
    const to = chosen('to');
    for (const { stops } of sides) stops.forEach(stop => stop.path.classList.toggle('on', stop === from || stop === to));
    if (!motion || !from.points.length) return;
    motion.setAttribute('path', toPath([...from.points, ...[...to.points].reverse()]));
    if (motion.beginElement) motion.beginElement();
  };

  // Split-flap cells. Each word sits in a fixed row of tiles, like the real thing.
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const flaps = {};
  for (const id of ['trip-from', 'trip-to', 'trip-status']) {
    const cell = document.getElementById(id);
    const size = Number(cell.dataset.size);
    const word = cell.textContent;
    cell.textContent = '';
    cell.classList.add('split');
    const tiles = Array.from({ length: size }, (_, i) => {
      const tile = cell.appendChild(document.createElement('span'));
      tile.className = 'ch';
      tile.textContent = word[i] || '';
      return tile;
    });
    flaps[id] = { cell, tiles, timer: 0 };
  }
  const flip = (id, word, done) => {
    const flap = flaps[id];
    clearTimeout(flap.timer);
    if (still) {
      flap.tiles.forEach((tile, i) => { tile.textContent = word[i] || ''; });
      if (done) done();
      return;
    }
    let frame = 0;
    const tick = () => {
      frame += 1;
      flap.tiles.forEach((tile, i) => {
        const final = word[i] && word[i] !== ' ' ? word[i] : '';
        tile.textContent = i < frame - 5 || !final ? final : letters[Math.random() * 26 | 0];
      });
      if (frame < word.length + 5) flap.timer = setTimeout(tick, 45);
      else if (done) done();
    };
    tick();
  };

  const note = document.getElementById('trip-note');
  let boarding = 0;
  const announce = () => {
    const from = chosen('from').input.value;
    const to = chosen('to').input.value;
    flip('trip-from', from.toUpperCase());
    flip('trip-to', to.toUpperCase());
    const status = flaps['trip-status'].cell;
    status.classList.replace('opened', 'boarding');
    flip('trip-status', 'BOARDING');
    clearTimeout(boarding);
    boarding = setTimeout(() => {
      status.classList.replace('boarding', 'opened');
      flip('trip-status', 'OPENED');
    }, still ? 0 : 1500);
    note.textContent = from === to
      ? `You share “Blue Hour” from ${from} and your friend plays it in ${to}. The same link also works for anyone on the other three apps.`
      : `You share “Blue Hour” from ${from}. Your friend opens the link and plays the same recording in ${to}, with nothing to install.`;
  };

  map.addEventListener('change', () => { ride(); announce(); });
  new ResizeObserver(layout).observe(map);
  layout();
  map.classList.add('ready');
})();

// Tab bar: the tab for whichever section is crossing the middle of the screen rises, as in the app.
(() => {
  const tabs = [...document.querySelectorAll('.tabbar .tab')];
  if (!tabs.length || !('IntersectionObserver' in window)) return;
  const select = name => tabs.forEach(tab => {
    if (tab.dataset.tab === name) tab.setAttribute('aria-current', 'true');
    else tab.removeAttribute('aria-current');
  });
  const middle = new IntersectionObserver(entries => {
    const hit = entries.find(entry => entry.isIntersecting);
    if (hit) select(hit.target.dataset.tab);
  }, { rootMargin: '-50% 0px -50% 0px' });
  // The questions and the footer belong to no tab, so past the last section every tab sits level.
  document.querySelectorAll('main [data-tab], #faq, .site-footer').forEach(section => middle.observe(section));
})();

// Where the page ends, each side tab's line comes in from its edge of the window and runs into its tab.
(() => {
  const svg = document.querySelector('.terminus svg');
  const bar = document.querySelector('.tabbar');
  if (!svg || !bar) return;
  const draw = () => {
    const box = svg.getBoundingClientRect();
    if (!box.width) return;
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const width = Math.min(9, Math.max(5, box.width * .008));
    const tabs = [...bar.querySelectorAll('.tab')];
    const middle = (tabs.length - 1) / 2;
    svg.innerHTML = tabs.map((tab, i) => {
      const disc = tab.querySelector('.tab-disc');
      const tx = tab.offsetLeft + tab.offsetWidth / 2;
      const ty = box.height - bar.offsetHeight + tab.offsetTop + disc.offsetTop + disc.offsetHeight / 2;
      let points = [[tx, 0], [tx, ty]];
      if (i !== middle) {
        const dir = i < middle ? 1 : -1;
        // The outer line of each pair comes in lower, so the two never cross.
        const drop = i === 0 || i === tabs.length - 1 ? 26 : 32 + width + 6;
        points = [[dir > 0 ? 0 : box.width, ty - drop], [tx - dir * drop, ty - drop], [tx, ty]];
      }
      const d = points.map(([x, y], n) => `${n ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
      return `<path d="${d}" stroke="${tab.style.getPropertyValue('--line')}" stroke-width="${width.toFixed(1)}"/>`;
    }).join('');
  };
  new ResizeObserver(draw).observe(svg);
  draw();
})();

// Easter egg. TuneTransit runs natively on iPhone Duo, so double-clicking a phone (or typing "duo") unfolds one:
// closed on its cover display first, then open across the inner display.
(() => {
  const base = new URL('assets/duo/', document.currentScript.src);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let sheet, button, from, timer, flat;
  const close = () => {
    if (!sheet || !sheet.classList.contains('on')) return;
    clearTimeout(flat);
    sheet.classList.remove('flat');
    sheet.offsetWidth;
    sheet.classList.remove('on');
    timer = setTimeout(() => { sheet.hidden = true; }, 1100);
    if (from && from.focus) from.focus();
  };
  const open = name => {
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.className = 'duo-sheet';
      sheet.hidden = true;
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-modal', 'true');
      sheet.setAttribute('aria-label', 'TuneTransit on iPhone Duo');
      sheet.innerHTML = '<div class="duo" aria-hidden="true"><div class="duo-half duo-right"></div><div class="duo-half duo-left"><div class="duo-face"></div><div class="duo-back"></div></div><div class="duo-whole"></div></div>'
        + '<p class="duo-note"><b>You found the fold.</b> TuneTransit runs natively on iPhone Duo, closed and open.</p>'
        + '<button class="pill pill-quiet" type="button">FOLD IT BACK</button>';
      button = sheet.querySelector('button');
      sheet.addEventListener('click', close);
      document.body.append(sheet);
    }
    if (sheet.classList.contains('on')) return;
    clearTimeout(timer);
    from = document.activeElement;
    const urls = ['open', 'fold'].map(kind => new URL(`${kind}-${name}.jpg`, base).href);
    sheet.style.setProperty('--open', `url("${urls[0]}")`);
    sheet.style.setProperty('--fold', `url("${urls[1]}")`);
    // Wait for both screens, so the phone never opens blank.
    let waiting = urls.length;
    const ready = () => {
      if (--waiting) return;
      sheet.hidden = false;
      sheet.offsetWidth;
      sheet.classList.add('on');
      // When the swing ends, one seamless piece takes over from the two halves.
      flat = setTimeout(() => sheet.classList.add('flat'), still ? 0 : 1150);
      button.focus({ preventScroll: true });
    };
    urls.forEach(url => { const img = new Image(); img.onload = img.onerror = ready; img.src = url; });
  };
  const screenFor = phone => {
    const src = (phone.querySelector('img') || { src: '' }).src;
    return src.includes('search') ? 'search' : src.includes('mixtape') ? 'mixtape-detail' : 'song';
  };
  document.addEventListener('dblclick', event => {
    const phone = event.target.closest && event.target.closest('.phone');
    if (phone) open(screenFor(phone));
  });
  let typed = '';
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') return close();
    if (event.key === 'Tab' && sheet && sheet.classList.contains('on')) { event.preventDefault(); button.focus(); return; }
    if (event.metaKey || event.ctrlKey || event.altKey || event.key.length !== 1) return;
    typed = (typed + event.key.toLowerCase()).slice(-3);
    if (typed === 'duo') open('song');
  });
})();
