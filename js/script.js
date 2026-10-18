const euro = new Intl.NumberFormat('nl-BE', { style:'currency', currency:'EUR' });

const kaart = [
  /* kort = label in de categoriebalk bovenaan */
  { kop:'Water & fris', kort:'Fris', items:[
    ['Waterfles (gymnast)', 1.5],
    ['Water plat/bruis', 2],
    ['Chocomelk koud', 2],
    ['Fristi', 2],
    ['Appelsap', 2],
    ['Cola', 2.5, ['Gewoon', 'Zero']],
    ['Fanta', 2.5],
    ['Ice-tea', 3, ['Gewoon', 'Zero', 'Green']],
    ['Tonic', 3],
  ]},
  { kop:'Bier', kort:'Bier', items:[
    ['Jupiler', 2.5, ['Gewoon', '0%']],
    ['Kriek', 3.5, ['Gewoon', '0%']],
    ['Vedett', 3.5],
    ['Duvel', 4.5, ['Gewoon', '666']],
    ['Chouffe 0%', 4.5],
    ['Westmalle', 4.5, ['Dubbel', 'Tripel']],
  ]},
  { kop:'Wijn & bubbels', kort:'Wijn', items:[
    ['Witte wijn', 4],
    ['Cava', 5],
  ]},
  { kop:'Warm', kort:'Warm', items:[
    ['Koffie', 3, ['Gewoon', 'Deca']],
    ['Thee', 3],
    ['Chocomelk warm', 3],
    ['Soep', 3],
  ]},
  { kop:'Snacks', kort:'Snacks', items:[
    ['Chips', 2.5],
    ['Wafel', 2.5],
  ]},
];

/* binnen elke categorie alfabetisch (vóór de ids worden toegekend) */
for (const groep of kaart)
  groep.items.sort(([a], [b]) => a.localeCompare(b, 'nl', { sensitivity:'base' }));

/* volledige naam van een variant: 'Gewoon' = de basisnaam, anders bv. 'Ice-tea zero' */
const volledigeNaam = (naam, variant) =>
  variant === 'Gewoon' ? naam : `${naam} ${variant.toLowerCase()}`;

/* platte opzoektabel: id -> { naam, prijs }
   id = 'g-i' voor een gewoon item, 'g-i-v' voor een variant */
const dranken = {};
for (const [g, groep] of kaart.entries())
  for (const [i, [naam, prijs, varianten]] of groep.items.entries()) {
    if (!varianten) { dranken[`${g}-${i}`] = { naam, prijs }; continue; }
    for (const [v, variant] of varianten.entries())
      dranken[`${g}-${i}-${v}`] = { naam: volledigeNaam(naam, variant), prijs };
  }

const aantal = {};                                   /* id -> aantal */
const main        = document.querySelector('main');
const nav         = document.querySelector('nav');
const voettekst   = document.querySelector('body > footer');
const uitvoer     = voettekst.querySelector('output');
const wisKnop     = voettekst.querySelector('[data-actie="wis"]');
const overzichtKnop = voettekst.querySelector('[data-actie="overzicht"]');
const dialoog     = document.querySelector('dialog');
const dialoogLijst= dialoog.querySelector('ul');
const dialoogSom  = dialoog.querySelector('p span');

/* gewoon item: één knop met naam en prijs */
const itemHtml = (id, naam, prijs) => `
  <li><button data-id="${id}" data-aantal="0"
               aria-label="${naam}, ${euro.format(prijs)}">
     <strong>${naam}</strong><small>${euro.format(prijs)}</small>
   </button></li>`;

/* familie: naam + prijs één keer, daaronder een knop per variant */
const familieHtml = (id, naam, prijs, varianten) => `
  <li class="familie">
    <p><strong>${naam}</strong><small>${euro.format(prijs)}</small></p>
    <div>${varianten.map((variant, v) => `
      <button data-id="${id}-${v}" data-aantal="0"
              aria-label="${volledigeNaam(naam, variant)}, ${euro.format(prijs)}">
        <strong>${variant}</strong>
      </button>`).join('')}
    </div>
  </li>`;

/* menu opbouwen uit de kaart */
main.innerHTML = kaart.map((groep, g) => `
  <section id="cat-${g}">
    <h2>${groep.kop}</h2>
    <menu>
    ${groep.items.map(([naam, prijs, varianten], i) => varianten
        ? familieHtml(`${g}-${i}`, naam, prijs, varianten)
        : itemHtml(`${g}-${i}`, naam, prijs)).join('')}
    </menu>
  </section>`).join('');

/* categoriebalk: springt naar de sectie (smooth scroll + offset via CSS) */
nav.innerHTML = kaart.map((groep, g) => `<a href="#cat-${g}">${groep.kort}</a>`).join('');
const secties = [...main.querySelectorAll('section')];
const navLinks = [...nav.querySelectorAll('a')];

/* aangetikte categorie blijft gemarkeerd, ook als de pagina niet ver genoeg kan
   scrollen om ze bovenaan te krijgen; zelf scrollen geeft de markering weer vrij */
let gekozen = null;
nav.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a) return;
  gekozen = navLinks.indexOf(a);
  markeerCategorie();
});
for (const type of ['touchstart', 'wheel', 'keydown'])
  addEventListener(type, e => { if (!nav.contains(e.target)) gekozen = null; }, { passive:true });

/* actieve categorie markeren: de laatste sectie waarvan de top onder de balk zit */
function markeerCategorie(){
  let actief = gekozen;
  if (actief === null) {
    const grens = nav.getBoundingClientRect().bottom + 12;
    const onderaan = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
    actief = 0;
    secties.forEach((s, i) => { if (s.getBoundingClientRect().top <= grens) actief = i; });
    if (onderaan) actief = secties.length - 1;   /* korte laatste sectie haalt de top nooit */
  }
  navLinks.forEach((a, i) => a.toggleAttribute('aria-current', i === actief));
}
addEventListener('scroll', markeerCategorie, { passive:true });
markeerCategorie();

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
  overzichtKnop.disabled = leeg;

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
  if (leeg && dialoog.open) dialoog.close();   /* laatste item weg: overzicht sluiten */
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
  knop.classList.remove('verwijderd');      /* vorige animatie nog bezig: afbreken */
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
      /* korte 'tik' + vulling vervaagt; in dezelfde tick als het weghalen
         van 'houdt', zodat de terugtrek-transitie nooit start */
      knop.classList.add('verwijderd');
    }
  }, HOUD_MS);
});

main.addEventListener('pointermove', e => {
  if (houdTimer && Math.hypot(e.clientX - startX, e.clientY - startY) > MAX_BEWEGING)
    stopHouden();
});
for (const type of ['pointerup', 'pointercancel', 'pointerleave'])
  main.addEventListener(type, stopHouden);
main.addEventListener('animationend', e => {
  if (e.animationName === 'tik') e.target.classList.remove('verwijderd');
});

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

/* Wis: lang ingedrukt houden wist de hele bestelling; kort tikken toont een hint */
const WIS_MS = 800;
let wisTimer = null;
let gewist = false;         /* klik na het wissen niet als 'kort tikken' zien */
let hintTimer = null;
wisKnop.style.setProperty('--houd', WIS_MS + 'ms');

function stopWis(){
  clearTimeout(wisTimer);
  wisTimer = null;
  wisKnop.classList.remove('houdt');
}

wisKnop.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  gewist = false;
  wisKnop.classList.add('houdt');
  wisTimer = setTimeout(() => {
    gewist = true;
    stopWis();
    for (const id in aantal) delete aantal[id];
    if (navigator.vibrate) navigator.vibrate([15, 40, 15]);
    teken();
  }, WIS_MS);
});
for (const type of ['pointerup', 'pointercancel', 'pointerleave'])
  wisKnop.addEventListener(type, stopWis);
wisKnop.addEventListener('contextmenu', e => e.preventDefault());

wisKnop.addEventListener('click', () => {
  if (gewist) { gewist = false; return; }
  wisKnop.textContent = 'Houd ingedrukt';
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => { wisKnop.textContent = 'Wis'; }, 1500);
});

overzichtKnop.addEventListener('click', () => dialoog.showModal());

/* klik buiten het venster (op de achtergrond) = sluiten */
dialoog.addEventListener('click', e => {
  if (e.target !== dialoog) return;          /* klik op inhoud van het venster */
  const r = dialoog.getBoundingClientRect();
  const binnen = e.clientX >= r.left && e.clientX <= r.right &&
                 e.clientY >= r.top  && e.clientY <= r.bottom;
  if (!binnen) dialoog.close();
});

teken();

/* altijd verse bestanden (zie sw.js): omzeilt de 10 min cache van GitHub Pages */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

/* geïnstalleerde app blijft soms uren in het geheugen staan: na lang op de
   achtergrond herladen voor de laatste prijzen, maar nooit midden in een bestelling */
const HERLAAD_NA_MS = 30 * 60 * 1000;
let verborgenSinds = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { verborgenSinds = Date.now(); return; }
  if (verborgenSinds && Date.now() - verborgenSinds > HERLAAD_NA_MS && !regels().length)
    location.reload();
});
