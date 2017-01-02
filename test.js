var version = 7;
var Neuvol;
var game;
var FPS = 60;
var autoFPS = false;
var lastScore = (new Array(8)).fill(null);
var scoreCursor = 0;

var nbSensors = 16;
var maxSensorSize = 200;
var memorySize = 5;

var hero;
if (!heroScore) var heroScore = 0;
var heroCount = 0;

var images = {};

function avg(elements) {
  return elements.filter(e => e !== null).reduce(function(sum, a,i,ar) {
    sum += a; return i==ar.length-1?(ar.length==0?0:sum/ar.length):sum
  },0);
}

(function() {
  var timeouts = [];
  var messageName = "t" + Math.random().toFixed(3);

  // Like setTimeout, but only takes a function argument.  There's
  // no time argument (always zero) and no arguments (you have to
  // use a closure).
  function setZeroTimeout(fn) {
    timeouts.push(fn);
    window.postMessage(messageName, "*");
  }

  function handleMessage(event) {
    if (event.source == window && event.data == messageName) {
      event.stopPropagation();
      if (timeouts.length > 0) {
        var fn = timeouts.shift();
        fn();
      }
    }
  }

  window.addEventListener("message", handleMessage, true);

    // Add the one thing we want added to the window object.
    window.setZeroTimeout = setZeroTimeout;
  })();

  var collisionAABB = function(obj1, obj2) {
    if(!(obj1.x > obj2.x + obj2.width || obj1.x + obj1.width < obj2.x || obj1.y > obj2.y + obj2.height || obj1.y + obj1.height < obj2.y)) {
      return true;
    }
    return false;
  }

  var collisionSegments = function(l1x1, l1y1, l1x2, l1y2, l2x1, l2y1, l2x2, l2y2) {
    var denominator = ((l2y2 - l2y1) * (l1x2 - l1x1)) - ((l2x2 - l2x1) * (l1y2 - l1y1));
    if (denominator === 0) {
      return false;
    }
    var a = l1y1 - l2y1;
    var b = l1x1 - l2x1;
    var numerator1 = ((l2x2 - l2x1) * a) - ((l2y2 - l2y1) * b);
    var numerator2 = ((l1x2 - l1x1) * a) - ((l1y2 - l1y1) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    var x = l1x1 + (a * (l1x2 - l1x1));
    var y = l1y1 + (a * (l1y2 - l1y1));
    if (a > 0 && a < 1 && b > 0 && b < 1) {
      return Math.sqrt(Math.pow(x - l1x1, 2) + Math.pow(y - l1y1, 2));
    }
    return false;
  };

  var collisionSegmentAABB = function(x1, y1, x2, y2, ax, ay, aw, ah) {
    var distance = 999999;
    var d = [
      collisionSegments(x1, y1, x2, y2, ax, ay, ax + aw, ay),
      collisionSegments(x1, y1, x2, y2, ax, ay, ax, ay + ah),
      collisionSegments(x1, y1, x2, y2, ax + aw, ay,  ax + aw, ay + ah),
      collisionSegments(x1, y1, x2, y2, ax, ay + ah,  ax + aw, ay + ah)   
    ];

    for(var i in d) {
      if(d[i] !== false && d[i] < distance) {
        distance = d[i];
      }
    }

    return distance;
  }

  var speed = function(fps) {
    FPS = parseInt(fps);
  }

  var loadImages = function(sources, callback) {
    var nb = 0;
    var loaded = 0;
    var imgs = {};
    for(var i in sources) {
      nb++;
      imgs[i] = new Image();
      imgs[i].src = sources[i];
      imgs[i].onload = function() {
        loaded++;
        if(loaded == nb) {
          callback(imgs);
        }
      }
    }
  }

  var Ship = function(json) {
    this.width = 30;
    this.height = 30;
    this.x = game.width * 0.5 - this.width * 0.5;
    this.y = game.height * 0.5 - this.height * 0.5;

    this.direction = 0;
    this.movex = 0;
    this.movey = 0;
    this.sens = 0;

    this.speed = 3;
    this.rotationSpeed = 0.3;

    this.alive = true;

    this.memory = new Float32Array((new Array(memorySize)).fill(0));

    this.cursor = 0;

    this.sensors = new Float32Array(nbSensors);
    this.sensorsWithMemory = new Float32Array(nbSensors + memorySize + 1);

    this.init(json);
  }

  Ship.prototype.init = function(json) {
    for(var i in json) {
      this[i] = json[i];
    }
  }

  Ship.prototype.getSensorDistances = function() {
    var i, l, distance, j, x1, y1, x2, y2, d, objx, objy, dbss, sensors = this.sensors;
    for (i = 0; i < nbSensors; i++) {
      sensors[i] = 1;
    }

    x1 = this.x + this.width * 0.5;
    y1 = this.y + this.height * 0.5;

    l = game.asteroids.length;
    for (i = 0; i < l; i++) {
      distance = Math.sqrt( Math.pow(game.asteroids[i].x + game.asteroids[i].width * 0.5 - this.x + this.width * 0.5, 2) + Math.pow(game.asteroids[i].y + game.asteroids[i].height * 0.5 - this.y + this.height * 0.5, 2));
      objx = game.asteroids[i].x + game.asteroids[i].width * 0.5;
      objy = game.asteroids[i].y + game.asteroids[i].height * 0.5;
      if(distance <= maxSensorSize) {
        for(j = 0; j < nbSensors; j++) {
          x2 = x1 + Math.cos(Math.PI * 2 / nbSensors * j + this.direction) * maxSensorSize;
          y2 = y1 + Math.sin(Math.PI * 2 / nbSensors * j + this.direction) * maxSensorSize;

          if(Math.abs(Math.atan2(objy - y1, objx - x1) - Math.atan2(y2 - y1, x2 - x1)) <= Math.PI * 2 / nbSensors) {
            d = collisionSegmentAABB(x1, y1, x2, y2, game.asteroids[i].x, game.asteroids[i].y, game.asteroids[i].width, game.asteroids[i].height);
            dbss = d/maxSensorSize;
            if(dbss < sensors[j]) {
              sensors[j] = dbss;
            }
          }
        }
      }
    }

    for(j = 0; j < nbSensors; j++) {
      x2 = x1 + Math.cos(Math.PI * 2 / nbSensors * j + this.direction) * maxSensorSize;
      y2 = y1 + Math.sin(Math.PI * 2 / nbSensors * j + this.direction) * maxSensorSize;
      d = collisionSegmentAABB(x1, y1, x2, y2, 0, 0, game.width, game.height);
      dbss = d/maxSensorSize;
      if(dbss < sensors[j]) {
        sensors[j] = dbss;
      }
    }

    return sensors;
  }

  Ship.prototype.update = function() {
  //this.direction += this.sens * this.rotationSpeed;

  this.x += this.movex * this.speed;
  this.y += this.movey * this.speed;
}

Ship.prototype.isDead = function() {
  if(this.x < 0 || this.x + this.width > game.width) {
    return true;
  }

  if(this.y < 0 || this.y + this.height > game.height) {
    return true;
  }

  for(var i in game.asteroids) {
    if(collisionAABB(this, game.asteroids[i])) {
      return true;
    }
  }
  return false;
}


var Asteroid = function(json) {
  this.x = 0;
  this.y = 0;
  this.width = 40;
  this.height = 40;

  this.speed = 2;

  this.vx = Math.random() * (Math.random() < 0.5 ? 1 : -1);
  this.vy = (1 - Math.abs(this.vx)) * (Math.random() < 0.5 ? 1 : -1);

  this.init(json);
}

Asteroid.prototype.init = function(json) {
  for(var i in json) {
    this[i] = json[i];
  }
}

Asteroid.prototype.update = function() {
  if(this.x + this.width * 0.5 < 0 || this.x + this.width * 0.5 > game.width) {
    this.vx *= -1;
  }

  if(this.y + this.height * 0.5 < 0 || this.y + this.height * 0.5 > game.height) {
    this.vy *= -1;
  }

  this.x += this.vx * this.speed;
  this.y += this.vy * this.speed;
}


var Game = function() {
  this.asteroids = [];
  this.ships = [];

  this.score = 0;

  this.canvas = document.querySelector("#asteroids");
  this.ctx = this.canvas.getContext("2d");
  this.width = this.canvas.width;
  this.height = this.canvas.height;

  this.spawnInterval = 10;//120;
  this.interval = 0;
  this.maxAsteroids = 1;

  this.gen = [];

  this.alives = 0;
  this.generation = 0;
}

Game.prototype.start = function() {
  this.interval = 0;
  this.score = 0;
  this.asteroids = [];
  this.ships = [];

  for(var i in this.gen) {
    var s = new Ship();
    this.ships.push(s);
  }
  this.generation++;
  this.alives = this.ships.length;
}

Game.prototype.update = function() {
  var ship, s, inputs, gen;
  for(var i in this.ships) {
    if(this.ships[i].alive) {
      ship = this.ships[i];
      inputs = ship.getSensorDistances();

      for (s = 0; s < nbSensors; s++) {
        ship.sensorsWithMemory[s] = inputs[s];
      }
      for (s = 0; s < memorySize; s++) {
        ship.sensorsWithMemory[nbSensors + s] = ship.memory[s];
      }
      // pulse
      ship.sensorsWithMemory[nbSensors + memorySize] = (this.score % 100) / 100;

      gen = game.gen[i];
      var res = gen.compute(ship.sensorsWithMemory);
      ship.movex = 0;
      ship.movey = 0;

      if(res[0] > 0.65) {
        ship.movex++;
      }
      if(res[0] < 0.45) {
        ship.movex--;
      }

      if(res[1] > 0.65) {
        ship.movey++;
      }
      if(res[1] < 0.45) {
        ship.movey--;
      }

      ship.cursor = Math.floor(res[2] * memorySize);
      if(res[3] > 0.2) {
        ship.memory[ship.cursor] = res[4] * res[4];
      }

      ship.update();
      if(ship.isDead()) {
        ship.alive = false;
        this.alives--;
        if (this.alives < 4 && autoFPS) {
          FPS = 120;
        }
        //Neuvol.networkScore(gen, this.score);
        if(this.isItEnd()) {
          if (autoFPS) {
            FPS = 0;
          }
          if (game.score > heroScore) {
            debugger;
            hero = gen.getSave();
            heroScore = game.score;
            if (i !== 10) {
              heroCount++;
            }
          }
          lastScore[scoreCursor++ % lastScore.length] = this.score;
          this.start();
        }
      }
    }
  }

  for (var i = 1; i < this.asteroids.length; i++) {
    this.asteroids[i].update();
  }

  if(this.interval === 0 && this.asteroids.length < this.maxAsteroids) {
    this.spawnAsteroids();
  }

  this.interval++;
  if(this.interval === this.spawnInterval) {
    this.interval = 0;
  }

  this.score++;

  if (FPS === 0) {
    setZeroTimeout(() => {
      this.update();
    });
  } else {
    setTimeout(() => {
      this.update();
    }, 1000/FPS);
  }
}

Game.prototype.spawnAsteroids = function() {
  var spawns = [
    {x:0 + 30, y:0 + 30},
    //{x:0 + 30, y:this.height - 50},
    //{x:this.width - 50, y:this.height - 50},
    //{x:this.width - 50, y:0 + 30}
  ];
  for(var i in spawns) {
    var a = new Asteroid({
      x:spawns[i].x,
      y:spawns[i].y,
    });
    this.asteroids.push(a);
  }
}

Game.prototype.isItEnd = function() {
  for(var i in this.ships) {
    if(this.ships[i].alive) {
      return false;
    }
  }
  return true;
}

Game.prototype.display = function() {
  //this.ctx.clearRect(0, 0, this.width, this.height);
  this.ctx.fillStyle='#000';
  this.ctx.fillRect(0,0,this.width, this.height);
  this.ctx.drawImage(images.background, 0, 0, this.width, this.height);
  for (i = this.ships.length - 1; i >= 0; i--) {
  //for(var i in this.ships) {
    if(this.ships[i].alive) {
      if (this.alives < 4) {
        for(var j = 0; j < nbSensors; j++) {
          this.ctx.strokeStyle = 'rgba(255,255,255,'+(1-this.ships[i].sensors[j])+')';
          var x1 = this.ships[i].x + this.ships[i].width * 0.5;
          var y1 = this.ships[i].y + this.ships[i].height * 0.5;
          var x2 = x1 + Math.cos(Math.PI * 2 / nbSensors * j + this.ships[i].direction) * maxSensorSize;
          var y2 = y1 + Math.sin(Math.PI * 2 / nbSensors * j + this.ships[i].direction) * maxSensorSize;
          this.ctx.beginPath();
          this.ctx.moveTo(x1, y1);
          this.ctx.lineTo(x2, y2);
          this.ctx.stroke();
        }
      }
      this.ctx.strokeStyle = i == 10 ? 'cyan' : 'red';
      this.ctx.strokeRect(this.ships[i].x, this.ships[i].y, this.ships[i].width, this.ships[i].height);
      this.ctx.drawImage(images.ship, this.ships[i].x, this.ships[i].y, this.ships[i].width, this.ships[i].height);

      /*this.ctx.save(); 
      this.ctx.translate(this.ships[i].x, this.ships[i].y);
      this.ctx.translate(this.ships[i].width * 0.5, this.ships[i].height * 0.5);
      this.ctx.rotate(this.ships[i].direction + Math.PI * 0.5);
      this.ctx.drawImage(images.ship, -this.ships[i].width * 0.5, -this.ships[i].height * 0.5, this.ships[i].width, this.ships[i].height);
      this.ctx.restore();*/
    }
  }

  this.ctx.strokeStyle = 'yellow';
  for(var i in this.asteroids) {
    this.ctx.strokeRect(this.asteroids[i].x, this.asteroids[i].y, this.asteroids[i].width, this.asteroids[i].height);
    //this.ctx.drawImage(images.asteroid, this.asteroids[i].x, this.asteroids[i].y, this.asteroids[i].width, this.asteroids[i].height);
  }

  this.ctx.fillStyle = 'white';
  this.ctx.font='16px monospace';
  this.ctx.fillText('Score: '+this.score, 10, 25);
  this.ctx.fillText('Average: ' + avg(lastScore).toFixed(0) + ' (' +lastScore.join(' ') + ')', 10, 50);
  this.ctx.fillText('Generation: '+this.generation + ' / Hero: '+ heroCount + ' (' + heroScore + ')', 10, 75);
  this.ctx.fillText('Alive: '+this.alives+' / '+Neuvol.options.population, 10, 100);

  this.ctx.font = '14px monospace';
  var y = 0;
  for (var i = 0; i < this.ships.length; i++) {
    if (this.ships[i].alive) {
      for (var m = 0; m < memorySize; m++) {
        this.ctx.fillStyle = this.ships[i].cursor === m ? 'yellow' : 'cyan';
        this.ctx.fillText(Math.ceil(this.ships[i].memory[m] * 100), 10 + m * 40, 125 + y * 16);
      }
      this.ctx.fillStyle = 'gray';
      this.ctx.fillText(Math.ceil(this.ships[0].sensorsWithMemory[nbSensors + memorySize]  * 100), 10 + m * 40, 125 + y * 16);
      if (y++ > 5) break;
    }
  }
  
}

window.onload = function() {
  var sprites = {
    ship:'img/ship.png',
    asteroid:'img/asteroid.png',
    background:'img/fond.png'
  };

  var start = function() {
    if (localStorage['nn' + version + 'generation']) {
      var data = JSON.parse(localStorage['nn' + version + 'gen'])[10];
    } else {
      var data = hero;
    }

    var sublayers = [];
    for (var i = 1; i < data.neurons.length - 1; i++) {
      sublayers.push(data.neurons[i]);
    }
    console.log([data.neurons[0], sublayers, data.neurons[sublayers.length + 1]]);

    Neuvol = new Neuroevolution({
      population: 1,
      network:[data.neurons[0], sublayers, data.neurons[sublayers.length + 1]],
      randomBehaviour:0.3,
      mutationRate:0.4, 
      mutationRange:0.8, 
    });
    
    game = new Game();
    game.gen = Neuvol.nextGeneration();
    game.start();
  
    game.gen[0].setSave(data);

    if (FPS === 0) {
      setTimeout(function() {
        game.update();
      });
    } else {
      setTimeout(function() {
        game.update();
      }, 1000/FPS);
    }

    game.spawnAsteroids();
    game.canvas.onmousemove = (event) => {
      game.asteroids[0].x = event.clientX - 25;
      game.asteroids[0].y = event.clientY - 25;
    };

    function render() {
      setTimeout(() => requestAnimationFrame(render), 20);
      game.display();
    }
    render(0);
  }

  loadImages(sprites, function(imgs) {
    images = imgs;
    start();
  })

};