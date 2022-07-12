'use strict';
var VIVI, ARENA, SPEED, timerHOTCOLD, timerBRAND, timerMECHANIC;
const THERMOMETERS = ['meter-2', 'meter-1', 'meter1', 'meter2'];
const SWORDS = ['swordn', 'sworde', 'swordw', 'swords'];

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
    updateStatus('You resolved everything correctly and lived! Great job!');
  }

  dead(message = 'You failed to neutralize your temperature and got KO’d&nbsp;:(') {
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

    if (ARENA['hits' + phase][y][x] > 1) {
      this.dead('You got hit by two swords at once!');
      this.bodyTemp = 100;
    }
    else
      this.check(ARENA['temps' + phase][y][x]);
  }

  check(temp) {
    let newBody = this.bodyTemp + temp;

    if (newBody > 2 || newBody < -2) {
      this.bodyTemp = newBody;
      if (newBody > 2)
        this.dead('Your body went above 2 levels and burned to death!');
      else
        this.dead('Your body went below 2 levels and froze to death!');
    } else {
      this.showLife(newBody);
      this.bodyTemp = newBody;
      levelTemp(temp);
    }
  }
  
  showLife(temp) {
    let body = this.bodyTemp;

    show('ta-life');
    hide('dbf-hc' + body);
    hide('life' + body);
    show('dbf-hc' + temp);
    show('life' + temp);
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
    let hits = this['hits' + phase], hit, clr;

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (resetTiles) {
          clr = 'ivory';
        } else {
          hit = hits[j][i];
          if (hit === 0) {
            continue;
          } else {
            clr = (hit === 2) ? 'sandybrown' : '#fad2b0';
          }
        }
        d3.select('#bg' + i + j).style('fill', clr);
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
    let deg, orients = this['orients' + phase];
    let bosses = ['n', 'e', 'w', 's'];

    for (let i = 0; i < bosses.length; i++) {
      switch(orients[i]) {
        case 'n': deg = 180; break;
        case 'e': deg = 270; break;
        case 'w': deg = 90; break;
        case 's':
        default: deg = 0;
      }
      d3.select('#face' + bosses[i]).attr('transform', 'translate(17, 17) rotate(' + deg + ') translate(-17, -17)');   
    }
  }

  meters(phase) {
    let meter = this['meters' + phase];
    move('meter' + meter[0], 73, 26);
    move('meter' + meter[1], 113, 66);
    move('meter' + meter[2], 33, 66);
    move('meter' + meter[3], 73, 106);
    showAll(THERMOMETERS);
  }

  swords(phase) {
    let swd = this['swords' + phase];
    let meter = this['meters' + phase];
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
      d3.select('#' + swd[i]).styles({
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
      show('tilesafe' + this['safe' + phase]);
  }

  hideSwords() {
    hideAll(THERMOMETERS);
    hideAll(SWORDS);
    hide('tilesafe' + this.safe1);
    hide('tilesafe' + this.safe2);
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

function setSettings() {
  function checkStorage(form) {
    if (d3.select('#' + form).property('checked')) 
      sessionStorage.setItem(form, 'true');
    else 
      sessionStorage.removeItem(form);
  }

  checkStorage('formUseTimer');
  checkStorage('formMarkSafe');
  checkStorage('formGetBrand');
  startPractice();
}

function setPractice() {
  let hotcold, brand = 0, safe1, safe2, meters1, meters2, isSame;
  const TEMPS = [-2, -1, 1, 2];
  const SAFES = [1, 2, 3, 4];
  const shuffle = array => {
    let arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  hotcold = getRandItem(TEMPS);
  if (sessionStorage.getItem('formGetBrand')) {
    brand = getRandItem(TEMPS);
    while (hotcold + brand === 0)
      brand = getRandItem(TEMPS);
  }

  safe1 = getRandItem(SAFES);
  safe2 = getRandItem(SAFES);
  while (safe1 === safe2)
    safe2 = getRandItem(SAFES);

  meters1 = shuffle(TEMPS);
  do {
    isSame = false;
    meters2 = shuffle(TEMPS);
    for (let i = 0; i < TEMPS.length; i++) {
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
    SPEED = 1000; // TO-DO: will depend on settings;
    startMechanic('Hot and Cold');
  } else {
    SPEED = 1000;
    showAll(['btnResolveSwords1', 'dbf-intemp', 'dbf-eb' + VIVI.brand]);
    VIVI.showLife(VIVI.bodyTemp);
    levelTemp(VIVI.hotcold);
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
  let brand = VIVI.brand;
  hide('btnResolveBrand');

  ARENA.hideClones();
  VIVI.check(brand);
  hide('dbf-eb' + brand);
  if (VIVI.bodyTemp === 0) {
    VIVI.win();
  } else {
    VIVI.dead();
  }
}

function startTimerHotCold() {
  let time = (VIVI.brand === 0) ? 42 : 49;
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
        startMechanic('Blade of Entropy', 10);
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
        startMechanic('Blade of Entropy', 10);
        ARENA.showSwords(1);
        break;
      case 31:
        ARENA.rotateBosses(1);
        break;
      case 38:
        startMechanic('Unwavering Apparition');
        break;
      case 46:
        startMechanic('Elemental Brand');
        break;
    }
  }, SPEED);
}

function startTimerBrand() {
  let time = 38;
  let brand = VIVI.brand;
  const updateTimer = (newTime = '&nbsp;') => write('txt-brand', newTime);

  updateTimer(time);
  show('dbf-eb' + brand);

  timerBRAND = setInterval(function() {
    time--;
    updateTimer(time);

    if (time <= 0) {
      clearInterval(timerBRAND);
      updateTimer();
      VIVI.check(brand);
      if (VIVI.bodyTemp >= -2 || VIVI.bodyTemp <= 2) 
        hide('dbf-eb' + brand);
    }
  }, SPEED);
}

function startMechanic(mechanic, time = 4) {
  let cast = 'Casting <b>' + mechanic + '</b> in... ';

  updateStatus(cast + time);
  timerMECHANIC = setInterval(function() {
    time--;
    if (time <= 0) {
      switch(mechanic) {
        case 'Blade of Entropy':
          ARENA.hideSwords();
          break;
        case 'Unwavering Apparition':
          ARENA.showClones();
          updateStatus();
          break;
        case 'Elemental Brand':
          startTimerBrand();
          updateStatus();
          break;
        case 'Hot and Cold':
          startTimerHotCold();
          show('dbf-intemp');
          VIVI.showLife(VIVI.bodyTemp);
          levelTemp(VIVI.hotcold);
          break;
      }
      clearInterval(timerMECHANIC);
    } else {
      updateStatus(cast + time);
    }
  }, SPEED);
}

function addOptions() {
  function clickTile() {
    VIVI.position = this.id;
    move('vivi-ans', VIVI.x * 40 + 18, VIVI.y * 40 + 16);
  }

  options(clickTile);
}
function removeOptions() { options(null); }
function options(func) {
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
      d3.select('#tile' + x + y).on('click', func);
    }
  }
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
  let index = Math.floor(Math.random() * array.length);
  return array[index];
}



function checkForm(form) { d3.select('#' + form).property('checked', sessionStorage.getItem(form) ? true : false); }
function move(elem, x, y) { d3.select('#' + elem).attr('transform', 'translate(' + x + ', ' + y + ')'); }

function hide(elem) { d3.select('#' + elem).classed("hidden", true); }
function show(elem) { d3.select('#' + elem).classed("hidden", false); }
function hideAll(array) {
  for (let a of array)
    hide(a);
}
function showAll(array) {
  for (let a of array)
    show(a);
}

function hide2(...elements) {
  for (let elem of elements)
    d3.select('#' + elem).classed("hidden", true);
}

function updateStatus(status = '&nbsp;') { write('status', status); }
function write(elem, text = '&nbsp;') {
  d3.select('#' + elem).html(text);
}

function levelTemp(temp) {
	let level;

	switch(temp) {
		case 0: updateStatus(); return;
		case -2: level = 'falls 2 levels.'; break;
		case -1: level = 'falls 1 level.'; break;
		case 1: level = 'rises 1 level.'; break;
		case 2:
		default: level = 'rises 2 levels.';
	}
	updateStatus('<i>Your body temperature ' + level + '</i>');
}

window.onload = function() {
  if (sessionStorage.getItem('practiseAgain')) {
    sessionStorage.removeItem('practiseAgain');
    startPractice();
  } else {
    if (sessionStorage.getItem('editSettings')) {
      sessionStorage.removeItem('editSettings');
      checkForm('formUseTimer');
      checkForm('formMarkSafe');
      checkForm('formGetBrand');
    }
    sessionStorage.clear();
    show('settings');
  }
};
