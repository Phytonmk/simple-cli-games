'use strict';
const fs = require('fs');
const eoepipe = require('exit-on-epipe');
const Jetty = require('jetty');
const keypress = require('keypress');
keypress(process.stdin);
const jetty = new Jetty(process.stdout);
jetty.clear();
const
map = [],
cars = [],
configs = {
  width: process.stdout.columns,
  height: 20,
  maxV: 5,
  maxA: 0.3
};
const R = Math.round
const log = str => jetty.moveTo([configs.height + 1 ,0]).text(str);
let leaderCar = 0;
let playerCar = 0;
class Car {
  constructor (id, x, y) {
    this.id = id;
    this.coords = {x, y};
    this.a = 0;
    this.v = 0;
    this.diraction = 'right';
    if (this.coords.x > leaderCar)
      leaderCar = R(this.coords.x);
    if (this.id == 0)
      playerCar = R(this.coords.x);
    cars.push(this);
    fillMap();
    this.setView();
    setInterval(() => {this.handleMove()}, 200);
  }
  setView() {
    let id = this.id;
    if (id == 0)
      id = '@';
    else
      id = id + '';
    const x = R(this.coords.x);
    const y = this.coords.y;
    map[x][y] = {id: 'car' + this.id, type: 'dinamic', c: '╔', v: this.v};
    map[x + 1][y] = {id: 'car' + this.id, type: 'dinamic', c: '═', v: this.v};
    map[x + 2][y] = {id: 'car' + this.id, type: 'dinamic', c: '╗', v: this.v};
    map[x + 3][y] = {id: 'car' + this.id, type: 'dinamic', c: ' ', v: this.v};
    map[x][y + 1] = {id: 'car' + this.id, type: 'dinamic', c: '╠', v: this.v};
    map[x + 1][y + 1] = {id: 'car' + this.id, type: 'dinamic', c: id, v: this.v};
    map[x + 2][y + 1] = {id: 'car' + this.id, type: 'dinamic', c: '╬', v: this.v};
    map[x + 3][y + 1] = {id: 'car' + this.id, type: 'dinamic', c: '╗', v: this.v};
    map[x][y + 2] = {id: 'car' + this.id, type: 'dinamic', c: '*', v: this.v};
    map[x + 1][y + 2] = {id: 'car' + this.id, type: 'dinamic', c: ' ', v: this.v};
    map[x + 2][y + 2] = {id: 'car' + this.id, type: 'dinamic', c: '*', v: this.v};
    map[x + 3][y + 2] = {id: 'car' + this.id, type: 'dinamic', c: ' ', v: this.v};
  }
  handleMove() {
    removeObject('car' + this.id, R(this.coords.x), this.coords.y, R(this.coords.x) + 5, this.coords.y + 5);
    if (this.diraction == 'right') {
      this.coords.x += this.v;
      if (Math.abs(this.v) < configs.maxV)
        this.v += Math.round(this.a / 2 * 100) / 100;
    } else {
      if (Math.abs(this.v) > 0.5) {
        this.coords.x += this.v * 4/5;
        if (this.diraction == 'up' && this.coords.y > 0)
          this.coords.y--;
        else if (this.diraction == 'down' && this.coords.y < configs.height - 3)
          this.coords.y++;
      }
    }
    const collapses = anyCollapse('car' + this.id, this.box(), this.diraction);
    if (collapses) {
      if (this.diraction == 'right' || collapses[0].type == 'speed') {
        this.a = 0;
        if (collapses[0].type == 'static') {
          this.coords.x = collapses[0].x - 1;
          this.v = 0;
        } else if (collapses[0].type == 'dinamic') {
          if (Math.abs(this.v) > Math.abs(collapses[0].v)) 
            this.v = collapses[0].v * 4/5;
        } else if (collapses[0].type == 'speed') {
          this.v = this.v * collapses[0].speed;
        }
      } else if (this.diraction == 'up' && this.coords.y < configs.height - 3 && Math.abs(this.v) > 0.5) {
        this.coords.y++;
      } else if (this.diraction == 'down' && this.coords.y < configs.height && Math.abs(this.v) > 0.5) {
        this.coords.y--;
      }
    }
    if (this.diraction != 'right')
      this.diraction = 'right';
    if (this.coords.x > leaderCar)
      leaderCar = R(this.coords.x);
    if (this.id == 0)
      playerCar = R(this.coords.x);
    this.setView();
    //log(' ' + this.coords.y + ' ' + configs.height);
    return this;
  }
  box() {
    const x = R(this.coords.x);
    const y = this.coords.y;
    return [
     {x, y},
     {x: x + 0, y: y + 1},
     {x: x + 0, y: y + 2},
     {x: x + 1, y},
     {x: x + 1, y: y + 1},
     {x: x + 2, y},
     {x: x + 1, y: y + 2},
     {x: x + 3, y},
     {x: x + 2, y: y + 1},
     {x: x + 2, y: y + 2},
     {x: x + 3, y: y + 1},
     {x: x + 3, y: y + 2}
   ];
  }
}
class AI {
  constructor(netData=false, newGeneration=false) {
    if (netData) {
      this.netData = netData;
      if (newGeneration) {
        for (let i in this.netData) {
          this.netData[i].map(i => i += Math.abs(0.1 * (Math.random() - 0.5)));
        }
    } else {
      this.netData = {
        right: [
          Math.random(), // right-up
          Math.random(), // right
          Math.random(), // right-down
          Math.random(), // left-down
          Math.random(), // left
          Math.random()  // left-up
        ],
        left: [
          Math.random(), // right-up
          Math.random(), // right
          Math.random(), // right-down
          Math.random(), // left-down
          Math.random(), // left
          Math.random()  // left-up
        ],
        up: [
          Math.random(), // right-up
          Math.random(), // right
          Math.random(), // right-down
          Math.random(), // left-down
          Math.random(), // left
          Math.random()  // left-up
        ],
        down: [
          Math.random(), // right-up
          Math.random(), // right
          Math.random(), // right-down
          Math.random(), // left-down
          Math.random(), // left
          Math.random()  // left-up
        ],
      }
    }
    save() {
      fs.readdir(testFolder, (err, files) => {
        fs.writeFile(files.length + '.json', JSON.stringify(this.netData));
      });
    }
    areaWeight(points) {
      let result = 0;
      for (let i = 0; i < points.length; i++) {
        if (points[i] == undefined || points[i].type != 'road')
          result++;
      }
      return result;
    }
    activate(car) {
      const sensers = [];
      sensers[0] = R(4 / areaWeight([map[car.coords.x + 4][car.coords.y - 1], map[car.coords.x + 5][car.coords.y - 1], map[car.coords.x + 4][car.coords.y - 2], map[car.coords.x + 5][car.coords.y - 2]]));
      for (let i in this.netData) {
        for (let s = 0; s < sensers.length; s++) {
          if (this.netData[i][s] * sensers[s] > 0.5) {
            switch (i) {
              case 'up':
                car.diraction = 'up';
              break;
              case 'down':
                car.diraction = 'down';
              break;
              case 'right':
                if (car.a < configs.maxA)
                  car.a += 0.1;
                if (car.v < 0)
                  car.v *= 0.2;
              break;
              case 'left':
                if (car.a > -configs.maxA)
                  car.a -= 0.1;
                if (car.v > 0)
                  car.v *= 0.2;
              break;
            }
          }
        }
      }
    }
  }
}
const anyCollapse = (thisId, points, vector) => {
  const result = []
  for (let i = 0; i < points.length; i++) {
    //log(JSON.stringify(map[points[i].x]));
    //log(JSON.stringify(points[i]));
    if (map[points[i].x][points[i].y] != undefined && map[points[i].x][points[i].y].id != thisId && map[points[i].x][points[i].y].type != 'road') {
      result.push(map[points[i].x][points[i].y]);
    }
  }
  if (result.length > 0)
    return result;
  else
    return false;
}
const removeObject = (thisId, X=0, Y=0, maxX = map.length, maxY = map[0].length) => {
  for (let y = Y; y < maxY && y < map[0].length; y++) {
    for (let x = X; x < maxX && x < map.length; x++) {
      if (map[x][y].id == thisId) {
        map[x][y] = {c: ' ', type: 'road'};
      }
    }
  }
}
let lastFrame = [];
for (let x = 0; x < configs.width; x++) {
  lastFrame[x] = [];
  for (let y = 0; y < configs.height; y++) {
    lastFrame[x][y] = ' ';
  }
}
const maxAttempts = 200;
const genDirty = () => {
  let X = leaderCar + configs.width + R(Math.random() * configs.width);
  let Y = R(Math.random() * configs.height);
  let a = 0;
  while (map[X] == undefined || map[X][Y] == undefined || map[X][Y].type != 'road') {
    a++;
    if (a > maxAttempts)
      return false;
    X = leaderCar + configs.width + R(Math.random() * configs.width);
    Y = R(Math.random() * configs.height);
  }
  for (let y = 0; Math.random() > 0.6; y++) {
    for(let x = 0; Math.random() > 0.2; x++) {
      if (map[X + x] != undefined && map[X + x][Y + y] != undefined && map[X + x][Y + y].type == 'road') {
        map[X + x][Y + y] = {
          type: 'speed',
          speed: 0.8,
          c: '.',
          x: X + x,
          y: Y + y
        }
      }
    }
  }
}
const genSpeeder = () => {
  let X = leaderCar + configs.width + R(Math.random() * configs.width);
  let Y = R(Math.random() * configs.height);
  let a = 0;
  while ((map[X] == undefined || map[X][Y] == undefined || map[X][Y].type != 'road') || (map[X + 1] == undefined || map[X + 1][Y] == undefined || map[X + 1][Y].type != 'road')) {
    a++;
    if (a > maxAttempts)
      return false;
    X = leaderCar + configs.width + R(Math.random() * configs.width);
    Y = R(Math.random() * configs.height);
  }
  for (let k = 0; k < 2; k++)
    map[X + k][Y] = {
      type: 'speed',
      speed: 1.2,
      c: '»',
      x: X + k,
      y: Y
    }
}
const genRock = () => {
  let X = leaderCar + configs.width + R(Math.random() * configs.width);
  let Y = R(Math.random() * configs.height);
  let x = X, y = Y;
  for (let i = 0; i < 10 + R(100 * Math.random()); i++) {
    if (Math.random() > 0.66) {
      if (x > X)
        x++;
      else
        x--;
    } else {
      if (x > X)
        x--;
      else
        x++;
    }
    if (Math.random() > 0.66) {
      if (y > Y)
        y++;
      else
        y--;
    } else {
      if (y > Y)
        y--;
      else
        y++;
    }
    let a = 0;
    while (map[x] == undefined) {
      a++;
      if (a > maxAttempts)
        return false;
      x--;
    }
    while (map[x][y] == undefined) {
      a++;
      if (a > maxAttempts)
        return false;
      if (y < 0)
        y++;
      else
        y--;
    }
    map[x][y] = {
      type: 'static',
      c: '▒',
      x,
      y
    }
  }
}
const fillMap = () => {
  let somethingNew = false;
  for (let x = playerCar - configs.width; x < leaderCar + configs.width * 2; x++) {
    if (map[x] == undefined) {
      somethingNew = true;
      map[x] = [];
      for (let y = 0; y < configs.height; y++) {
        map[x][y] = {c: ' ', type: 'road'}
      }
    }
    if (x % 2 == 0) {
      if (map[x][0].type == 'road')
        map[x][0] = {c: '#', type: 'speed', speed: 0.5, x, y: 0};
      if (map[x][map[x].length - 1].type == 'road')
        map[x][map[x].length - 1] = {c: '#', type: 'speed', speed: 0.5, x, y: map[x].length - 1};
    }
  }
  if (somethingNew) {
    if (Math.random() < 0.4)
      genDirty();
    if (Math.random() < 0.005)
      genSpeeder();
    if (Math.random() < 0.1)
      genRock();
  }
}
const render = () => {
  const changes = [];
  fillMap();
  for (let x = 0; x < configs.width; x++) {
    for (let y = 0; y < configs.height; y++) {
      if (map[x + playerCar - Math.round(configs.width/2)][y].c != lastFrame[x][y]) {
        changes.push({x, y, c: map[x + playerCar - Math.round(configs.width/2)][y].c});
      }
      lastFrame[x][y] = map[x + playerCar - Math.round(configs.width/2)][y].c
    }
  }
  for (let i = 0; i < changes.length; i++) {
    jetty.moveTo([changes[i].y, changes[i].x]).text(changes[i].c + '');
  }
  let statusBar = '';
  let aSymb = '>';
  if (cars[0].a < 0)
    aSymb = '<';
  for (let i = 0; i < Math.abs(cars[0].a); i += Math.abs(configs.maxA / 3)) {
    statusBar += aSymb;
  }
  while(statusBar.length < 4)
    statusBar += ' ';
  // statusBar = cars[0].a + ' ';
  jetty.moveTo([configs.height, 0]).text(statusBar);
  jetty.moveTo([9999,0]).text('');
}
new Car(0, 10, 5);
new Car(1, 10, 9);
new Car(2, 15, 9);
setInterval(render, 25);
process.stdin.on('keypress', (ch, key) => {
  if (key) {
    switch (key.name) {
      case 'up':
        cars[0].diraction = 'up';
      break;
      case 'down':
        cars[0].diraction = 'down';
      break;
      case 'right':
        if (cars[0].a < configs.maxA)
          cars[0].a += 0.1;
        if (cars[0].v < 0)
          cars[0].v *= 0.2;
      break;
      case 'left':
        if (cars[0].a > -configs.maxA)
          cars[0].a -= 0.1;
        if (cars[0].v > 0)
          cars[0].v *= 0.2;
      break;
      default:
        process.exit();
      break;
    }
  }
});

process.stdin.setRawMode(true);
process.stdin.resume();
