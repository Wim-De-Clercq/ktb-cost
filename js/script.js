const euro = new Intl.NumberFormat('nl-BE', { style:'currency', currency:'EUR' });

const kaart = [
  { kop:'Water & fris', items:[
    ['Waterfles (gymnast)', 1.5],
    ['Water plat/bruis', 2],
    ['Chocomelk koud', 2],
    ['Fristi', 2],
    ['Appelsap', 2],
    ['Cola', 2.5],
    ['Cola zero', 2.5],
    ['Fanta', 2.5],
    ['Ice-tea', 3],
    ['Ice-tea zero', 3],
    ['Ice-tea green', 3],
    ['Tonic', 3],
  ]},
  { kop:'Bier', items:[
    ['Jupiler', 2.5],
    ['Jupiler 0%', 2.5],
    ['Kriek', 3.5],
    ['Kriek 0%', 3.5],
    ['Vedett', 3.5],
    ['Duvel', 4.5],
    ['Duvel 666', 4.5],
    ['Chouffe 0%', 4.5],
    ['Westmalle dubbel', 4.5],
    ['Westmalle tripel', 4.5],
  ]},
  { kop:'Wijn & bubbels', items:[
    ['Witte wijn', 4],
    ['Cava', 5],
  ]},
  { kop:'Warm', items:[
    ['Koffie', 3],
    ['Koffie deca', 3],
    ['Thee', 3],
    ['Chocomelk warm', 3],
    ['Soep', 3],
  ]},
  { kop:'Snacks', items:[
    ['Chips', 2.5],
    ['Wafel', 2.5],
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

/* menu opbouwen uit de kaart */
main.innerHTML = kaart.map((groep, g) => `
  <section>
    <h2>${groep.kop}</h2>
    <menu>
      ${groep.items.map(([naam, prijs], i) =>
        `<li><button data-id="${g}-${i}" data-aantal="0"
                     aria-label="${naam}, ${euro.format(prijs)}">
           <strong>${naam}</strong><small>${euro.format(prijs)}</small>
         </button></li>`).join('')}
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

/* tikken op het menu */
main.addEventListener('click', e => {
  const knop = e.target.closest('button[data-id]');
  if (knop) wijzig(knop.dataset.id, 1);
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
