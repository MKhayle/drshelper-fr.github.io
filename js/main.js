'use strict';
var VIVI, ARENA, timerHOTCOLD, timerBRAND, timerDEBUFF, hasPICKED = false;
var SPEED = 1000;
const VIVIS = ['vivi-win', 'vivi-dead'];
const VIVIS2 = ['vivi-ans', 'vivi-win', 'vivi-dead', 'vivi-south'];
const TA = ['bosse'];
const CLONES = ['bossn', 'bossw', 'bosss'];
const BOSSES = TA.concat(CLONES);
const METERS = ['meter-2', 'meter-1', 'meter1', 'meter2'];
const SWORDS = ['swordn', 'sworde', 'swordw', 'swords'];

const SETTINGS = {
  timer: true,
  safe: true,
  init: function() {
    this.timer = d3.select('#formTimer').property('checked');
    this.safe = d3.select('#formSafe').property('checked');
    SPEED = this.timer ? 1000 : 1000;
  }
};

class Vivi {
  constructor(hotcold, brand) {
    this.hotcold = hotcold;
    this.brand = brand;
    this.body = hotcold;
    this.pos = 'tile12';
    this.show();
  }

  set pos(tile) {
    this.tile = tile;
    this.x = parseInt(tile.slice(4, 5));
    this.y = parseInt(tile.slice(5));
  }

  show() { vis('vivi-ans'); vis('vivi-south'); }
  win() { invis('vivi-south'); vis('vivi-win'); }
  dead() { invis('vivi-south'); vis('vivi-dead'); show('btnPractiseAgain'); }
  move(x, y) { move('vivi-ans', x, y); }
  sword(phase) {
    let hits, temps, x = this.x, y = this.y;
    if (phase === 1) {
      hits = ARENA.hits1;
      temps = ARENA.temps1;
    } else {
      hits = ARENA.hits2;
      temps = ARENA.temps2;
    }

    if (hits[y][x] > 1) {
      endPractice();
      this.dead();
      write('You got hit by two swords at once!');
    } else {
      this.check(temps[y][x]);
    }
  }
  check(temp) {
    let cur = this.body,
        body = cur + temp;
    if (body > 2 || body < -2) {
      endPractice();
      this.dead();
      if (body > 2) {
        write('Your body went above 2 levels and burned to death!');
      } else {
        write('Your body went below 2 levels and froze to death!');
      }
    } else {
      this.life(body);
      this.body = body;
      levelTemp(temp);
    }
  }
  life(temp) {
    let body = this.body;
    vis('ta-life');
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
    this.showSafe = SETTINGS.safe;
    this.init();
    this.rotateAll(0);
  }

  init() {
    let [safe1, safe2] = [this.safe1, this.safe2];
    let [meters1, meters2] = [this.meters1, this.meters2];

    this.orients1 = this.setOrients(safe1);
    this.orients2 = this.setOrients(safe2);
    this.swords1 = this.setSwords(safe1);
    this.swords2 = this.setSwords(safe2);
    this.hits1 = this.setHits(safe1);
    this.hits2 = this.setHits(safe2);
    this.temps1 = this.setHits(safe1, meters1);
    this.temps2 = this.setHits(safe2, meters2);
  }

  setOrients(safe) {
    const NS = (() => getRand('n', 's'))();
    const EW = (() => getRand('e', 'w'))();
    let n = (safe === 3 || safe === 4) ? NS : EW,
        e = (safe === 2 || safe === 3) ? NS : EW,
        w = (safe === 1 || safe === 4) ? NS : EW,
        s = (safe === 1 || safe === 2) ? NS : EW;
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

  setHits(safe, values = [1, 1, 1, 1]) {
    let hits = [[0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]];
    let attacks = [];
    switch(safe) {
      case 1: attacks = ['sm-n', 'bg-s', 'sm-w', 'bg-e']; break;
      case 2: attacks = ['sm-n', 'sm-e', 'bg-s', 'bg-w']; break;
      case 3: attacks = ['bg-w', 'sm-e', 'bg-n', 'sm-s']; break;
      default: attacks = ['bg-e', 'bg-n', 'sm-w', 'sm-s'];
    }
    for (let y = 0; y < hits.length; y++) {
      for (let x = 0; x < hits[y].length; x++) {
        for (let z = 0; z < attacks.length; z++) {
          switch(attacks[z]) {
            case 'bg-n': if (y < 2) hits[y][x] += values[z]; break;
            case 'bg-e': if (x > 1) hits[y][x] += values[z]; break;
            case 'bg-w': if (x < 2) hits[y][x] += values[z]; break;
            case 'bg-s': if (y > 1) hits[y][x] += values[z]; break;
            case 'sm-n': if (y < 1) hits[y][x] += values[z]; break;
            case 'sm-e': if (x > 2) hits[y][x] += values[z]; break;
            case 'sm-w': if (x < 1) hits[y][x] += values[z]; break;
            case 'sm-s': if (y > 2) hits[y][x] += values[z]; break;
            default: hits[y][x] = 8;	// debugging
          }
        }
      }
    }
    return hits;
  }
  
  color(phase, reset = false) {
    let hits = (phase === 1) ? this.hits1 : this.hits2
    let hit, clr;

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (reset) {
          clr = 'honeydew';
        } else {
          hit = hits[j][i];
          if (hit === 0) {
            continue;
          } else {
            clr = (hit === 2) ? 'sandybrown' : '#fad2b0';
          }
        }
        d3.select('#tile' + i + j).style('fill', clr);
      }
    }

    if (!reset) return setTimeout(this.color, SPEED, phase, true);
  }

  clones() { for (let c of CLONES) vis(c); }
  
  rotateAll(phase = 0) {
    let dir = [], faces = ['n', 'e', 'w', 's'];
    switch(phase) {
      case 1: dir = this.orients1; break;
      case 2: dir = this.orients2; break;
      default: dir = new Array(4).fill('s');
    }
    for (let i = 0; i < faces.length; i++) {
      this.rotate(faces[i], dir[i]);
    }
  }
  rotate(pos, dir) {
    let deg;
    switch(dir) {
      case 'n': deg = 180; break;
      case 'e': deg = 270; break;
      case 'w': deg = 90; break;
      case 's':
      default: deg = 0;
    }
    d3.select('#face' + pos).attr('transform', 'translate(8, 8) rotate(' + deg + ') translate(-8, -8)');   
  }

  meters(phase) {
    let mtr = (phase === 1) ? this.meters1 : this.meters2;
    move('meter' + mtr[0], 73, 26);
    move('meter' + mtr[1], 113, 66);
    move('meter' + mtr[2], 33, 66);
    move('meter' + mtr[3], 73, 106);
    for (let m of METERS)
      vis(m);
  }

  swords(phase) {
    let swd, mtr, x, y;
    if (phase === 1) {
      swd = this.swords1;
      mtr = this.meters1;
    } else {
      swd = this.swords2;
      mtr = this.meters2;
    }

    switch(swd.indexOf('swordn')) {
      case 0: [x, y] = [87, 10.5]; break;
      case 1: [x, y] = [127, 50.5]; break;
      default: [x, y] = [39, 50.5]; // case 2
    }
    move('swordn', x, y);

    switch(swd.indexOf('sworde')) {
      case 0: [x, y] = [95.5, 39]; break;
      case 1: [x, y] = [135.5, 79]; break;
      default: [x, y] = [95.5, 127]; // case 3
    }
    move('sworde', x, y);

    switch(swd.indexOf('swordw')) {
      case 0: [x, y] = [50.5, 39]; break;
      case 2: [x, y] = [10.5, 79]; break;
      default: [x, y] = [50.5, 127]; // case 3
    }
    move('swordw', x, y);

    switch(swd.indexOf('swords')) {
      case 1: [x, y] = [127, 95.5]; break;
      case 2: [x, y] = [39, 95.5]; break;
      default: [x, y] = [87, 135.5]; // case 3
    }
    move('swords', x, y);

    for (let i = 0; i < SWORDS.length; i++) {
      d3.select('#' + swd[i]).styles({
        fill: (mtr[i] > 0) ? '#f08080' : '#87cefa',
        stroke: (mtr[i] > 0) ? '#531515' : '#4668a6'
      });
      vis(SWORDS[i]);
    }
  }
}

function setGame() {
  let hotcold, brand, safe1, safe2, meters1, meters2, isSame;
  const TEMPS = [-2, -1, 1, 2];
  const SAFES = [1, 2, 3, 4];

  function shuffle(array) {
    let arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  hotcold = getRand(...TEMPS);
  brand = getRand(...TEMPS);
  while (hotcold + brand === 0)
    brand = getRand(...TEMPS);

  safe1 = getRand(...SAFES);
  safe2 = getRand(...SAFES);
  while (safe1 === safe2)
    safe2 = getRand(...SAFES);

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

  hide('dbf-intemp');
  hide('dbf-hc0');
  hide('life0');
  for (let T of TEMPS) {
    hide('dbf-hc' + T);
    hide('dbf-eb' + T);
    hide('life' + T);
  }
}

function startPractice() {
  SETTINGS.init();
  setGame();
  hide('settings');
  show('info');
  addOptions();
  vis('bosse');
  if (SETTINGS.timer) {
    castDebuff('Hot and Cold');
  } else {
    show('btnResolveSwords1');
    show('dbf-intemp');
    show('dbf-eb' + VIVI.brand);
    VIVI.life(VIVI.body);
    levelTemp(VIVI.hotcold);
    ARENA.clones();
    ARENA.rotateAll(1);
    ARENA.meters(1);
    ARENA.swords(1);
  }
}

function btnResolveSwords1() {
  write();
  ARENA.color(1);
  setTimeout(function() {
    hide('btnResolveSwords1');
    VIVI.sword(1);
    if (VIVI.body >= -2 && VIVI.body <= 2) {
      ARENA.rotateAll(2);
      ARENA.meters(2);
      ARENA.swords(2);
      show('btnResolveSwords2');
    } else {
      show('btnPractiseAgain');
    }
  }, SPEED);
}

function btnResolveSwords2() {
  write();
  ARENA.color(2);
  setTimeout(function() {
    hide('btnResolveSwords2');
    VIVI.sword(2);
    if (VIVI.body >= -2 && VIVI.body <= 2) {
      removeOptions();
      resetThis(METERS, SWORDS);
      show('btnResolveBrand');
    } else {
      show('btnPractiseAgain');
    }
  }, SPEED);
}

function btnResolveBrand() {
  let brand = VIVI.brand;
  hide('btnResolveBrand');
  show('btnPractiseAgain');

  resetThis(CLONES);
  VIVI.check(brand);
  hide('dbf-eb' + brand);
  if (VIVI.body === 0) {
    VIVI.win();
    write('You resolved everything correctly and lived! Great job!');
  } else {
    VIVI.dead();
    write('You failed to neutralize your temperature and got KO’d&nbsp;:(');
  }
}

function startTimerHotCold() {
  let text = d3.select('#txt-hotcold');
  let time = 49;

  text.text(time);
  show('dbf-intemp');
  VIVI.life(VIVI.body);

  timerHOTCOLD = setInterval(function() {
    time--;
    text.text(time);
    switch(time) {
      case 0:
        clearInterval(timerHOTCOLD);
        text.html('&nbsp;');
        if (VIVI.body === 0) {
          VIVI.win();
          write('You resolved everything correctly and lived! Great job!');
        } else {
          VIVI.dead();
          write('You failed to neutralize your temperature and got KO’d :(');
        }
        break;
      case 7:
        removeOptions();
        VIVI.sword(2);
        break;
      case 8:
        ARENA.color(2);
        break;
      case 17:
        castDebuff('Blade of Entropy', 10);
        ARENA.meters(2);
        ARENA.swords(2);
        break;
      case 18:
        ARENA.rotateAll(2);
        break;
      case 20:
        VIVI.sword(1);
        /*
        if (hasPICKED) {
          VIVI.sword(1);
        } else {
          VIVI.show();
          VIVI.dead();
          endPractice();
          write('Please select a tile next time and try again.');
        }
        */
        break;
      case 21:
        ARENA.color(1);
        break;
      case 30:
        castDebuff('Blade of Entropy', 10);
        ARENA.meters(1);
        ARENA.swords(1);
        break;
      case 31:
        ARENA.rotateAll(1);
        break;
      case 38:
        castDebuff('Unwavering Apparition');
        break;
      case 46:
        castDebuff('Elemental Brand');
        break;
    }
  }, SPEED);
}

function startTimerBrand() {
  let text = d3.select('#txt-brand');
  let time = 38;
  let brand = VIVI.brand;

  text.text(time);
  show('dbf-eb' + brand);

  timerBRAND = setInterval(function() {
    time--;
    text.text(time);

    if (time <= 0) {
      clearInterval(timerBRAND);
      show('btnPractiseAgain');
      VIVI.check(brand);
      if (VIVI.body >= -2 || VIVI.body <= 2) {
        resetThis(CLONES);
        hide('dbf-eb' + brand);
        levelTemp(brand);
      }
      text.html('&nbsp;');
    }
  }, SPEED);
}

function castDebuff(mechanic, time = 4) {
  write('Casting <b>' + mechanic + '</b> in... ' + time);

  timerDEBUFF = setInterval(function() {
    time--;
    if (time <= 0) {
      switch(mechanic) {
        case 'Blade of Entropy':
          resetThis(METERS, SWORDS);
          break;
        case 'Unwavering Apparition':
          ARENA.clones();
          write();
          break;
        case 'Elemental Brand':
          startTimerBrand();
          write();
          break;
        case 'Hot and Cold':
          startTimerHotCold();
          levelTemp(VIVI.hotcold);
          break;
      }
      clearInterval(timerDEBUFF);
    } else {
      write('Casting <b>' + mechanic + '</b> in... ' + time);
    }
  }, SPEED);
}

function addOptions() { options(clickTile); }
function removeOptions() { options(null); }
function options(func) {
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
      d3.select('#tile' + x + y).on('click', func);
    }
  }
}
function clickTile() {
  VIVI.pos = this.id;
  VIVI.move(VIVI.x * 40 + 18, VIVI.y * 40 + 16);
  VIVI.show();
  hasPICKED = true;
}

function endPractice() {
  removeOptions();
  clearInterval(timerHOTCOLD);
  d3.select('#txt-hotcold').html('&nbsp;');
  clearInterval(timerBRAND);
  d3.select('#txt-brand').html('&nbsp;');
  clearInterval(timerDEBUFF);
  resetGlobals();
}

function practiseAgain() {
  hide('btnPractiseAgain');
  endPractice();
  resetBoard();
  startPractice();
}

function resetGlobals() {
  VIVI = '';
  ARENA = '';
  timerHOTCOLD = '';
  timerBRAND = '';
  timerDEBUFF = '';
  hasPICKED = false;
}

function resetThis(...args) {
  let arr;
  for (let i of args) {
    arr = i;
    for (let j of arr)
      invis(j);
  }
}

function getRand(...args) {
	return args[Math.floor(Math.random() * args.length)];
}

function move(elem, x, y) { d3.select('#' + elem).attr('transform', 'translate(' + x + ', ' + y + ')'); }
function invis(elem) { d3.select('#' + elem).classed("invisible", true); }
function vis(elem) { d3.select('#' + elem).classed("invisible", false); }
function hide(elem) { d3.select('#' + elem).classed("hidden", true); }
function show(elem) { d3.select('#' + elem).classed("hidden", false); }
function write(status = '&nbsp;') { d3.select('#status').html(status); }
function levelTemp(temp) {
	let level;
	switch(temp) {
		case 0: write(); return;
		case -2: level = 'falls 2 levels.'; break;
		case -1: level = 'falls 1 level.'; break;
		case 1: level = 'rises 1 level.'; break;
		case 2:
		default: level = 'rises 2 levels.';
	}
	write('<i>Your body temperature ' + level + '</i>');
}

function resetBoard() {
  resetThis(VIVIS, BOSSES, METERS, SWORDS);
}
resetBoard();
startPractice();
