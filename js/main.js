'use strict';
var VIVI, ARENA, SPEED, timerHOTCOLD, timerBRAND, timerMECHANIC;
const ARENA_LENGTH = 4;
const FORMS = ['formUseTimer', 'formMarkSafe', 'formGetBrand', 'formSkipDebuffs']
const SAFE_SPOTS = [1, 2, 3, 4];
const SWORDS = ['swordn', 'sworde', 'swordw', 'swords'];
const TEMPERATURES = [-2, -1, 1, 2];
const THERMOMETERS = ['meter-2', 'meter-1', 'meter1', 'meter2'];
const TILES = [
  'tile00', 'tile10', 'tile20', 'tile30',
  'tile01', 'tile11', 'tile21', 'tile31',
  'tile02', 'tile12', 'tile22', 'tile32',
  'tile03', 'tile13', 'tile23', 'tile33'
];

class Vivi {
  constructor(hotcold, brand) {
    this.hotcold = hotcold;
    this.brand = brand;
    this.bodyTemp = hotcold;

    this.position = 'tile12'; // default
  }

  set position(tile) {
    this.tile = tile;
    this.x = parseInt(tile.slice(4, 5));
    this.y = parseInt(tile.slice(5));
  }

  win() {
    hide('vivi-south');
    show('vivi-win');
    updateStatus('Félicitations! Vous avez su résoudre parfaitement la mécanique et avez survécu!');
  }

  dead(message = 'Votre température est restée instable et vous êtes tombé·e KO’d&nbsp;:(') {
    hide('vivi-south');
    show('vivi-dead');
    removeOptions();
    clearInterval(timerHOTCOLD);
    write('txt-hotcold');
    clearInterval(timerBRAND);
    write('txt-brand');
    clearInterval(timerMECHANIC);
    updateStatus(message);
  }

  sword(phase) {
    let x = this.x,
        y = this.y;

    if (ARENA[`hits${phase}`][y][x] > 1) {
      this.dead('Vous avez été touché·e par deux épées à la fois!');
      this.bodyTemp = 100;
    }
    else
      this.check(ARENA[`temps${phase}`][y][x]);
  }

  check(temp) {
    let newBody = this.bodyTemp + temp;

    if (newBody > 2 || newBody < -2) {
      this.bodyTemp = newBody;
      if (newBody > 2)
        this.dead('Votre température corporelle est devenue bien trop élevée et vous avez brûlé vif !');
      else
        this.dead('Votre température corporelle est devenue bien trop faible et vous avez fini surgelé !');
    } else {
      this.showLife(newBody);
      this.bodyTemp = newBody;
      writeTempChange(temp);
    }
  }
  
  showLife(temp) {
    show('ta-life');
    hide(`dbf-hc${this.bodyTemp}`);
    hide(`life${this.bodyTemp}`);
    show(`dbf-hc${temp}`);
    show(`life${temp}`);
  }
}

class Arena {
  constructor(safe1, safe2, meters1, meters2) {
    this.safe1 = safe1;
    this.safe2 = safe2;
    this.meters1 = meters1;
    this.meters2 = meters2;
    this.orients1 = this.setOrients(safe1);
    this.orients2 = this.setOrients(safe2);
    this.swords1 = this.setSwords(safe1);
    this.swords2 = this.setSwords(safe2);
    this.hits1 = this.setHits(safe1);
    this.hits2 = this.setHits(safe2);
    this.temps1 = this.setHits(safe1, meters1);
    this.temps2 = this.setHits(safe2, meters2);
  }
  
  colorTiles(phase, resetTiles = false) {
    let hits = this[`hits${phase}`], hit, color;

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (resetTiles) {
          color = 'ivory';
        } else {
          hit = hits[j][i];
          if (hit === 0)
            continue;
          else
            color = (hit === 2) ? 'sandybrown' : 'peachpuff';
        }
        d3.select(`#bg${i}${j}`).style('fill', color);
      }
    }

    if (!resetTiles) return setTimeout(this.colorTiles, SPEED, phase, true);
  }

  showClones() { this.clones(showAll); }
  hideClones() { this.clones(hideAll); }
  clones(func) {
    func(['bossn', 'bossw', 'bosss']);      
  }
  
  rotateBosses(phase) {
    let deg, orients = this[`orients${phase}`];
    let bosses = ['n', 'e', 'w', 's'];

    for (let i = 0; i < bosses.length; i++) {
      switch(orients[i]) {
        case 'n': deg = 180; break;
        case 'e': deg = 270; break;
        case 'w': deg = 90; break;
        case 's':
        default: deg = 0;
      }
      d3.select(`#face${bosses[i]}`).attr('transform', `translate(17, 17) rotate(${deg}) translate(-17, -17)`);   
    }
  }

  meters(phase) {
    let meter = this[`meters${phase}`];
    move(`meter${meter[0]}`, 73, 26);
    move(`meter${meter[1]}`, 113, 66);
    move(`meter${meter[2]}`, 33, 66);
    move(`meter${meter[3]}`, 73, 106);
    showAll(THERMOMETERS);
  }

  swords(phase) {
    let swd = this[`swords${phase}`];
    let meter = this[`meters${phase}`];
    let x, y;

    switch(swd.indexOf('swordn')) {
      case 0: [x, y] = [87, 10.5]; break;
      case 1: [x, y] = [127, 50.5]; break;
      default: [x, y] = [39, 50.5];
    }
    move('swordn', x, y);

    switch(swd.indexOf('sworde')) {
      case 0: [x, y] = [95.5, 39]; break;
      case 1: [x, y] = [135.5, 79]; break;
      default: [x, y] = [95.5, 127];
    }
    move('sworde', x, y);

    switch(swd.indexOf('swordw')) {
      case 0: [x, y] = [50.5, 39]; break;
      case 2: [x, y] = [10.5, 79]; break;
      default: [x, y] = [50.5, 127];
    }
    move('swordw', x, y);

    switch(swd.indexOf('swords')) {
      case 1: [x, y] = [127, 95.5]; break;
      case 2: [x, y] = [39, 95.5]; break;
      default: [x, y] = [87, 135.5];
    }
    move('swords', x, y);

    for (let i = 0; i < SWORDS.length; i++) {
      d3.select(`#${swd[i]}`).styles({
        fill: (meter[i] > 0) ? '#f08080' : '#87cefa',
        stroke: (meter[i] > 0) ? '#531515' : '#4668a6'
      });
      show(SWORDS[i]);
    }
  }

  showSwords(phase) {
    this.meters(phase);
    this.swords(phase);
    if (sessionStorage.getItem('formMarkSafe'))
      show(`tilesafe${this[`safe${phase}`]}`);
  }

  hideSwords() {
    hideAll(THERMOMETERS);
    hideAll(SWORDS);
    hideAll([`tilesafe${this.safe1}`, `tilesafe${this.safe2}`]);
  }

  setOrients(safe) {
    const getOrient = (safe1, safe2) => (safe === safe1 || safe === safe2) ? getRandItem(['n', 's']) : getRandItem(['e', 'w']);
    let n = getOrient(3, 4),
        e = getOrient(2, 3),
        w = getOrient(1, 4),
        s = getOrient(1, 2);

    return [n, e, w, s];
  }

  setSwords(safe) {
    let swords = [];

    switch(safe) {
      case 1: swords = ['swordn', 'swords', 'swordw', 'sworde']; break;
      case 2: swords = ['swordn', 'sworde', 'swords', 'swordw']; break;
      case 3: swords = ['swordw', 'sworde', 'swordn', 'swords']; break;
      case 4:
      default: swords = ['sworde', 'swordn', 'swordw', 'swords'];
    }

    return swords;
  }

  setHits(safe, damages = [1, 1, 1, 1]) {
    let hits = [[0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]];
    let attacks = [];

    switch(safe) {
      case 1: attacks = ['sm-n', 'bg-s', 'sm-w', 'bg-e']; break;
      case 2: attacks = ['sm-n', 'sm-e', 'bg-s', 'bg-w']; break;
      case 3: attacks = ['bg-w', 'sm-e', 'bg-n', 'sm-s']; break;
      case 4:
      default: attacks = ['bg-e', 'bg-n', 'sm-w', 'sm-s'];
    }
    for (let y = 0; y < hits.length; y++) {
      for (let x = 0; x < hits[y].length; x++) {
        for (let z = 0; z < attacks.length; z++) {
          switch(attacks[z]) {
            case 'bg-n': if (y < 2) hits[y][x] += damages[z]; break;
            case 'bg-e': if (x > 1) hits[y][x] += damages[z]; break;
            case 'bg-w': if (x < 2) hits[y][x] += damages[z]; break;
            case 'bg-s': if (y > 1) hits[y][x] += damages[z]; break;
            case 'sm-n': if (y < 1) hits[y][x] += damages[z]; break;
            case 'sm-e': if (x > 2) hits[y][x] += damages[z]; break;
            case 'sm-w': if (x < 1) hits[y][x] += damages[z]; break;
            case 'sm-s': if (y > 2) hits[y][x] += damages[z]; break;
            default: hits[y][x] = 8;	// debugging
          }
        }
      }
    }

    return hits;
  }
}

function saveSettings() {
  const isChecked = form => d3.select(`#${form}`).property('checked');
  const store = form => sessionStorage.setItem(form, 'true');

  sessionStorage.clear();
  for (let form of FORMS) {
    if (isChecked(form)) store(form);
  }  
  startPractice();
}

function setPractice() {
  let hotcold, brand = 0, safe1, safe2, meters1, meters2, isSame;

  hotcold = getRandItem(TEMPERATURES);
  if (sessionStorage.getItem('formGetBrand')) {
    brand = getRandItem(TEMPERATURES);
    while (hotcold + brand === 0)
      brand = getRandItem(TEMPERATURES);
  }

  safe1 = getRandItem(SAFE_SPOTS);
  safe2 = getRandItem(SAFE_SPOTS);
  while (safe1 === safe2)
    safe2 = getRandItem(SAFE_SPOTS);

  meters1 = shuffle(TEMPERATURES);
  do {
    isSame = false;
    meters2 = shuffle(TEMPERATURES);
    for (let i = 0; i < TEMPERATURES.length; i++) {
      if (meters1[i] === meters2[i]) {
        isSame = true; break;
      }
    }
  } while (isSame);

  VIVI = new Vivi(hotcold, brand);
  ARENA = new Arena(safe1, safe2, meters1, meters2);
}

function startPractice() {
  hide('btnStartPractice');
  showAll(['btnPractiseAgain', 'btnEditSettings']);
  setPractice();

  hide('settings');
  show('info');

  addOptions();
  show('bosse');
  if (sessionStorage.getItem('formUseTimer')) {
    SPEED = 1000; // TO-DO: will depend on settings
    if (sessionStorage.getItem('formSkipDebuffs')) {
      if (sessionStorage.getItem('formGetBrand')) startTimerBrand();
      startTimerHotCold();
      showAll(['dbf-intemp', `dbf-eb${VIVI.brand}`]);
      VIVI.showLife(VIVI.bodyTemp);
    }
    else {
      startMechanic('Chaud et froid');
    }
  } else {
    SPEED = 1000;
    showAll(['btnResolveSwords1', 'dbf-intemp', `dbf-eb${VIVI.brand}`]);
    VIVI.showLife(VIVI.bodyTemp);
    writeTempChange(VIVI.hotcold);
    ARENA.showClones();
    ARENA.rotateBosses(1);
    ARENA.showSwords(1);
  }
}

function resolveSwords1() {
  updateStatus();
  ARENA.colorTiles(1);
  setTimeout(function() {
    hide('btnResolveSwords1');
    VIVI.sword(1);
    if (VIVI.bodyTemp !== 100 && (VIVI.bodyTemp >= -2 && VIVI.bodyTemp <= 2)) {
      ARENA.hideSwords();
      ARENA.rotateBosses(2);
      ARENA.showSwords(2);
      show('btnResolveSwords2');
    }
  }, SPEED);
}

function resolveSwords2() {
  updateStatus();
  ARENA.colorTiles(2);
  setTimeout(function() {
    hide('btnResolveSwords2');
    VIVI.sword(2);
    if (VIVI.bodyTemp !== 100 && (VIVI.bodyTemp >= -2 && VIVI.bodyTemp <= 2)) {
      removeOptions();
      ARENA.hideSwords();
      !sessionStorage.getItem('formGetBrand') ? resolveBrand() : show('btnResolveBrand');
    }
  }, SPEED);
}

function resolveBrand() {
  hide('btnResolveBrand');

  ARENA.hideClones();
  VIVI.check(VIVI.brand);
  hide(`dbf-eb${VIVI.brand}`);
  if (VIVI.bodyTemp === 0)
    VIVI.win();
  else 
    VIVI.dead();
}

function startTimerHotCold() {
  let time = (VIVI.brand === 0) ? 42 : 49;
  if (sessionStorage.getItem('formSkipDebuffs')) time = 39;
  const updateTimer = (newTime = '&nbsp;') => write('txt-hotcold', newTime);

  updateTimer(time);
  timerHOTCOLD = setInterval(function() {
    time--;
    updateTimer(time);
    switch(time) {
      case 0:
        clearInterval(timerHOTCOLD);
        updateTimer();
        if (VIVI.bodyTemp === 0)
          VIVI.win();
        else
          VIVI.dead();
        break;
      case 4:
        ARENA.hideClones();
        break;
      case 7:
        removeOptions();
        VIVI.sword(2);
        break;
      case 8:
        ARENA.colorTiles(2);
        break;
      case 17:
        startMechanic('Sabre du feu et de la glace', 10);
        ARENA.showSwords(2);
        break;
      case 18:
        ARENA.rotateBosses(2);
        break;
      case 20:
        VIVI.sword(1);
        break;
      case 21:
        ARENA.colorTiles(1);
        break;
      case 30:
        startMechanic('Sabre du feu et de la glace', 10);
        ARENA.showSwords(1);
        break;
      case 31:
        ARENA.rotateBosses(1);
        break;
      case 38:
        startMechanic('Spectres du chevalier implacable');
        break;
      case 46:
        startMechanic('Malédiction du feu et de la glace');
        break;
    }
  }, SPEED);
}

function startTimerBrand() {
  let time = 38;
  if (sessionStorage.getItem('formSkipDebuffs')) time = 35;
  let brand = VIVI.brand;
  const updateTimer = (newTime = '&nbsp;') => write('txt-brand', newTime);

  updateTimer(time);
  show(`dbf-eb${brand}`);

  timerBRAND = setInterval(function() {
    time--;
    updateTimer(time);

    if (time <= 0) {
      clearInterval(timerBRAND);
      updateTimer();
      VIVI.check(brand);
      if (VIVI.bodyTemp >= -2 || VIVI.bodyTemp <= 2) 
        hide(`dbf-eb${brand}`);
    }
  }, SPEED);
}

function startMechanic(mechanic, time = 4) {
  let cast = `Va incanter <b>${mechanic}</b> dans... `;

  updateStatus(cast + time);
  timerMECHANIC = setInterval(function() {
    time--;
    if (time <= 0) {
      switch(mechanic) {
        case 'Sabre du feu et de la glace':
          ARENA.hideSwords();
          break;
        case 'Spectres du chevalier implacable':
          ARENA.showClones();
          updateStatus();
          break;
        case 'Malédiction du feu et de la glace':
          startTimerBrand();
          updateStatus();
          break;
        case 'Chaud et froid':
          startTimerHotCold();
          show('dbf-intemp');
          VIVI.showLife(VIVI.bodyTemp);
          writeTempChange(VIVI.hotcold);
          break;
      }
      clearInterval(timerMECHANIC);
    } else {
      updateStatus(cast + time);
    }
  }, SPEED);
}



function clickTile() {
  VIVI.position = this.id;
  move('vivi-ans', VIVI.x * 40 + 18, VIVI.y * 40 + 16);
}

function addOptions() { options(clickTile); }
function removeOptions() { options(null); }
function options(func) {
  for (let tile of TILES)
    d3.select(`#${tile}`).on('click', func);
}

function practiseAgain() {
  sessionStorage.setItem('practiseAgain', 'true');
  location.reload();
}

function editSettings() {
  sessionStorage.setItem('editSettings', 'true');
  location.reload();
}


function getRandItem(array) {
  let randIndex = Math.floor(Math.random() * array.length);
  return array[randIndex];
}

function shuffle(array) {
  let arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function move(element, x, y) { d3.select(`#${element}`).attr('transform', `translate(${x}, ${y})`); }
function hide(element) { d3.select(`#${element}`).classed('hidden', true); }
function show(element) { d3.select(`#${element}`).classed('hidden', false); }
function hideAll(array) {
  for (let a of array)
    hide(a);
}
function showAll(array) {
  for (let a of array)
    show(a);
}

function updateStatus(status = '&nbsp;') {
  write('status', status);
}
function write(element, text = '&nbsp;') {
  d3.select(`#${element}`).html(text);
}

function writeTempChange(temp) {
  let text, change, plural;
  if (temp !== 0) {
    change = (temp < 0) ? 'a chuté de' : 'a augmenté de';
    temp = Math.abs(temp);
    plural = (temp > 1) ? 'x' : '';  
    text = `<i>Votre température corporelle ${change} ${temp} niveau${plural}.</i>`;
  }
  updateStatus(text);
}

function recheckForm(form) {
  let isStored = sessionStorage.getItem(form) ? true : false;
  d3.select(`#${form}`).property('checked', isStored);
}

function addFuncToBtn(func, button) {
  return d3.select(`#btn${button}`).on('click', func);
}
addFuncToBtn(saveSettings, 'StartPractice');
addFuncToBtn(resolveSwords1, 'ResolveSwords1');
addFuncToBtn(resolveSwords2, 'ResolveSwords2');
addFuncToBtn(resolveBrand, 'ResolveBrand');
addFuncToBtn(practiseAgain, 'PractiseAgain');
addFuncToBtn(editSettings, 'EditSettings');

window.onload = function() {
  if (sessionStorage.getItem('practiseAgain')) {
    sessionStorage.removeItem('practiseAgain');
    startPractice();
  } else {
    if (sessionStorage.getItem('editSettings')) {
      sessionStorage.removeItem('editSettings');
      recheckForm('formUseTimer');
      recheckForm('formMarkSafe');
      recheckForm('formGetBrand');
      recheckForm('formSkipDebuffs');
    }
    show('settings');
  }
};
