const euro = new Intl.NumberFormat('nl-BE', { style:'currency', currency:'EUR' });

const kaart = [
  { kop:'Water & fris', items:[
    ['Waterfles (gymnast)', 1.5, 'rgb(193, 225, 255)'],
    ['Water plat/bruis', 2, 'rgb(193, 225, 255)'],
    ['Chocomelk koud', 2, '#613419'],
    ['Fristi', 2, '#f7c3dc'],
    ['Appelsap', 2, '#debb01'],
    ['Cola', 2.5, '#F40009'],
    ['Cola zero', 2.5, '#F40009', 'rgb(7, 4, 0)'],
    ['Fanta', 2.5, '#FF8300'],
    ['Ice-tea', 3, '#0236f0', '#e1c601', { tekst:'#f7f6f6' }],
    ['Ice-tea zero', 3, '#0236f0', '#e1c601', { tekst:'#f7f6f6' }],
    ['Ice-tea green', 3, '#0236f0', '#e1c601', 'rgb(0, 255, 64)', { tekst:'#f7f6f6' }],
    ['Tonic', 3, '#f8d866'],
  ]},
  { kop:'Bier', items:[
    ['Jupiler', 2.5, 'rgb(255, 0, 0)'],
    ['Jupiler 0%', 2.5, 'rgb(253, 0, 0)'],
    ['Kriek', 3.5, 'rgb(138, 0, 0)'],
    ['Kriek 0%', 3.5, 'rgb(138, 0, 0)'],
    ['Vedett', 3.5, '#f7f7f7', '#0a0a0a', '#e72625'],
    ['Duvel', 4.5, 'rgb(105, 63, 0)'],
    ['Duvel 666', 4.5, 'rgb(105, 63, 0)'],
    ['Chouffe 0%', 4.5, 'rgb(105, 63, 0)'],
    ['Westmalle dubbel', 4.5, 'rgb(105, 63, 0)'],
    ['Westmalle tripel', 4.5, 'rgb(105, 63, 0)'],
  ]},
  { kop:'Wijn & bubbels', items:[
    ['Witte wijn', 4, 'rgb(105, 63, 0)'],
    ['Cava', 5, 'rgb(105, 63, 0)'],
  ]},
  { kop:'Warm', items:[
    ['Koffie', 3, 'rgb(105, 63, 0)'],
    ['Koffie deca', 3, 'rgb(105, 63, 0)'],
    ['Thee', 3, 'rgb(105, 63, 0)'],
    ['Chocomelk warm', 3, 'rgb(105, 63, 0)'],
    ['Soep', 3, 'rgb(105, 63, 0)'],
  ]},
  { kop:'Snacks', items:[
    ['Chips', 2.5, 'rgb(105, 63, 0)'],
    ['Wafel', 2.5, 'rgb(105, 63, 0)'],
  ]},
];

/* platte opzoektabel: id -> { naam, prijs } */
const dranken = {};
for (const [g, groep] of kaart.entries())
  for (const [i, [naam, prijs]] of groep.items.entries())
    dranken[g + '-' + i] = { naam, prijs };

const aantal = {};                                   /* id -> aantal */
const main        = document.querySelector('main');
const voettekst   = document.querySelector('body > footer');
const uitvoer     = voettekst.querySelector('output');
const wisKnop     = voettekst.querySelector('[data-actie="wis"]');
const bestelKnop  = voettekst.querySelector('[data-actie="afrekenen"]');
const dialoog     = document.querySelector('dialog');
const dialoogLijst= dialoog.querySelector('ul');
const dialoogSom  = dialoog.querySelector('p span');
const bevestigKnop= dialoog.querySelector('button[value="bevestig"]');

/* relatieve luminantie (WCAG) van een CSS-kleur, of null als ongeldig */
const kleurCtx = document.createElement('canvas').getContext('2d');
function luminantie(kleur){
  /* laat de browser elke CSS-kleur (#fff, 'gold', rgb(...)) omzetten naar #rrggbb */
  kleurCtx.fillStyle = '#000';
  kleurCtx.fillStyle = kleur;
  const hex = kleurCtx.fillStyle;
  if (!hex.startsWith('#')) return null;              /* onbekend of transparant */
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/* tekstkleur die op ALLE kleuren (strepen) zo leesbaar mogelijk is:
   kies wit of donker op basis van het slechtste contrast */
function tekstKleur(luminanties){
  const metWit    = Math.min(...luminanties.map(L => 1.05 / (L + 0.05)));
  const metDonker = Math.min(...luminanties.map(L => (L + 0.05) / 0.061));
  return metWit > metDonker ? '#fff' : '#1b1630';
}

/* achtergrond: 1 kleur = effen, 2 = brede + smalle streep, 3+ = gelijke strepen */
function achtergrond(kleuren){
  if (kleuren.length === 1) return kleuren[0];
  let stops;
  if (kleuren.length === 2) {
    const [a, b] = kleuren;
    stops = `${a} 0 14px, ${b} 14px 20px`;
  } else {
    const w = 10;                                     /* breedte per streep in px */
    stops = kleuren.map((k, i) => `${k} ${i * w}px ${(i + 1) * w}px`).join(', ');
  }
  return `repeating-linear-gradient(45deg, ${stops})`;
}

function kleurStijl(kleuren, opties = {}){
  if (!kleuren.length) return '';
  const lum = kleuren.map(luminantie);
  if (lum.includes(null)) return '';                  /* ongeldige kleur: standaard look */
  /* tekstkleur: zelf opgegeven (en geldig) of automatisch */
  const eigen = opties.tekst && luminantie(opties.tekst) !== null;
  const tekst = eigen ? opties.tekst : tekstKleur(lum);
  /* halo tegengesteld aan de tekst: lichte tekst -> donkere halo en omgekeerd */
  const halo  = luminantie(tekst) > 0.179 ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)';
  const klasse = kleuren.length > 1 ? 'gekleurd gestreept' : 'gekleurd';
  return ` class="${klasse}" style="--kleur:${achtergrond(kleuren)};--tekst:${tekst};--halo:${halo}"`;
}

/* menu opbouwen uit de kaart */
main.innerHTML = kaart.map((groep, g) => `
  <section>
    <h2>${groep.kop}</h2>
    <menu>
    ${groep.items.map(([naam, prijs, ...kleuren], i) => {
        /* optioneel object op het einde, bv. { tekst:'#000' } */
        const opties = kleuren.at(-1) && typeof kleuren.at(-1) === 'object' ? kleuren.pop() : {};
        return `<li><button data-id="${g}-${i}" data-aantal="0"${kleurStijl(kleuren, opties)}
                     aria-label="${naam}, ${euro.format(prijs)}">
           <strong>${naam}</strong><small>${euro.format(prijs)}</small>
         </button></li>`;
      }).join('')}
    </menu>
  </section>`).join('');

const totaal = () =>
  Object.entries(aantal).reduce((som, [id, n]) => som + dranken[id].prijs * n, 0);

const regels = () => Object.entries(aantal).filter(([, n]) => n > 0);

function teken(){
  const t = totaal();
  const leeg = regels().length === 0;

  for (const knop of main.querySelectorAll('button[data-id]'))
    knop.dataset.aantal = aantal[knop.dataset.id] || 0;

  uitvoer.innerHTML = `<small>Totaal</small>${euro.format(t)}`;
  wisKnop.disabled = leeg;
  bestelKnop.disabled = leeg;

  dialoogLijst.innerHTML = regels().map(([id, n]) => {
    const d = dranken[id];
    return `<li>
      <span><strong>${d.naam}</strong>
      <small>${euro.format(d.prijs)} × ${n} = ${euro.format(d.prijs * n)}</small></span>
      <button data-min="${id}" aria-label="Minder ${d.naam}">−</button>
      <b>${n}</b>
      <button data-plus="${id}" aria-label="Meer ${d.naam}">+</button>
    </li>`;
  }).join('');

  dialoogSom.textContent = euro.format(t);
  bevestigKnop.disabled = leeg;
}

function wijzig(id, delta){
  const nieuw = Math.max(0, (aantal[id] || 0) + delta);
  if (nieuw === 0) delete aantal[id]; else aantal[id] = nieuw;
  if (delta > 0 && navigator.vibrate) navigator.vibrate(8);
  teken();
}

/* lang ingedrukt houden op een item = 1x verwijderen */
const HOUD_MS = 500;        /* hoe lang ingedrukt houden */
const MAX_BEWEGING = 10;    /* px: meer bewegen = scrollen, geen long-press */
let houdTimer = null;
let startX = 0, startY = 0;
let negeerKlik = false;     /* klik na een long-press niet als +1 tellen */
let houdKnop = null;        /* knop die nu aan het vullen is */
main.style.setProperty('--houd', HOUD_MS + 'ms');   /* animatieduur = HOUD_MS */

function stopHouden(){
  clearTimeout(houdTimer);
  houdTimer = null;
  if (houdKnop) houdKnop.classList.remove('houdt');
  houdKnop = null;
}

main.addEventListener('pointerdown', e => {
  const knop = e.target.closest('button[data-id]');
  if (!knop || e.button !== 0) return;
  negeerKlik = false;
  startX = e.clientX; startY = e.clientY;
  stopHouden();
  const id = knop.dataset.id;
  if (aantal[id]) {                         /* alleen vullen als er iets te verwijderen is */
    houdKnop = knop;
    knop.classList.add('houdt');
  }
  houdTimer = setTimeout(() => {
    negeerKlik = true;
    stopHouden();
    if (aantal[id]) {
      wijzig(id, -1);
      if (navigator.vibrate) navigator.vibrate([15, 40, 15]);
    }
  }, HOUD_MS);
});

main.addEventListener('pointermove', e => {
  if (houdTimer && Math.hypot(e.clientX - startX, e.clientY - startY) > MAX_BEWEGING)
    stopHouden();
});
for (const type of ['pointerup', 'pointercancel', 'pointerleave'])
  main.addEventListener(type, stopHouden);

/* geen contextmenu / 'kopiëren'-popup bij lang drukken */
main.addEventListener('contextmenu', e => {
  if (e.target.closest('button[data-id]')) e.preventDefault();
});

/* tikken op het menu */
main.addEventListener('click', e => {
  const knop = e.target.closest('button[data-id]');
  if (!knop) return;
  if (negeerKlik) { negeerKlik = false; return; }
  wijzig(knop.dataset.id, 1);
});

/* +/- binnen het dialoogvenster */
dialoogLijst.addEventListener('click', e => {
  const knop = e.target.closest('button');
  if (!knop) return;
  if (knop.dataset.plus) wijzig(knop.dataset.plus, 1);
  if (knop.dataset.min)  wijzig(knop.dataset.min, -1);
});

wisKnop.addEventListener('click', () => {
  for (const id in aantal) delete aantal[id];
  teken();
});

bestelKnop.addEventListener('click', () => {
  dialoog.returnValue = '';
  dialoog.showModal();
});

/* klik buiten het venster (op de achtergrond) = sluiten */
dialoog.addEventListener('click', e => {
  if (e.target !== dialoog) return;          /* klik op inhoud van het venster */
  const r = dialoog.getBoundingClientRect();
  const binnen = e.clientX >= r.left && e.clientX <= r.right &&
                 e.clientY >= r.top  && e.clientY <= r.bottom;
  if (!binnen) dialoog.close('sluit');
});

dialoog.addEventListener('close', () => {
  if (dialoog.returnValue !== 'bevestig') return;
  const tekst = regels()
    .map(([id, n]) => `${n}× ${dranken[id].naam}`)
    .join('\n');
  alert(`Bestelling:\n\n${tekst}\n\nTotaal: ${euro.format(totaal())}`);
  for (const id in aantal) delete aantal[id];
  teken();
});

teken();
