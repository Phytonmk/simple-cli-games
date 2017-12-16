const Jetty = require('jetty');
const keypress = require('keypress');
keypress(process.stdin);
const jetty = new Jetty(process.stdin);
jetty.clear()
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
    map[x][y] = {id: 'car' + this.id, type: 'dinamic', c: '&'};
    map[x + 1][y] = {id: 'car' + this.id, type: 'dinamic', c: '&'};
    map[x + 2][y] = {id: 'car' + this.id, type: 'dinamic', c: '&'};
    map[x][y + 1] = {id: 'car' + this.id, type: 'dinamic', c: '&'};
    map[x + 1][y + 1] = {id: 'car' + this.id, type: 'dinamic', c: id};
    map[x + 2][y + 1] = {id: 'car' + this.id, type: 'dinamic', c: '&'};
    map[x + 3][y + 1] = {id: 'car' + this.id, type: 'dinamic', c: '&'};
    map[x][y + 2] = {id: 'car' + this.id, type: 'dinamic', c: '*'};
    map[x + 2][y + 2] = {id: 'car' + this.id, type: 'dinamic', c: '*'};
  }
  handleMove() {
    removeObject('car' + this.id, R(this.coords.x), this.coords.y, R(this.coords.x) + 5, this.coords.y + 5);
    if (this.diraction == 'right') {
      this.coords.x += this.v;
      if (Math.abs(this.v) < configs.maxV)
        this.v += this.a / 2;
    } else {
      this.coords.x += this.v * 4/5;
      if (this.diraction == 'up' && this.coords.y > 0)
        this.coords.y--;
      else if (this.diraction == 'down' && this.coords.y < configs.height - 3)
        this.coords.y++;
    }
    const collapse = anyCollapse('car' + this.id, this.box(), this.diraction);
    if (collapse) {
      if (this.diraction == 'right' || collapse.type == 'speed') {
        this.a = 0;
        if (collapse.type == 'static') {
          this.coords.x -= this.v;
          this.v = 0;
        } else if (collapse.type == 'dinamic') {
          this.v = collapse.v * 4/5;
        } else if (collapse.type == 'speed') {
          this.v = this.v * collapse.speed;
        }
      } else if (this.diraction == 'up' && this.coords.y < configs.height - 3) {
        this.coords.y++;
      } else if (this.diraction == 'down' && this.coords.y < configs.height) {
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
    log(x + '........');
    const y = this.coords.y;
    return [
     {x, y},
     {x: x + 1, y},
     {x: x + 2, y},
     {x: x + 3, y},
     {x: x + 0, y: y + 1},
     {x: x + 1, y: y + 1},
     {x: x + 2, y: y + 1},
     {x: x + 3, y: y + 1},
     {x: x + 0, y: y + 2},
     {x: x + 1, y: y + 2},
     {x: x + 2, y: y + 2},
     {x: x + 3, y: y + 2}
   ];
  }
}
const anyCollapse = (thisId, points, vector) => {
  for (let i = 0; i < points.length; i++) {
    //log(JSON.stringify(map[points[i].x]));
    //log(JSON.stringify(points[i]));
    if (map[points[i].x][points[i].y].id != thisId && map[points[i].x][points[i].y].type != 'road') {
      return map[points[i].x][points[i].y];
    }
  }
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
const fillMap = () => {
  for (let x = playerCar - configs.width; x < leaderCar + configs.width; x++) {
    if (map[x] == undefined) {
      map[x] = [];
      for (let y = 0; y < configs.height; y++) {
        map[x][y] = {c: ' ', type: 'road'}
      }
    }
    if (x % 2 == 0) {
      if (map[x][0].type == 'road')
        map[x][0] = {c: '#', type: 'speed', speed: 0.5}
      if (map[x][map[x].length - 1].type == 'road')
        map[x][map[x].length - 1] = {c: '#', type: 'speed', speed: 0.5}
    }
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
  jetty.moveTo([9999,0]).text('');
}
new Car(0, 10, 5);
new Car(1, 10, 9);
new Car(2, 15, 9);
setInterval(render, 50);
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
        if (Math.abs(cars[0].a) < configs.maxA)
          cars[0].a += 0.1;
        if (cars[0].v < 0)
          cars[0].v *= 0.2;
      break;
      case 'left':
        if (Math.abs(cars[0].a) < configs.maxA)
          cars[0].a -= 0.1;
        if (cars[0].v > 0)
          cars[0].v *= 0.2;
      break;
      case 'space':
        process.exit();
      break;
    }
  }
});

process.stdin.setRawMode(true);
process.stdin.resume();
