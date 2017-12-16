const Jetty = require('jetty');
const keypress = require('keypress');
const jetty = new Jetty(process.stdin);
jetty.clear();
const snake = [];
let eaten = -1;
let dir = 0;
// 0 - up, 1 - right, 2 - down, 3 - left

const map = {width: 
10, height: 
15};
let speed = 10;
let startLength = 5;
for (let i = 0; i < 
process.argv.length - 1; i++) {
  const thisArg = process.argv[i];
  const next = process.argv[i + 1] * 1;
  if (thisArg == '-s' || thisArg == 
'--speed')
    speed = next;
  if (thisArg == '-l' || thisArg == 
'--length')
    startLength = next;
  if (thisArg == '-h' || thisArg == 
'--height')
    map.width = next;
  if (thisArg == '-w' || thisArg == 
'--width')
    map.height = next;
}
for (let i = 0; i <=  map.height + 1 ; i++) {
  jetty.moveTo([0, i]).text('O');
  jetty.moveTo([map.width + 1, i]).text('O');
}
for (let i = 0; i <= map.width; i++) {
  jetty.moveTo([i, 0]).text('O');
  jetty.moveTo([i, map.height + 1]).text('O');
}

snake.push({
  x: Math.round(map.width / 2),
  y: Math.round(map.height / 2)
});
// # - snake
// @ - food
// ' ' - map
const food = {};
const newFood = () => {
  if (snake.length >= map.width * map.height) {
    console.log('  you win');
  } else {
    while (true) {
      food.x = Math.round((map.width - 
1) * Math.random());
      food.y = Math.round((map.height 
- 1) * Math.random());
      let inSnake = false;
      for (let i = 0; i < snake.length; i++) {
        if (snake[i].x == food.x && 
snake[i].y == food.y) {
          inSnake = true;
          break;
        }
      }
      if (!inSnake)
        break;
    }
  }
}
const render = details => {
  for (let i = 0; i < details.length; 
i++) {
    jetty.moveTo([details[i].x + 1, 
details[i].y + 1]).text(details[i].content);
  }
  jetty.moveTo([map.height + 2, 
0]).text(`score ${eaten}, speed ${speed}`);
  jetty.moveTo([map.width + 3, 
0]).text('');
  //console.log(details);
}
const mainTick = setInterval(() => {
  const changes = [];
  if (snake.length > startLength + 
eaten) 
{
    changes.push({
      x: snake[0].x,
      y: snake[0].y,
      content: ' '
    });
    snake.shift();
  }
  switch (dir) {
    case 0:
      snake.push({
        x: snake[snake.length - 1].x + 0,
        y: snake[snake.length - 1].y - 1
      })
    break;
    case 1:
      snake.push({
        x: snake[snake.length - 1].x + 1,
        y: snake[snake.length - 1].y + 0
      });
    break;
    case 2:
      snake.push({
        x: snake[snake.length - 1].x + 0,
        y: snake[snake.length - 1].y + 1
      });
    break;
    case 3:
      snake.push({
        x: snake[snake.length - 1].x - 1,
        y: snake[snake.length - 1].y + 0
      });
    break;
  }
  if (snake[snake.length - 1].x >= map.width)
    snake[snake.length - 1].x = 0;
  if (snake[snake.length - 1].y >= map.height)
    snake[snake.length - 1].y = 0;
  if (snake[snake.length - 1].x < 0)
    snake[snake.length - 1].x = map.width- 1;
  if (snake[snake.length - 1].y < 0)
    snake[snake.length - 1].y = map.height - 1;
  changes.push({
    x: snake[snake.length - 1].x,
    y: snake[snake.length - 1].y,
    content: '#'
  });
  if (eaten == -1 || food.x == 
snake[snake.length - 1].x && food.y == 
snake[snake.length - 1].y) {
    eaten++;
    newFood();
    changes.push({
      x: food.x,
      y: food.y,
      content: '@'
    });
  }
  for (let i = 0; i < snake.length - 1; 
i++) {
    if (snake[snake.length - 1].x ==
snake[i].x && snake[snake.length - 1].y 
== snake[i].y) {
      console.log('  game over');
      process.exit()
    }
  }
  render(changes);
}, 1000 / speed);

keypress(process.stdin);
process.stdin.on('keypress', (ch, key) => {
  if (key == undefined)
    return;
  switch (key.name) {
    case 'q':
      process.exit();
    break;
    case 'c':
      process.exit();
    break;
    case 'space':
      process.exit();
    break;
    case 'enter':
      process.exit();
    break;
    case 'left':
      if (dir != 2)
        dir = 0;
    break;
    case 'down':
      if (dir != 3)
        dir = 1;
    break;
    case 'right':
      if (dir != 0)
        dir = 2;
    break;
    case 'up':
      if (dir != 1)
        dir = 3;
    break;
  }
});

process.stdin.setRawMode(true);
process.stdin.resume();
