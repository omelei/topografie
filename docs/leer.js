/* leer.nu — merkcomponenten: <leer-denker>, <leer-logo>, <leer-vak>, <leer-avatar>, <leer-embleem>, <leer-icoon>
   plus window.leerFeest(el, opts), window.leerVlieg(fromEl, toEl, opts), window.leerKalm() */
(function () {
  if (window.__leerLoaded) return;
  window.__leerLoaded = true;

  const C = {
    koraal: '#FF6A4D', koraalDiep: '#C8412A', cacao: '#2A1E17', geel: '#FFC93C', geelDiep: '#8A6300',
  };
  const VAK = {
    topo: { f: '#12B3A0', d: '#0B7468', t: '#DDF6F1', n: 'Topo' },
    rekenen: { f: '#2E8BF2', d: '#1560B8', t: '#DDEEFF', n: 'Rekenen' },
    taal: { f: '#B15BE6', d: '#7E2FB3', t: '#F3E3FC', n: 'Taal' },
    klok: { f: '#5C5FE6', d: '#3D3FBF', t: '#E6E7FF', n: 'Klok' },
    vlaggen: { f: '#F5A01A', d: '#935700', t: '#FFF0D6', n: 'Vlaggen' },
    tijdvakken: { f: '#EE5A9E', d: '#B42468', t: '#FDE4F0', n: 'Tijdvakken' },
  };
  window.LEER_VAK = VAK;

  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  window.leerKalm = () => document.documentElement.hasAttribute('data-calm') || !!(mq && mq.matches);
  const calmers = new Set();
  const syncCalm = () => calmers.forEach((el) => el.toggleAttribute('calm', window.leerKalm()));
  new MutationObserver(syncCalm).observe(document.documentElement, { attributes: true, attributeFilter: ['data-calm'] });
  mq && mq.addEventListener && mq.addEventListener('change', syncCalm);

  class Base extends HTMLElement {
    connectedCallback() { calmers.add(this); this.toggleAttribute('calm', window.leerKalm()); if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this.render(); }
    disconnectedCallback() { calmers.delete(this); }
    attributeChangedCallback() { if (this.shadowRoot) this.render(); }
    a(n, d) { const v = this.getAttribute(n); return v == null || v === '' ? d : v; }
  }
  const CALM_CSS = ':host([calm]) *, :host([calm]) *::before{animation:none!important;transition:none!important}';

  /* ---------- Denker ---------- */
  const BODY = 'M46 18C68 18 80 32 80 55C80 78 66 94 43 94C20 94 6 80 6 57C6 33 22 18 46 18Z';
  let uid = 0;
  function star(cx, cy, r, fill, cls) {
    let p = '';
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.48 : r; const a = -Math.PI / 2 + (i * Math.PI) / 5;
      p += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(2) + ' ' + (cy + rr * Math.sin(a)).toFixed(2);
    }
    return `<path class="${cls || ''}" d="${p}Z" fill="${fill}" stroke="${C.geelDiep}" stroke-width="1.6" stroke-linejoin="round"/>`;
  }
  function arm(cx, cy, rot, cls) {
    return `<g class="${cls || ''}"><ellipse cx="${cx}" cy="${cy}" rx="5.2" ry="10.5" transform="rotate(${rot} ${cx} ${cy})" fill="url(#b)"/></g>`;
  }
  function denkerSVG(expr, id, simple, px) {
    const o = C.cacao, S = [];
    const eyeUp = (x, y, sx, sy) => `<g class="eye"><ellipse cx="${x}" cy="${y}" rx="5.4" ry="7.8" transform="rotate(-12 ${x} ${y})" fill="${o}"/>${simple ? '' : `<circle cx="${x + sx}" cy="${y + sy}" r="1.9" fill="#fff"/>`}</g>`;
    const eyeFwd = (x, y) => `<g class="eye"><ellipse cx="${x}" cy="${y}" rx="5" ry="7" fill="${o}"/>${simple ? '' : `<circle cx="${x + 1.6}" cy="${y - 2.6}" r="1.8" fill="#fff"/>`}</g>`;
    const arc = (x, y, up) => `<path d="M${x - 6} ${y} Q${x} ${y + (up ? -8 : 6)} ${x + 6} ${y}" fill="none" stroke="${o}" stroke-width="4.4" stroke-linecap="round"/>`;
    const line = (d, w) => `<path d="${d}" fill="none" stroke="${o}" stroke-width="${w || 3.4}" stroke-linecap="round"/>`;
    const cheeks = simple ? '' : `<ellipse cx="33" cy="63" rx="5.5" ry="3.4" fill="#FF3D6E" opacity=".28"/><ellipse cx="72" cy="59" rx="5.5" ry="3.4" fill="#FF3D6E" opacity=".28"/>`;
    const dot = (x, y, r) => `<circle class="dot" cx="${x}" cy="${y}" r="${r || 6.5}" fill="${o}"/>`;
    let face = '', front = '', back = '', extra = '';
    switch (expr) {
      case 'blij':
        face = `<g class="pupils">${eyeFwd(43, 49)}${eyeFwd(61, 47)}</g>${line('M37 36 Q43 33 49 35')}${line('M56 33 Q62 31 67 33')}${line('M44 64 Q53 72 63 62', 3.8)}`;
        extra = dot(86, 16); break;
      case 'juichen':
        face = `${arc(43, 50, true)}${arc(61, 48, true)}<path d="M42 60 Q53 61 64 58 Q63 75 53 75 Q43 75 42 60Z" fill="${o}"/><ellipse cx="53" cy="70.5" rx="5" ry="3" fill="#FF7A8A"/>`;
        back = arm(4, 38, -38, 'armL') + arm(84, 32, 38, 'armR');
        extra = `<g class="star">${star(89, 11, 11, C.geel)}</g>`; break;
      case 'bemoedigend':
        face = `<g class="pupils">${eyeFwd(43, 49)}${eyeFwd(61, 47)}</g>${line('M37 38 Q42 34 48 35')}${line('M57 33 Q62 32 67 35')}${line('M46 64 Q53 69 61 63', 3.6)}`;
        front = `<g class="thumb">${arm(83, 60, 18)}<ellipse cx="86" cy="47" rx="3.4" ry="5.6" fill="url(#b)"/></g>`;
        extra = dot(86, 16); break;
      case 'trots':
        face = `${arc(43, 48, true)}${arc(61, 46, true)}${line('M43 61 Q53 70 64 60', 3.8)}`;
        back = arm(5, 70, 35) + arm(81, 67, -35);
        extra = `<g class="star">${star(88, 12, 10.5, C.geel)}</g>`; break;
      case 'slapen':
        face = `${arc(42, 54, false)}${arc(60, 52, false)}<ellipse cx="52" cy="66" rx="3" ry="2.4" fill="${o}"/>`;
        extra = `<circle class="dot sleepdot" cx="80" cy="24" r="5" fill="${o}"/><text class="z z1" x="86" y="16" font-family="Baloo 2, sans-serif" font-weight="800" font-size="12" fill="${o}">z</text><text class="z z2" x="93" y="6" font-family="Baloo 2, sans-serif" font-weight="800" font-size="9" fill="${o}">z</text>`; break;
      case 'zwaaien':
        face = `<g class="pupils">${eyeFwd(43, 49)}${eyeFwd(61, 47)}</g>${line('M37 36 Q43 33 49 35')}${line('M56 33 Q62 31 67 33')}${line('M44 63 Q53 72 63 61', 3.8)}`;
        back = `<g class="wave">${arm(84, 34, 30)}</g>`;
        extra = dot(88, 12, 5.5); break;
      default: // denken
        face = `<g class="pupils">${eyeUp(47.5, 44.5, 1.8, -3.9)}${eyeUp(64.5, 42.5, 1.8, -3.9)}</g>${simple ? '' : line('M40 31 Q45 27 51 29') + line('M58 26 Q63 23 69 25.5') + line('M49 66 Q54 67.5 59 64.5', 3.2)}`;
        extra = dot(86, 16);
    }
    const shade = simple ? `<path d="${BODY}" fill="${C.koraal}"/>` :
      `<path d="${BODY}" fill="url(#b)"/><ellipse cx="29" cy="35" rx="10" ry="5.5" transform="rotate(-38 29 35)" fill="#fff" opacity=".32"/>`;
    return `<svg viewBox="-8 -6 116 108" width="${px}" height="${px}" aria-hidden="true" style="overflow:visible;display:block">
      <defs><radialGradient id="b" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#FF8C70"/><stop offset=".55" stop-color="#FF6A4D"/><stop offset="1" stop-color="#EE5236"/></radialGradient></defs>
      ${simple ? '' : '<ellipse class="shadow" cx="44" cy="99" rx="28" ry="3.5" fill="#2A1E17" opacity=".12"/>'}
      <g class="lijf">${back}${shade}${cheeks}<g class="face">${face}</g>${front}</g>${extra}</svg>`.replace(/url\(#b\)/g, `url(#b${id})`).replace('id="b"', `id="b${id}"`);
  }
  const DENKER_CSS = `:host{display:inline-block;line-height:0;vertical-align:middle}
    .eye{transform-box:fill-box;transform-origin:center;animation:blink 5.2s infinite}
    .eye:nth-child(2){animation-delay:.04s}
    @keyframes blink{0%,93%,100%{transform:scaleY(1)}95.5%{transform:scaleY(.12)}}
    .dot{animation:float 2.4s cubic-bezier(.45,0,.55,1) infinite}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
    .pupils{transition:transform .25s cubic-bezier(.2,.8,.2,1)}
    .wave{transform-origin:76px 50px;animation:wave 1.8s cubic-bezier(.45,0,.55,1) infinite}
    @keyframes wave{0%,60%,100%{transform:rotate(0)}12%,36%{transform:rotate(-26deg)}24%,48%{transform:rotate(8deg)}}
    :host([expr=juichen]) .lijf{transform-origin:44px 94px;animation:hop .9s cubic-bezier(.3,1.5,.5,1) infinite}
    @keyframes hop{0%,55%,100%{transform:translateY(0) scale(1,1)}10%{transform:translateY(0) scale(1.06,.92)}28%{transform:translateY(-9px) scale(.96,1.05)}45%{transform:translateY(0) scale(1.04,.96)}}
    .armL{transform-origin:14px 50px;animation:cheerL .9s ease-in-out infinite}.armR{transform-origin:74px 46px;animation:cheerR .9s ease-in-out infinite}
    @keyframes cheerL{0%,100%{transform:rotate(0)}30%{transform:rotate(-14deg)}}@keyframes cheerR{0%,100%{transform:rotate(0)}30%{transform:rotate(14deg)}}
    .star{transform-box:fill-box;transform-origin:center;animation:twinkle 1.8s ease-in-out infinite}
    @keyframes twinkle{0%,100%{transform:rotate(0) scale(1)}50%{transform:rotate(18deg) scale(1.12)}}
    .thumb{transform-origin:78px 70px;animation:thumb 2.4s ease-in-out infinite}
    @keyframes thumb{0%,70%,100%{transform:rotate(0)}80%{transform:rotate(-10deg)}90%{transform:rotate(4deg)}}
    :host([expr=slapen]) .lijf{transform-origin:44px 94px;animation:breathe 3.6s ease-in-out infinite}
    @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.03,.98)}}
    .sleepdot{animation:none}
    .z{animation:zz 3.6s ease-out infinite;opacity:0}.z2{animation-delay:1.2s}
    @keyframes zz{0%{opacity:0;transform:translate(0,4px)}25%{opacity:1}100%{opacity:0;transform:translate(6px,-10px)}}
    :host([calm]) .z{opacity:1}
    :host([pop]) svg{animation:pop .5s cubic-bezier(.3,1.6,.5,1) both}
    @keyframes pop{0%{transform:scale(.3);opacity:0}100%{transform:scale(1);opacity:1}}
    ${CALM_CSS}`;
  class Denker extends Base {
    static get observedAttributes() { return ['expr', 'size', 'simple']; }
    constructor() { super(); this._id = ++uid; this._mv = (e) => this.look(e); }
    connectedCallback() { super.connectedCallback(); if (this.hasAttribute('volg')) { window.addEventListener('pointerdown', this._mv); window.addEventListener('pointermove', this._mv); } }
    disconnectedCallback() { super.disconnectedCallback(); window.removeEventListener('pointerdown', this._mv); window.removeEventListener('pointermove', this._mv); }
    look(e) {
      if (window.leerKalm()) return;
      const p = this.shadowRoot && this.shadowRoot.querySelector('.pupils'); if (!p) return;
      const r = this.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1; const k = Math.min(1, d / 300) * 3;
      p.style.transform = `translate(${(dx / d) * k}px, ${(dy / d) * k}px)`;
    }
    render() {
      const s = this.a('size', '64'); this.style.setProperty('--s', /\D/.test(s) ? s : s + 'px');
      const simple = this.hasAttribute('simple') || parseInt(s) < 36;
      const px = parseFloat(s) || 64; this.shadowRoot.innerHTML = `<style>${DENKER_CSS}</style>${denkerSVG(this.a('expr', 'denken'), this._id, simple, px)}`;
    }
  }
  customElements.define('leer-denker', Denker);

  /* ---------- Logo ---------- */
  const WORD = 'M177 11Q88 11 44.0 -38.5Q0 -88 0 -186V-637Q0 -675 19.5 -694.5Q39 -714 76 -714Q112 -714 131.5 -694.5Q151 -675 151 -637V-192Q151 -151 168.5 -131.5Q186 -112 215 -112Q223 -112 230.0 -113.0Q237 -114 245 -114Q261 -116 267.5 -104.5Q274 -93 274 -59Q274 -29 262.0 -13.5Q250 2 225 7Q215 8 202.0 9.5Q189 11 177 11ZM571 11Q484 11 421.5 -20.5Q359 -52 325.5 -109.5Q292 -167 292 -245Q292 -321 324.0 -378.5Q356 -436 413.5 -468.5Q471 -501 544 -501Q597 -501 640.0 -483.5Q683 -466 714.0 -433.5Q745 -401 761.0 -354.5Q777 -308 777 -251Q777 -232 765.0 -222.5Q753 -213 730 -213H435Q442 -165 469 -138Q504 -102 574 -102Q598 -102 629.0 -108.0Q660 -114 687 -127Q710 -138 728.0 -134.5Q746 -131 756.0 -118.0Q766 -105 767.5 -88.0Q769 -71 760.0 -54.5Q751 -38 730 -27Q696 -8 653.5 1.5Q611 11 571 11ZM435 -291H652Q650 -323 640 -346Q628 -373 605.5 -387.0Q583 -401 550 -401Q513 -401 487.0 -384.0Q461 -367 447 -335Q438 -315 435 -291ZM1108 11Q1021 11 958.5 -20.5Q896 -52 862.5 -109.5Q829 -167 829 -245Q829 -321 861.0 -378.5Q893 -436 950.5 -468.5Q1008 -501 1081 -501Q1134 -501 1177.0 -483.5Q1220 -466 1251.0 -433.5Q1282 -401 1298.0 -354.5Q1314 -308 1314 -251Q1314 -232 1302.0 -222.5Q1290 -213 1267 -213H972Q979 -165 1006 -138Q1041 -102 1111 -102Q1135 -102 1166.0 -108.0Q1197 -114 1224 -127Q1247 -138 1265.0 -134.5Q1283 -131 1293.0 -118.0Q1303 -105 1304.5 -88.0Q1306 -71 1297.0 -54.5Q1288 -38 1267 -27Q1233 -8 1190.5 1.5Q1148 11 1108 11ZM972 -291H1189Q1187 -323 1177 -346Q1165 -373 1142.5 -387.0Q1120 -401 1087 -401Q1050 -401 1024.0 -384.0Q998 -367 984 -335Q975 -315 972 -291ZM1468 9Q1430 9 1410.0 -11.0Q1390 -31 1390 -68V-423Q1390 -460 1409.5 -479.5Q1429 -499 1464 -499Q1500 -499 1519.0 -479.5Q1538 -460 1538 -423V-405Q1552 -441 1581 -464Q1622 -497 1687 -501Q1712 -503 1725.5 -488.5Q1739 -474 1740 -441Q1742 -410 1727.5 -392.0Q1713 -374 1679 -370L1656 -368Q1599 -363 1571.5 -335.0Q1544 -307 1544 -254V-68Q1544 -31 1524.5 -11.0Q1505 9 1468 9ZM2090 9Q2053 9 2033.5 -11.0Q2014 -31 2014 -68V-423Q2014 -460 2033.5 -479.5Q2053 -499 2088 -499Q2124 -499 2143.0 -479.5Q2162 -460 2162 -423V-419Q2184 -454 2220 -475Q2265 -501 2323 -501Q2382 -501 2420.0 -478.5Q2458 -456 2477.0 -410.5Q2496 -365 2496 -295V-68Q2496 -31 2476.5 -11.0Q2457 9 2420 9Q2384 9 2364.5 -11.0Q2345 -31 2345 -68V-288Q2345 -339 2326.5 -361.5Q2308 -384 2270 -384Q2222 -384 2193.5 -354.0Q2165 -324 2165 -274V-68Q2165 9 2090 9ZM2778 11Q2716 11 2675.0 -12.0Q2634 -35 2614.5 -81.5Q2595 -128 2595 -197V-423Q2595 -461 2614.5 -480.0Q2634 -499 2670.0 -499.0Q2706 -499 2726.0 -480.0Q2746 -461 2746 -423V-193Q2746 -149 2764.0 -127.5Q2782 -106 2821 -106Q2864 -106 2891.5 -136.5Q2919 -167 2919 -217V-423Q2919 -461 2938.5 -480.0Q2958 -499 2994 -499Q3031 -499 3050.5 -480.0Q3070 -461 3070 -423V-68Q3070 9 2997 9Q2961 9 2942 -11Q2923 -31 2923 -67Q2904 -37 2875 -17Q2834 11 2778 11Z';
  const WDOT = 'M1839 5Q1799 5 1775.5 -19.0Q1752 -43 1752 -81Q1752 -118 1775.5 -141.5Q1799 -165 1839 -165Q1879 -165 1901.5 -141.5Q1924 -118 1924 -81Q1924 -43 1901.5 -19.0Q1879 5 1839 5Z';
  function logoDenker(id, ink) {
    return `<defs><radialGradient id="lg${id}" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#FF8C70"/><stop offset=".55" stop-color="#FF6A4D"/><stop offset="1" stop-color="#EE5236"/></radialGradient></defs>
      <path d="${BODY}" fill="url(#lg${id})"/><ellipse cx="29" cy="35" rx="10" ry="5.5" transform="rotate(-38 29 35)" fill="#fff" opacity=".3"/>
      <g class="eyes"><ellipse cx="47.5" cy="44.5" rx="5.4" ry="7.8" transform="rotate(-12 47.5 44.5)" fill="${C.cacao}"/><ellipse cx="64.5" cy="42.5" rx="5.4" ry="7.8" transform="rotate(-12 64.5 42.5)" fill="${C.cacao}"/>
      <circle cx="49.3" cy="40.6" r="1.8" fill="#fff"/><circle cx="66.3" cy="38.6" r="1.8" fill="#fff"/></g>
      <circle class="tdot" cx="86" cy="16" r="6.5" fill="${ink}"/>`;
  }
  class Logo extends Base {
    static get observedAttributes() { return ['variant', 'kleur', 'height']; }
    constructor() { super(); this._id = ++uid; }
    render() {
      const v = this.a('variant', 'liggend'), k = this.a('kleur', 'kleur'), h = this.a('height', '40');
      const ink = k === 'wit' ? '#FFFFFF' : C.cacao; const pdot = k === 'kleur' ? C.koraal : ink;
      let svg;
      if (v === 'icoon') {
        svg = `<svg viewBox="0 0 100 100" height="${h}" role="img" aria-label="leer.nu"><defs><linearGradient id="ig${this._id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8466"/><stop offset="1" stop-color="#F0553A"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="url(#ig${this._id})"/><ellipse cx="30" cy="26" rx="18" ry="8" transform="rotate(-30 30 26)" fill="#fff" opacity=".18"/>
          <ellipse cx="44" cy="52" rx="6.5" ry="9.5" transform="rotate(-12 44 52)" fill="${C.cacao}"/><ellipse cx="64" cy="49" rx="6.5" ry="9.5" transform="rotate(-12 64 49)" fill="${C.cacao}"/><circle cx="46.2" cy="47.4" r="2.2" fill="#fff"/><circle cx="66.2" cy="44.4" r="2.2" fill="#fff"/>
          <ellipse cx="34" cy="68" rx="6" ry="3.6" fill="#FF3D6E" opacity=".28"/><ellipse cx="75" cy="63" rx="6" ry="3.6" fill="#FF3D6E" opacity=".28"/><circle class="tdot" cx="80" cy="22" r="6.5" fill="${C.cacao}"/></svg>`;
      } else if (v === 'beeldmerk') {
        svg = `<svg viewBox="0 0 100 100" height="${h}" role="img" aria-label="leer.nu">${logoDenker(this._id, ink)}</svg>`;
      } else if (v === 'staand') {
        svg = `<svg viewBox="-40 -1800 3150 1830" height="${h}" role="img" aria-label="leer.nu"><g transform="translate(990 -1780) scale(11.5)">${logoDenker(this._id, ink)}</g><path d="${WORD}" fill="${ink}"/><path class="wdot" d="${WDOT}" fill="${pdot}"/></svg>`;
      } else {
        svg = `<svg viewBox="0 -922.75 4231.13 936.75" height="${h}" role="img" aria-label="leer.nu"><g transform="translate(-66.51 -1028.06) scale(11.09)">${logoDenker(this._id, ink)}</g><g transform="translate(1161.13 0)"><path d="${WORD}" fill="${ink}"/><path class="wdot" d="${WDOT}" fill="${pdot}"/></g></svg>`;
      }
      this.shadowRoot.innerHTML = `<style>:host{display:inline-block;line-height:0}svg{display:block;overflow:visible}
        .tdot{animation:float 2.4s cubic-bezier(.45,0,.55,1) infinite}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
        .wdot{transform-box:fill-box;transform-origin:bottom center}:host(:hover) .wdot{animation:hop .6s cubic-bezier(.3,1.6,.5,1)}
        @keyframes hop{0%,100%{transform:translateY(0) scale(1)}15%{transform:scale(1.2,.8)}45%{transform:translateY(-120%) scale(.9,1.1)}75%{transform:scale(1.1,.9)}}
        .eyes{transform-box:fill-box;transform-origin:center;animation:blink 6s infinite}@keyframes blink{0%,94%,100%{transform:scaleY(1)}96%{transform:scaleY(.15)}}
        ${CALM_CSS}</style>${svg}`;
    }
  }
  customElements.define('leer-logo', Logo);

  /* ---------- Vakicoon ---------- */
  function glyph(vak, col) {
    const w = '#fff';
    switch (vak) {
      case 'topo': return `<path d="M24 7C16 7 11 13 11 20.5C11 30 24 41 24 41S37 30 37 20.5C37 13 32 7 24 7Z" fill="${w}"/><circle cx="24" cy="20" r="5.5" fill="${col}"/>`;
      case 'rekenen': return `<rect x="9" y="19" width="20" height="6" rx="3" fill="${w}"/><rect x="16" y="12" width="6" height="20" rx="3" fill="${w}"/><rect x="28" y="30" width="12" height="4.6" rx="2.3" transform="rotate(45 34 32.3)" fill="${w}"/><rect x="28" y="30" width="12" height="4.6" rx="2.3" transform="rotate(-45 34 32.3)" fill="${w}"/>`;
      case 'taal': return `<path d="M10 11H38A4 4 0 0 1 42 15V31A4 4 0 0 1 38 35H22L14 41V35H10A4 4 0 0 1 6 31V15A4 4 0 0 1 10 11Z" fill="${w}"/><text x="24" y="29.5" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="15" fill="${col}">Aa</text>`;
      case 'klok': return `<circle cx="24" cy="24" r="16" fill="${w}"/><rect x="22" y="13" width="4" height="13" rx="2" fill="${col}"/><rect x="22" y="22" width="4" height="10" rx="2" transform="rotate(-60 24 24)" fill="${col}"/><circle cx="24" cy="24" r="3" fill="${col}"/>`;
      case 'vlaggen': return `<rect x="11" y="7" width="4.5" height="35" rx="2.25" fill="${w}"/><path d="M15 9C22 6 27 13 38 10V26C27 29 22 22 15 25Z" fill="${w}"/>`;
      case 'tijdvakken': return `<rect x="11" y="7" width="26" height="5" rx="2.5" fill="${w}"/><rect x="11" y="36" width="26" height="5" rx="2.5" fill="${w}"/><path d="M14 12H34L24 24Z M14 36H34L24 24Z" fill="${w}"/><path d="M19 36H29L24 31Z" fill="${col}"/>`;
    }
    return '';
  }
  class Vak extends Base {
    static get observedAttributes() { return ['vak', 'size', 'vorm']; }
    render() {
      const v = this.a('vak', 'topo'), s = this.a('size', '48'), c = VAK[v] || VAK.topo, vorm = this.a('vorm', 'tegel');
      const body = vorm === 'glyph' ? `<svg viewBox="0 0 48 48" width="${s}" height="${s}">${glyph(v, c.f).replace(/#fff"/g, c.d + '"').replace(new RegExp(c.f, 'g'), '#fff')}</svg>`
        : `<svg viewBox="0 0 48 52" width="${s}" height="${s * 52 / 48}"><rect y="4" width="48" height="48" rx="15" fill="${c.d}"/><rect width="48" height="48" rx="15" fill="${c.f}"/><ellipse cx="14" cy="9" rx="10" ry="4" fill="#fff" opacity=".22"/>${glyph(v, c.f)}</svg>`;
      this.shadowRoot.innerHTML = `<style>:host{display:inline-block;line-height:0}svg{display:block}</style>${body}`;
    }
  }
  customElements.define('leer-vak', Vak);

  /* ---------- Avatars ---------- */
  const AV = {
    zon: { bg: '#FFE7A3', f: (e) => `${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<circle cx="${50 + 33 * Math.cos(a * Math.PI / 180)}" cy="${52 + 33 * Math.sin(a * Math.PI / 180)}" r="6" fill="#FFB020"/>`).join('')}<circle cx="50" cy="52" r="24" fill="#FFC93C"/>${e(43, 50)}${e(57, 50)}` },
    wolk: { bg: '#D6EEFF', f: (e) => `<circle cx="36" cy="56" r="15" fill="#fff"/><circle cx="54" cy="46" r="20" fill="#fff"/><circle cx="68" cy="60" r="13" fill="#fff"/><rect x="24" y="56" width="56" height="17" rx="8.5" fill="#fff"/>${e(46, 56)}${e(60, 55)}` },
    bloem: { bg: '#FDE0EE', f: (e) => `<rect x="47" y="60" width="6" height="30" rx="3" fill="#2E9E5B"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${50 + 17 * Math.cos((a - 90) * Math.PI / 180)}" cy="${44 + 17 * Math.sin((a - 90) * Math.PI / 180)}" r="12" fill="#EE5A9E"/>`).join('')}<circle cx="50" cy="44" r="13" fill="#FFC93C"/>${e(45, 43, .8)}${e(55, 42, .8)}` },
    vis: { bg: '#D3F4EE', f: (e) => `<path d="M72 50L90 36V66Z" fill="#FF8B2B"/><ellipse cx="48" cy="51" rx="28" ry="19" fill="#FF8B2B"/><circle cx="62" cy="44" r="0" fill="#fff"/>${e(36, 47)}<path d="M40 60Q46 63 52 60" stroke="#2A1E17" stroke-width="3" fill="none" stroke-linecap="round"/>` },
    raket: { bg: '#E6E7FF', f: (e) => `<path d="M34 64L26 78H40Z M66 64L74 78H60Z" fill="#E03553"/><rect x="36" y="30" width="28" height="44" rx="14" fill="#fff" stroke="#C9CCF5" stroke-width="2"/><path d="M36 42Q50 10 64 42Z" fill="#E03553"/><circle cx="50" cy="52" r="8" fill="#5C5FE6"/><path d="M44 76H56L50 90Z" fill="#FFC93C"/>` },
    kat: { bg: '#FFE6D6', f: (e) => `<path d="M28 44L30 18L48 34Z M72 44L70 18L52 34Z" fill="#8C6A55"/><circle cx="50" cy="54" r="26" fill="#8C6A55"/>${e(41, 50)}${e(59, 50)}<ellipse cx="50" cy="62" rx="3.5" ry="2.5" fill="#FF7A8A"/>` },
    robot: { bg: '#E3E9EF', f: (e) => `<rect x="47" y="14" width="6" height="14" rx="3" fill="#6A7D8E"/><circle cx="50" cy="14" r="6" fill="#E03553"/><rect x="24" y="28" width="52" height="46" rx="14" fill="#8FA3B5"/><rect x="33" y="40" width="34" height="18" rx="9" fill="#2A1E17"/><circle cx="43" cy="49" r="4" fill="#5FE3C8"/><circle cx="57" cy="49" r="4" fill="#5FE3C8"/><rect x="40" y="63" width="20" height="4" rx="2" fill="#6A7D8E"/>` },
    boot: { bg: '#D6EEFF', f: (e) => `<rect x="49" y="18" width="4" height="46" rx="2" fill="#8C6A55"/><path d="M53 20L76 58H53Z" fill="#fff" stroke="#C9DDF0" stroke-width="2"/><path d="M47 28L30 58H47Z" fill="#FFC93C"/><path d="M20 64H80L70 80H30Z" fill="#E03553"/><path d="M14 84Q26 78 38 84T62 84T86 84" stroke="#2E8BF2" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  };
  window.LEER_AVATARS = ['zon', 'wolk', 'bloem', 'vis', 'raket', 'kat', 'robot', 'boot'];
  class Avatar extends Base {
    static get observedAttributes() { return ['kind', 'size', 'letter']; }
    render() {
      const k = this.a('kind', ''), s = this.a('size', '48'), av = AV[k];
      const eye = (x, y, sc) => `<ellipse cx="${x}" cy="${y}" rx="${3 * (sc || 1)}" ry="${4.4 * (sc || 1)}" transform="rotate(-12 ${x} ${y})" fill="#2A1E17"/>`;
      const body = av ? `<svg viewBox="0 0 100 100" width="${s}" height="${s}"><circle cx="50" cy="50" r="50" fill="${av.bg}"/><g clip-path="circle(50px at 50px 50px)">${av.f(eye)}</g></svg>`
        : `<svg viewBox="0 0 100 100" width="${s}" height="${s}"><circle cx="50" cy="50" r="50" fill="#FFD9CF"/><text x="50" y="68" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="50" fill="#C8412A">${(this.a('letter', 'S') || 'S').slice(0, 1).toUpperCase()}</text></svg>`;
      this.shadowRoot.innerHTML = `<style>:host{display:inline-block;line-height:0;border-radius:50%}svg{display:block}</style>${body}`;
    }
  }
  customElements.define('leer-avatar', Avatar);

  /* ---------- Diploma-embleem ---------- */
  class Embleem extends Base {
    static get observedAttributes() { return ['vak', 'pct', 'status', 'label', 'size', 'slot-lock']; }
    constructor() { super(); this._id = ++uid; }
    render() {
      const v = VAK[this.a('vak', 'topo')] || VAK.topo, pct = Math.max(0, Math.min(100, +this.a('pct', '0'))), st = this.a('status', 'bezig'), s = +this.a('size', '96'), lab = this.a('label', '');
      const R = 40, L = 2 * Math.PI * R, got = st === 'gehaald', rijp = st === 'rijp';
      const disc = got ? `<circle cx="50" cy="50" r="31" fill="${C.geel}"/><circle cx="50" cy="50" r="31" fill="none" stroke="${C.geelDiep}" stroke-opacity=".35" stroke-width="2"/>${star(50, 44, 9, '#fff').replace(`stroke="${C.geelDiep}"`, 'stroke="none"')}`
        : `<circle cx="50" cy="50" r="31" fill="${st === 'niet' ? '#fff' : v.t}"/>`;
      const txt = `<text x="50" y="${got ? 67 : 58}" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="${got ? 13 : (lab.length > 3 ? 16 : 22)}" fill="${got ? C.cacao : v.d}">${lab}</text>`;
      const ribbons = `<path d="M34 76L28 96L38 91L42 99L47 80Z" fill="${got ? v.f : '#E9DCCD'}"/><path d="M66 76L72 96L62 91L58 99L53 80Z" fill="${got ? v.d : '#DCCBB8'}"/>`;
      this.shadowRoot.innerHTML = `<style>:host{display:inline-block;line-height:0}svg{display:block;overflow:visible}
        .ring{transition:stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)}
        .rijp{animation:glow 2s ease-in-out infinite;transform-origin:50px 50px}@keyframes glow{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        ${CALM_CSS}</style>
        <svg viewBox="0 0 100 104" width="${s}" height="${s * 1.04}">${ribbons}
        <circle cx="50" cy="50" r="46" fill="#fff"/>${rijp ? `<circle class="rijp" cx="50" cy="50" r="47" fill="none" stroke="${C.geel}" stroke-width="3" stroke-dasharray="3 5"/>` : ''}
        <circle cx="50" cy="50" r="${R}" fill="none" stroke="${v.t}" stroke-width="8"/>
        <circle class="ring" cx="50" cy="50" r="${R}" fill="none" stroke="${got ? v.f : v.f}" stroke-width="8" stroke-linecap="round" transform="rotate(-90 50 50)" stroke-dasharray="${L}" stroke-dashoffset="${L}"/>
        ${disc}${txt}</svg>`;
      const ring = this.shadowRoot.querySelector('.ring'); const off = L * (1 - (got ? 1 : pct / 100));
      if (window.leerKalm()) ring.style.strokeDashoffset = off; else requestAnimationFrame(() => requestAnimationFrame(() => (ring.style.strokeDashoffset = off)));
    }
  }
  customElements.define('leer-embleem', Embleem);

  /* ---------- UI-iconen (eenvoudige vormen) ---------- */
  const IC = {
    goed: '<path d="M6 12.5L10 16.5L18 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>',
    fout: '<path d="M7 7L17 17M17 7L7 17" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>',
    bijna: '<path d="M5 12H17M12 6.5L17.5 12L12 17.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>',
    slot: '<rect x="5" y="10.5" width="14" height="10" rx="3" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.6"/>',
    ster: '<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8z" fill="currentColor"/>',
    huis: '<path d="M4 11L12 4L20 11V19A2 2 0 0 1 18 21H6A2 2 0 0 1 4 19Z" fill="currentColor"/><rect x="10" y="14" width="4" height="7" rx="1.5" fill="#fff"/>',
    jij: '<circle cx="12" cy="8.5" r="4.5" fill="currentColor"/><path d="M4 20.5C4 16 7.6 13.5 12 13.5S20 16 20 20.5Z" fill="currentColor"/>',
    kroon: '<path d="M3.5 8L8 12L12 5L16 12L20.5 8L19 18.5H5Z" fill="currentColor"/>',
    pijl: '<path d="M9 5.5L15.5 12L9 18.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    terug: '<path d="M15 5.5L8.5 12L15 18.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    neer: '<path d="M5.5 9L12 15.5L18.5 9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    plus: '<path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    min: '<path d="M5 12H19" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    luid: '<path d="M4 9.5H8L13 5V19L8 14.5H4Z" fill="currentColor"/><path d="M16 8.5Q19 12 16 15.5M18.5 6Q23 12 18.5 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    kruis: '<path d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    klok: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M12 7.5V12L15 14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    hart: '<path d="M12 20S3.5 14.5 3.5 8.8A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8.5 1.8C20.5 14.5 12 20 12 20Z" fill="currentColor"/>',
    print: '<rect x="6" y="3.5" width="12" height="6" rx="1.5" fill="currentColor"/><rect x="3" y="9" width="18" height="8.5" rx="2.5" fill="currentColor"/><rect x="7" y="14" width="10" height="7" rx="1.5" fill="#fff" stroke="currentColor" stroke-width="2"/>',
    vraag: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M9.5 9.5A2.6 2.6 0 1 1 12 12.5V14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17.3" r="1.4" fill="currentColor"/>',
    zoom: '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M15 15L20 20" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
    vlag: '<rect x="5" y="3" width="2.6" height="18" rx="1.3" fill="currentColor"/><path d="M7.6 4.5C11 3 13.5 6.5 19 5V13C13.5 14.5 11 11 7.6 12.5Z" fill="currentColor"/>',
    bliksem: '<path d="M13.5 2.5L5 13.5H11L10 21.5L19 10H13Z" fill="currentColor"/>',
    doel: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
    wijs: '<path d="M9 3.5A1.8 1.8 0 0 1 12.6 3.5V11L17.8 11.8A2.6 2.6 0 0 1 20 14.4L19 20.5H10L5.5 14.5A1.7 1.7 0 0 1 8.2 12.4L9 13.4Z" fill="currentColor"/>',
    lijst: '<rect x="3.5" y="4.5" width="17" height="4" rx="2" fill="currentColor"/><rect x="3.5" y="10" width="17" height="4" rx="2" fill="currentColor"/><rect x="3.5" y="15.5" width="11" height="4" rx="2" fill="currentColor"/>',
    typ: '<rect x="2.5" y="6" width="19" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M6 10H7.5M10 10H11.5M14 10H15.5M18 10H18.5M7 14H17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    kompas: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 8.5L13.2 13.2L8.5 15.5L10.8 10.8Z" fill="currentColor"/>',
    toets: '<rect x="5" y="3" width="14" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M8.5 9L10 10.5L13 7.5M8.5 15H15.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    herhaal: '<path d="M19 12A7 7 0 1 1 16.5 6.6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M17.5 3V7.5H13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    diploma: '<rect x="3" y="4.5" width="18" height="12" rx="2.5" fill="currentColor"/><circle cx="15.5" cy="16" r="3.5" fill="currentColor" stroke="#fff" stroke-width="1.6"/><path d="M13.5 18.5L13 22L15.5 20.8L18 22L17.5 18.5" fill="currentColor"/><path d="M6.5 8.5H13M6.5 11.5H11" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>',
    prullenbak: '<path d="M4.5 6.5H19.5M9.5 6.5V4.5H14.5V6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M6.5 8.5H17.5L16.5 20H7.5Z" fill="currentColor"/>',
    potlood: '<path d="M4 20L5 15.5L15.5 5A2.1 2.1 0 0 1 18.5 5L19 5.5A2.1 2.1 0 0 1 19 8.5L8.5 19Z" fill="currentColor"/>',
    grafiek: '<rect x="4" y="12" width="4" height="8" rx="1.5" fill="currentColor"/><rect x="10" y="7" width="4" height="13" rx="1.5" fill="currentColor"/><rect x="16" y="3.5" width="4" height="16.5" rx="1.5" fill="currentColor"/>',
    geheugen: '<circle cx="9" cy="10" r="5.5" fill="currentColor"/><circle cx="15" cy="10" r="5.5" fill="currentColor"/><rect x="7" y="13" width="10" height="7" rx="3" fill="currentColor"/>',
    bestand: '<path d="M6 3H14L19 8V21H6Z" fill="currentColor"/><path d="M14 3V8H19" fill="#fff" opacity=".5"/><path d="M12.5 17V11M10 13.5L12.5 11L15 13.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    uit: '<path d="M10 4.5H6A2 2 0 0 0 4 6.5V17.5A2 2 0 0 0 6 19.5H10M14 8L18.5 12L14 16M18.5 12H9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    sleutel: '<circle cx="8" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M12.5 12H20.5M17.5 12V15.5M20 12V14.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    ouder: '<circle cx="8.5" cy="7.5" r="3.5" fill="currentColor"/><circle cx="16.5" cy="9.5" r="2.8" fill="currentColor"/><path d="M2.5 20C2.5 15.5 5 13 8.5 13S14.5 15.5 14.5 20Z M13.5 20C13.5 16.5 15 14.2 17 14.2S21.5 16.5 21.5 20Z" fill="currentColor"/>',
  };
  class Icoon extends Base {
    static get observedAttributes() { return ['naam', 'size']; }
    render() { const s = this.a('size', '24'); this.shadowRoot.innerHTML = `<style>:host{display:inline-block;line-height:0;flex:none}svg{display:block}</style><svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${IC[this.a('naam', 'ster')] || ''}</svg>`; }
  }
  customElements.define('leer-icoon', Icoon);

  /* ---------- Feest: sterren/confetti uit een element ---------- */
  const CONF = ['#FF6A4D', '#FFC93C', '#12B3A0', '#2E8BF2', '#B15BE6', '#EE5A9E'];
  window.leerFeest = function (el, o) {
    o = o || {}; if (!el || window.leerKalm()) return;
    const r = el.getBoundingClientRect(); const x0 = r.left + r.width * (o.ox ?? 0.5), y0 = r.top + r.height * (o.oy ?? 0.5);
    const n = o.count || (o.type === 'confetti' ? 60 : 12); const layer = document.createElement('div');
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden'; document.body.appendChild(layer);
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div'); const isStar = o.type !== 'confetti' || i % 4 === 0;
      const sz = isStar ? 10 + Math.random() * 10 : 7 + Math.random() * 6;
      const col = isStar ? '#FFC93C' : CONF[i % CONF.length];
      p.style.cssText = `position:absolute;left:${x0 - sz / 2}px;top:${y0 - sz / 2}px;width:${sz}px;height:${isStar ? sz : sz * 0.6}px;background:${col};border-radius:${isStar ? '0' : '2px'};${isStar ? 'clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' : ''}`;
      layer.appendChild(p);
      const a = o.type === 'confetti' ? (-Math.PI / 2 + (Math.random() - 0.5) * 2.2) : (i / n) * Math.PI * 2 + Math.random() * 0.3;
      const d = (o.type === 'confetti' ? 180 + Math.random() * 260 : 50 + Math.random() * 40) * (o.spread || 1);
      const dx = Math.cos(a) * d, dy = Math.sin(a) * d; const dur = o.type === 'confetti' ? 1400 + Math.random() * 900 : 700 + Math.random() * 250;
      p.animate(o.type === 'confetti'
        ? [{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${dx * 0.7}px,${dy}px) rotate(${Math.random() * 540}deg)`, opacity: 1, offset: 0.45 }, { transform: `translate(${dx}px,${dy + 420}px) rotate(${Math.random() * 900}deg)`, opacity: 0 }]
        : [{ transform: 'translate(0,0) scale(.3)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(1) rotate(90deg)`, opacity: 1, offset: 0.6 }, { transform: `translate(${dx * 1.15}px,${dy * 1.15 + 14}px) scale(.6) rotate(140deg)`, opacity: 0 }],
        { duration: dur, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards', delay: o.type === 'confetti' ? Math.random() * 200 : 0 });
    }
    setTimeout(() => layer.remove(), 2800);
  };
  /* De punt vliegt: van element A naar element B (bv. feedback -> voortgangsbolletje) */
  window.leerVlieg = function (from, to, o) {
    o = o || {}; if (!from || !to || window.leerKalm()) { o.done && o.done(); return; }
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect(); const s = o.size || 14;
    const d = document.createElement('div'); d.style.cssText = `position:fixed;left:${a.left + a.width / 2 - s / 2}px;top:${a.top + a.height / 2 - s / 2}px;width:${s}px;height:${s}px;border-radius:50%;background:${o.color || '#2A1E17'};z-index:9999;pointer-events:none`;
    document.body.appendChild(d);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    d.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 80}px) scale(1.3)`, offset: 0.5 }, { transform: `translate(${dx}px,${dy}px) scale(.7)` }], { duration: o.duration || 560, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' })
      .onfinish = () => { d.remove(); o.done && o.done(); };
  };
})();
