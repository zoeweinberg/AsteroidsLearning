//ZW
//AsteroidsLearning7_ReLU
//game.js
//bot1 and bot2 are the same except for activation function in Neuroevolution.js and Neuroevolution_ReLU.js
//bot2 is ReLU

var gameStaticCounter = 0.436; //seed
gameCustomRandom = function() {
	gameStaticCounter += 0.3974;
	
	var result = gameStaticCounter % 1.0; //modulus
	//console.log("gameStaticCounter is ", gameStaticCounter, ". gameCustomRandom() result is ", result);
	return Math.random();//result;
};


var Neuvol;
var Neuvol2;
var game;
var FPS = 60; //Default speed (Frames Per Second)
var numScoresToShow = 25;
var numScoresToRemember = 50;
var intersections = [];
var intersectionsVert = [];

var showIntersections = false;

var shownError = false;

var bleh = 1;//0.7; //0 to 1
//Visual preference 
//Also, making these false might speed up the game and training
//though can always be changed by the user
var shouldDrawImages = false; //true; 
var shouldDrawSensors = false;
var shouldDrawScoreHistory = true;
var shouldShowText = true; //false;

var generalDivider = ';';
var teamDivider = ',';
var shipDivider = '/';
var detailDivider = '~';
var weightsDivider = ' ';
var asteroidDivider = '@';
var asteroidDetailsDivider = '#';

var bot1Color = "yellow";
var bot1SensorColor = "orange";

var bot2Color = "red";
var bot2SensorColor = "purple";

var asteroidColor = "tan";

var nbSensors = 16;
var nbSensors2 = 16;//2+2+(10*2)+2 + nbSensors;

var maxSensorSize = 200;//600;//199;//320*2;//220;
var maxSensorSize2 = 200;//200;

var asteroidWidth = 40;
var asteroidHeight = 40;

var asteroidSpeed = 2;
var shipSpeed = 3;

var bot1NetWins = 0;

var images = {};

(function() {
	var timeouts = [];
	var messageName = "zero-timeout-message";

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

/*
function drawLine (x1, y1, x2, y2) {
  for(var t; t<x2-x1)  {
    x1 += Math.sign(x2-x1)*4;
    y1 += Math.sign(y2-y1)*4;
    game.ctx.strokeRect(x1, y1, x1+10, y2+10);  
  }
}*/

var collisionAABB = function(obj1, obj2){
	/*
    if(!(obj1.x > obj2.x + obj2.width || obj1.x + obj1.width < obj2.x || obj1.y > obj2.y + obj2.height || obj1.y + obj1.height < obj2.y)){
		return true;
	}
	return false;
	*/
	return !(obj1.x > obj2.x + obj2.width
        || obj1.x + obj1.width < obj2.x
        || obj1.y > obj2.y + obj2.height
        || obj1.y + obj1.height < obj2.y);
};

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


//with horizontal line segment
var intersectionHor = function(x1, y1, x2, y2, horSegX, horSegY, horSegWidth) {
  //some maths
  
  //y = mx + b
  //y = horSegY
  
  //y = mx + b
  
  var intersectionX, intersectionY;
  
  //vertical line test
  if(x2 == x1) {
    intersectionX = x1;
    intersectionY = horSegY;
  } else {
    var slope = (y2-y1)/(x2-x1);
    
    //y-y1 = slope*(x-x1)
    
    //horSegY-y1 = slope*(x-x1)
    //(horSegY-y1)/slope = x-x1
    //((horSegY-y1)/slope)+x1 = x
    
    intersectionX = ((horSegY-y1)/slope)+x1;
    intersectionY = horSegY;  
  }
  
  intersectionsVert.push([intersectionX, intersectionY]);
  
  if(Math.sign(intersectionX-x1) !== 0 && Math.sign(intersectionX-x1) == Math.sign(intersectionX-x2) ) {
    //intersection is not in the first line segment
    return false;
  }
  if(Math.sign(intersectionY-y1) !== 0 && Math.sign(intersectionY-y1) == Math.sign(intersectionY-y2) ) {
    //intersection is not in the first line segment
    return false;
  }
  
  if(Math.sign(intersectionX-horSegX) !== 0 && Math.sign(intersectionX-horSegX) == Math.sign(intersectionX-(horSegX+horSegWidth)) ) {
    //intersection is not in hor. line segment
    return false;
  }
  
  //distance
  return Math.sqrt(Math.pow(intersectionX - x1, 2) + Math.pow(intersectionY - y1, 2));
};

//with vertical line segment
var intersectionVer = function(x1, y1, x2, y2, verSegX, verSegY, verSegHeight) {
  //some maths
  
  //y = mx + b
  //y = verSegY
  
  //y = mx + b
  
  var intersectionX, intersectionY;
  
  //vertical line test
  if(x2 == x1) { 
    //parallel vertical lines. intersects in many points. 
    //should also intersect the horizontal lines so doesn't matter for this game
    
    intersectionX = verSegX;
    intersectionY = verSegY;
  } else {
    var slope = (y2-y1)/(x2-x1);
    
    //y-y1 = slope*(x-x1)
    
    //y-y1 = slope*(verSegX-x1)
    //y = slope*(verSegX-x1) + y1
    
    intersectionX = verSegX;
    intersectionY = slope*(verSegX-x1) + y1;  
  }
  
  intersections.push([intersectionX, intersectionY]);
  
  if(Math.sign(intersectionX-x1) !== 0 && Math.sign(intersectionX-x1) == Math.sign(intersectionX-x2) ) {
    //intersection is not in the first line segment
    return false;
  }
  if( (Math.sign(intersectionY-y1) !== 0) && (Math.sign(intersectionY-y1) == Math.sign(intersectionY-y2) ) ) {
    //intersection is not in the first line segment
    return false;
  }
  
  //if(/*Math.sign(intersectionY-verSegY) !== 0 && */ Math.sign(intersectionY-verSegY) == Math.sign(intersectionY-(verSegY+verSegHeight)) ) {
  if( !(verSegY <= intersectionY && intersectionY <= verSegY+verSegHeight)) {
    //intersection is not in ver. line segment
    return false;
  } 
  
  //distance
  return Math.sqrt(Math.pow(intersectionX - x1, 2) + Math.pow(intersectionY - y1, 2));
};

/*
//http://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
function lineIntersect(x1,y1,x2,y2, x3,y3,x4,y4) {
    var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    if (isNaN(x)||isNaN(y)) {
        return false;
    } else {
        if (x1>=x2) {
            if (!(x2<=x&&x<=x1)) {return false;}
        } else {
            if (!(x1<=x&&x<=x2)) {return false;}
        }
        if (y1>=y2) {
            if (!(y2<=y&&y<=y1)) {return false;}
        } else {
            if (!(y1<=y&&y<=y2)) {return false;}
        }
        if (x3>=x4) {
            if (!(x4<=x&&x<=x3)) {return false;}
        } else {
            if (!(x3<=x&&x<=x4)) {return false;}
        }
        if (y3>=y4) {
            if (!(y4<=y&&y<=y3)) {return false;}
        } else {
            if (!(y3<=y&&y<=y4)) {return false;}
        }
    }
    return Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));
}
*/

//ax x coordinate of box
//aw width of box
var collisionSegmentAABB = function(x1, y1, x2, y2, ax, ay, aw, ah){
	var bigNum = 999999;
	var distance = bigNum;
	var d = [];
	//d.push(collisionSegments(x1, y1, x2, y2, ax, ay, ax + aw, ay)); //top horizontal line
	d.push(intersectionHor(x1, y1, x2, y2, ax, ay, aw)); //top horizontal line
	
	//d.push(collisionSegments(x1, y1, x2, y2, ax, ay, ax, ay + ah)); //left vertical line
	d.push(intersectionVer(x1, y1, x2, y2, ax, ay, ah)); //left vertical line
	
	//d.push(collisionSegments(x1, y1, x2, y2, ax + aw, ay,  ax + aw, ay + ah)); //right vertical line
	d.push(intersectionVer(x1, y1, x2, y2, ax + aw, ay,  ah)); //right vertical line
	
	//d.push(collisionSegments(x1, y1, x2, y2, ax, ay + ah,  ax + aw, ay + ah)); //bottom horizontal line
	d.push(intersectionHor(x1, y1, x2, y2, ax, ay + ah,  aw)); //bottom horizontal line

  //get minimum distance of those distances
	for(var i in d){
		//if(d[i] != false && d[i] < distance){
		if(d[i] !== false && d[i] < distance){
			distance = d[i];
		}
	}

  //note: distance can be bigNum (no intersections)
  
	return distance;
};

var logErrorOnce = function(){
  if(!shownError) { //don't want to lag the game with printouts
    console.log("error");
    shownError = true;
  }
};

var toggleShouldDrawImages = function(){
    if(shouldDrawImages) {
        shouldDrawImages = false;
    } else {
        shouldDrawImages = true;
    }
};

var toggleShouldDrawSensors = function(){
    if(shouldDrawSensors) {
        shouldDrawSensors = false;
    } else {
        shouldDrawSensors = true;
    }
};

var toggleShouldShowText = function(){
    if(shouldShowText) {
        shouldShowText = false;
    } else {
        shouldShowText = true;
    }
};

var speed = function(fps){
	FPS = parseInt(fps);
};

var saveGame = function(){
    game.saveGame();
};

var loadGame = function(){
  game.loadGame();
  //return;
};

  // http://stackoverflow.com/questions/7431268/how-to-read-data-from-csv-file-using-javascript


var loadImages = function(sources, callback){
	var nb = 0;
	var loaded = 0;
	var imgs = {};
	for(var i in sources){
		nb++;
		imgs[i] = new Image();
		imgs[i].src = sources[i];
		
		// /*
		imgs[i].onload = function(){
			loaded++;
			if(loaded == nb){
				callback(imgs);
			}
		};
		// */
		
		/*
		loaded++;
		if(loaded == nb){
			callback(imgs);
		}
		*/
	}
};

var Ship = function(json){
	this.shipScore = 0;
	
	this.width = 30;
	this.height = 30;
	this.x = game.width/2 - this.width/2;
	this.y = game.height/2 - this.height/2;

	this.direction = 0;
	this.movex = 0;
	this.movey = 0;
	this.sens = 0;

	this.speed = shipSpeed;//3;
	this.rotationSpeed = 0.3;

	this.alive = true;

  this.sensors = [];
	for(var i = 0; i < nbSensors; i++){ 
	  //something should be changed if one set of bots is given more sensors
	  
		this.sensors.push(1);
	}
	
	this.sensors2 = [];
	for(var i2 = 0; i2 < nbSensors2; i2++){ 
	  //something should be changed if one set of bots is given more sensors
	  
		this.sensors2.push(1);
	}
	
	this.collisionX = [];
	for(var ix = 0; ix < nbSensors; ix++){
		this.collisionX.push(1);
	}
	
	this.collisionY = [];
	for(var iy = 0; iy < nbSensors; iy++){
		this.collisionY.push(1);
	}
	
	this.init(json);
};

Ship.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
};

Ship.prototype.getSensorDistances = function(){
	for(var i = 0; i < nbSensors; i++){
		this.sensors[i]=1;//.push(1);
	}

	for(var ii in game.asteroids){
		var distance = Math.sqrt( Math.pow(game.asteroids[ii].x + game.asteroids[ii].width/2 - this.x + this.width/2, 2) + Math.pow(game.asteroids[ii].y + game.asteroids[ii].height/2 - this.y + this.height/2, 2));
		
		/*
		var diagonal = Math.sqrt(
		  Math.pow(game.asteroids[ii].width, 2) + 
		  Math.pow(game.asteroids[ii].height, 2)
		  )/2;
		  */
		var extra = game.asteroids[ii].width+game.asteroids[ii].height;
		if(distance <= maxSensorSize + extra){
			for(var j = 0; j < nbSensors; j++){
				var x1 = this.x + this.width/2;
				var y1 = this.y + this.height/2;
				var x2 = x1 + Math.cos(Math.PI * 2 / nbSensors * j + this.direction) * maxSensorSize;
				var y2 = y1 + Math.sin(Math.PI * 2 / nbSensors * j + this.direction) * maxSensorSize;

				var objx = game.asteroids[ii].x + game.asteroids[ii].width/2;
				var objy = game.asteroids[ii].y + game.asteroids[ii].height/2;


				if(true || Math.abs(Math.atan2(objy - y1, objx - x1) - Math.atan2(y2 - y1, x2 - x1)) <= Math.PI * 2 / nbSensors){
					var d = collisionSegmentAABB(x1, y1, x2, y2, game.asteroids[ii].x, game.asteroids[ii].y, game.asteroids[ii].width, game.asteroids[ii].height);
					if(d/maxSensorSize < this.sensors[j]){
						this.sensors[j] = d/maxSensorSize;
					}		
				}
				
				//this.collisionX[j] = x2;
		    //this.collisionY[j] = y2;
			}
		}
	}

	for(var jj = 0; jj < nbSensors; jj++){
		var x1b = this.x + this.width/2;
		var y1b = this.y + this.height/2;
		var x2b = x1b + Math.cos(Math.PI * 2 / nbSensors * jj + this.direction) * maxSensorSize;
		var y2b = y1b + Math.sin(Math.PI * 2 / nbSensors * jj + this.direction) * maxSensorSize;

		var db = collisionSegmentAABB(x1b, y1b, x2b, y2b, 0, 0, game.width, game.height);
		if(db/maxSensorSize < this.sensors[jj]){
			this.sensors[jj] = db/maxSensorSize;
		}
		
		this.collisionX[jj] = x1b + Math.cos(Math.PI * 2 / nbSensors * jj + this.direction) * this.sensors[jj] * (maxSensorSize * bleh);// / maxSensorSize;
		this.collisionY[jj] = y1b + Math.sin(Math.PI * 2 / nbSensors * jj + this.direction) * this.sensors[jj] * (maxSensorSize * bleh);// / maxSensorSize;
	}
  
	return this.sensors;
};

Ship.prototype.getSensorDistances2 = function(){
	//var this.sensors2 = [];
	for(var i = 0; i < nbSensors2; i++){
		this.sensors2[i]=1; //this.sensors2.push(1); //wtf
	}

	for(var ii in game.asteroids){
		var distance = Math.sqrt( Math.pow(game.asteroids[ii].x + game.asteroids[ii].width/2 - this.x + this.width/2, 2) + Math.pow(game.asteroids[ii].y + game.asteroids[ii].height/2 - this.y + this.height/2, 2));
		
		//seems like it would be more efficient but doesn't work with intersection checking
		/*
		var diagonal = Math.sqrt(
		  Math.pow(game.asteroids[ii].width, 2) + 
		  Math.pow(game.asteroids[ii].height, 2)
		  )/2;
		*/
		  
		var extra = game.asteroids[ii].width+game.asteroids[ii].height;
		  
		if(distance <= maxSensorSize2 + extra){
			for(var j = 0; j < nbSensors2; j++){
				var x1 = this.x + this.width/2;
				var y1 = this.y + this.height/2;
				var x2 = x1 + Math.cos(Math.PI * 2 / nbSensors2 * j + this.direction) * maxSensorSize2;
				var y2 = y1 + Math.sin(Math.PI * 2 / nbSensors2 * j + this.direction) * maxSensorSize2;

				var objx = game.asteroids[ii].x + game.asteroids[ii].width/2;
				var objy = game.asteroids[ii].y + game.asteroids[ii].height/2;


				if(true || Math.abs(Math.atan2(objy - y1, objx - x1) - Math.atan2(y2 - y1, x2 - x1)) <= Math.PI * 2 / nbSensors2){
					var d = collisionSegmentAABB(x1, y1, x2, y2, game.asteroids[ii].x, game.asteroids[ii].y, game.asteroids[ii].width, game.asteroids[ii].height);
					if(d/maxSensorSize2 < this.sensors2[j]){
						this.sensors2[j] = d/maxSensorSize2;
					}		
				}
			}
		}
	}

	for(var jj = 0; jj < nbSensors2; jj++){
		var x1b = this.x + this.width/2;
		var y1b = this.y + this.height/2;
		var x2b = x1b + Math.cos(Math.PI * 2/ nbSensors2 * jj + this.direction) * maxSensorSize2;
		var y2b = y1b + Math.sin(Math.PI * 2 / nbSensors2 * jj + this.direction) * maxSensorSize2;

		var db = collisionSegmentAABB(x1b, y1b, x2b, y2b, 0, 0, game.width, game.height);
		if(db/maxSensorSize2 < this.sensors2[jj]){
			this.sensors2[jj] = db/maxSensorSize2;
		}
		
	  //this.collisionX[jj] = x2b;
		//this.collisionY[jj] = y2b;
		
		this.collisionX[jj] = x1b + Math.cos(Math.PI * 2 / nbSensors2 * jj + this.direction) * this.sensors2[jj] * (maxSensorSize2 * bleh);
		this.collisionY[jj] = y1b + Math.sin(Math.PI * 2 / nbSensors2 * jj + this.direction) * this.sensors2[jj] * (maxSensorSize2 * bleh);
	}

	return this.sensors2;
};

Ship.prototype.update = function(){
  this.x += this.movex * this.speed;
  this.y += this.movey * this.speed;
  this.shipScore = game.score; //sloppy. should probably get score at loading
};

Ship.prototype.setAlive = function(setting){
  this.alive = setting;
};

Ship.prototype.isDead = function(){
  
  
  //important for loading game where ships are already dead
  if(!this.alive) {
    return true; //not alive, so IS dead
  }
  
  
	if(this.x < 0 || this.x + this.width > game.width){
		return true;
	}

	if(this.y < 0 || this.y + this.height > game.height){
		return true;
	}

	for(var i in game.asteroids){
		if(collisionAABB(this, game.asteroids[i])){
			return true;
		}
	}
	return false;
};

var Asteroid = function(json){
	this.x = 0;
	this.y = 0;
	this.width = asteroidWidth; // 40;
	this.height = asteroidHeight; // 40;

	this.speed = asteroidSpeed;//2;

	this.vx = gameCustomRandom() * (gameCustomRandom() < 0.5 ? 1 : -1);
	this.vy = (1 - Math.abs(this.vx)) * (gameCustomRandom() < 0.5 ? 1 : -1);

	this.init(json);
};

Asteroid.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
};

Asteroid.prototype.update = function(){
	if(this.x + this.width/2 < 0 || this.x + this.width/2 > game.width){
		this.vx *= -1;
	}

	if(this.y + this.height/2 < 0 || this.y + this.height/2 > game.height){
		this.vy *= -1;
	}

	this.x += this.vx * this.speed;
	this.y += this.vy * this.speed;
};


var Game = function(){
	this.asteroids = [];
	this.ships = [];
	this.ships2 = [];
	this.humanShips = [];

	this.score = -1;
	this.score2 = -1; //haven't started yet

	this.canvas = document.querySelector("#asteroids");
	this.ctx = this.canvas.getContext("2d");
	this.width = this.canvas.width;
	this.height = this.canvas.height;

	this.spawnInterval = 120;
	this.interval = 0;
	this.maxAsteroids = 10;//1;//0; //times 2

	this.gen = [];
	this.gen2 = [];

	this.alives = 0;
	this.alives2 = 0;
	this.generation = 0;
	
	this.scoreHistory = [];
	this.score2History = [];
	
	this.fullScoreHistory = [];
	this.fullScore2History = [];
	
	
	for(var i = 0; i < numScoresToShow; i++) {
	  this.scoreHistory.push(-1);
	  this.score2History.push(-1);
	}
	
	/*
	for(var i = 0; i < numScoresToRemember; i++) {
	  this.fullScoreHistory.push(-1);
	  this.fullScore2History.push(-1);
	}
	*/
	
};

Game.prototype.start = function(){
  console.log("in Game.prototype.start");
  this.scoreHistory.push(this.score);
  this.score2History.push(this.score2);
  
  this.fullScoreHistory.push(this.score);
  this.fullScore2History.push(this.score2);
  

  if(this.scoreHistory.length > numScoresToShow) {
    for(var i = 0; i < numScoresToShow; i++) {
  	  this.scoreHistory[i] = this.scoreHistory[i+1];
  	  this.score2History[i] = this.score2History[i+1];
  	}
  	this.scoreHistory.pop();
    this.score2History.pop();
  }
  
  /*
  if(this.fullScoreHistory.length > numScoresToRemember) {
    for(var i = 0; i < numScoresToRemember; i++) {
  	  this.fullScoreHistory[i] = this.fullScoreHistory[i+1];
  	  this.fullScore2History[i] = this.fullScore2History[i+1];
  	}
  	this.fullScoreHistory.pop();
    this.fullScore2History.pop();
  }
  */
  
	this.interval = 0;
	this.score = 0;
	this.score2 = 0;
	this.asteroids = [];
	this.ships = [];
	this.ships2 = [];
	this.humanShips = [];

	this.gen = Neuvol.nextGeneration(); //list of networks
	console.log("this.gen[0].weights is ", this.gen[0].weights);
	//44//console.log("game.prototype.start ing");
	//44//console.log("game.prototype.start " + this.gen[0].getSave().weights[0]);
	for(var i in this.gen){
		var s = new Ship();
		this.ships.push(s);
	}
	//var oijefoi = this.gen2;
	//var oijefoi = Neuvol2;
	this.gen2 = Neuvol2.nextGeneration();
	for(var i2 in this.gen2){
		var s2 = new Ship();
		this.ships2.push(s2);
	}
	//for(var i in 1){ ///human
		var h = new Ship();
		this.humanShips.push(h);
	//}
	this.generation++;
	this.alives = this.ships.length;
	this.alives2 = this.ships2.length;
};

var rightPressed = false; //should it be?
var leftPressed = false;
var upPressed = false;
var downPressed = false;
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
function keyDownHandler(e) {
    if(e.keyCode == 39) {
        rightPressed = true;
    }
    else if(e.keyCode == 37) {
        leftPressed = true;
    }

 	if(e.keyCode == 38) {
        upPressed = true;
    }
    else if(e.keyCode == 40) {
        downPressed = true;
    }
       
}

function keyUpHandler(e) {
    if(e.keyCode == 39) {
        rightPressed = false;
    }
    else if(e.keyCode == 37) {
        leftPressed = false;
    }

    if(e.keyCode == 38) {
        upPressed = false;
    }
    else if(e.keyCode == 40) {
        downPressed = false;
    }
}

Game.prototype.update = function(){
  intersections = [];
  intersectionsVert = [];
  var firstAlive = false;
	var firstSave;
	//var userSave;
	for(var i3 in this.ships){
		if(this.ships[i3].alive){
			var inputs = this.ships[i3].getSensorDistances();
			
			if(this.generation == 2) {
			  //jun5//console.log("begin inputs");
			  for(var iInput in inputs) {
			    //jun5//console.log("inputs[iInput] is ", inputs[iInput]);
			  }
			  //jun5//console.log("end inputs");
			}
			
			var res = this.gen[i3].compute(inputs, (this.generation == 2) );
			
			if(this.generation == 2) {
			  //jun5//console.log("begin res");
			  for(var iRes in res) {
			    //jun5//console.log("res[iRes] is ", res[iRes]);
			  }
			  //jun5//console.log("end res");
			}

			this.ships[i3].movex = 0;
			this.ships[i3].movey = 0;

			if(res[0] > 0.65){
				this.ships[i3].movex++;
			}
			if(res[0] < 0.45){
				this.ships[i3].movex--;
			}

			if(res[1] > 0.65){
				this.ships[i3].movey++;
			}
			if(res[1] < 0.45){
				this.ships[i3].movey--;
			}

			this.ships[i3].update();
			if(this.ships[i3].isDead()){
				this.ships[i3].alive = false;
				this.ships[i3].shipScore = this.score;
				this.alives--;
				var print  = false;
				if(i3 == 0) {
				  print = true;
				  //44//console.log("networkscore " +this.gen[i3].getSave().weights[0]);
				}
				Neuvol.networkScore(this.gen[i3], this.score, print);
				if(this.isItEnd()){
				  //this.scoreHistory.push(this.score);
				  
				  //aug11//console.log("game.js: this.ships[i3].x is " + this.ships[i3].x
				    //aug11//+ " game.js: this.ships[i3].y is " + this.ships[i3].y
				    //aug11//+ " this.score is " + this.score); //aug2// 
				  //aug11//alert("game.js: this.ships[i3].x is " + this.ships[i3].x
				    //aug11//+ " game.js: this.ships[i3].y is " + this.ships[i3].y
				    //aug11//+ " this.score is " + this.score); //aug2//
				  
					this.start();
				}
			}

		}

	}


	for(var i4 in this.ships2){
		if(this.ships2[i4].alive){
			var inputs2 = this.ships2[i4].getSensorDistances2();
			var res2 = this.gen2[i4].compute(inputs2, false);

			this.ships2[i4].movex = 0;
			this.ships2[i4].movey = 0;

			if(res2[0] > 0.65){
				this.ships2[i4].movex++;
			}
			if(res2[0] < 0.45){
				this.ships2[i4].movex--;
			}

			if(res2[1] > 0.65){
				this.ships2[i4].movey++;
			}
			if(res2[1] < 0.45){
				this.ships2[i4].movey--;
			}

			this.ships2[i4].update();
			if(this.ships2[i4].isDead()){
				this.ships2[i4].alive = false;
				this.alives2--;
				this.ships2[i4].shipScore = this.score2;
				var print  = false;
				if(i4 == 0) {
				  //print = true;
				  //console.log(i4);
				}
				Neuvol2.networkScore(this.gen2[i4], this.score2, print);
				if(this.isItEnd()){
				  //this.score2History.push(this.score2);
					this.start();
				}
			}	
		}
	}

	for(var i5 in this.humanShips){
		if(this.humanShips[i5].alive){
			this.humanShips[i5].movex = 0;
			this.humanShips[i5].movey = 0;

			//this.checkKeycode(event);
			
			//var keycode = evt.keyCode;
	    		

			if(rightPressed) {
	    		this.humanShips[i5].movex++;
			}
			else if(leftPressed) {
	    		this.humanShips[i5].movex--;
			}

			if(upPressed) {
	    		this.humanShips[i5].movey--;
			}
			else if(downPressed) {
	    		this.humanShips[i5].movey++;
			}

			this.humanShips[i5].update();
			if(this.humanShips[i5].isDead()){
				this.humanShips[i5].alive = false;
			}

		}
	}

	for(var i6 in this.asteroids){
		this.asteroids[i6].update();
	}

	if(this.interval == 0 && this.asteroids.length < this.maxAsteroids){
		this.spawnAsteroids();
	}

	this.interval++;
	if(this.interval == this.spawnInterval){
		this.interval = 0;
	}

	if(this.alives > 0) {
		this.score++;
	}
	if(this.alives2 > 0) {
		this.score2++;
	}
	var self = this;

  if (FPS == -1) {
      setTimeout(
        function(){
          self.update();
        }, 
        5000
      );
  }
	else if (FPS == 0) {
		setZeroTimeout(
		  function() {
			  self.update();
		  }
		);
	}
	else {
		setTimeout(
		  function(){
			  self.update();
		  }, 
		  1000/FPS
		);
	}

  //aug11//
  /*
  if(this.score > 400) {
    for(var iShip in this.ships){
      if(this.ships[iShip].alive) {
        console.log("Near end of Game.prototype.update: this.ships[iShip].x is " + this.ships[iShip].x);
  		  console.log("Near end of Game.prototype.update: this.ships[iShip].y is " + this.ships[iShip].y);
  		  console.log("this.score ("+this.score+") > 400 and Near end of Game.prototype.update: iShip is " + iShip);
  		  alert("this.score > 400 and Near end of Game.prototype.update: iShip is " + iShip);
      }
  	}  
  }
  */
  
	this.display();
	//aug11//console.log("End Game.prototype.update: displayed");
}; //end method Game.prototype.update

Game.prototype.spawnAsteroids = function(){
	var spawns = [
        {x:30, y:30},
	    //{x:0 + 30, y:0 + 30},
	    //{x:0 + 30, y:this.height - 50},
	    {x:this.width - 50, y:this.height - 50}
	    //{x:this.width - 50, y:0 + 30}
	];
	for(var i in spawns){
		var a = new Asteroid({
			x:spawns[i].x,
			y:spawns[i].y
		});
		this.asteroids.push(a);
	}
};

Game.prototype.isItEnd = function(){
	var bot1Dead = true;
	for(var i in this.ships){
		if(this.ships[i].alive){
			bot1Dead = false;
			//return false;
		}
	}
	
	var bot2Dead = true;
	for(var i2 in this.ships2){
		if(this.ships2[i2].alive){
			bot2Dead = false;
			//return false;
		}
	}

	if ( (!bot1Dead) && bot2Dead) {
		//bot1NetWins++;
		return false;
	}

	if (bot1Dead && (!bot2Dead) ) {
		//bot1NetWins--;
		return false;
	}

	if ( (!bot1Dead) && (!bot2Dead) ) {
		//both not dead
		return false;
	}

	bot1NetWins += this.score - this.score2;

	return true; //they are both dead
};

Game.prototype.display = function(){
	this.ctx.clearRect(0, 0, this.width, this.height);
	if(shouldDrawImages) {
        this.ctx.drawImage(images.background, 0, 0, this.width, this.height);
    } else {
        this.ctx.fillStyle = "black";
        //https://www.rgraph.net/blog/the-difference-between-rect-strokerect-and-fillrect.html
	    this.ctx.fillRect(0, 0, this.width, this.height);
    }

	for(var i in this.ships){
		if(this.ships[i].alive){
			// this.ctx.strokeStyle = "#4C4B49";
			// for(var j = 0; j < nbSensors; j++){
			// 	var x1 = this.ships[i].x + this.ships[i].width/2;
			// 	var y1 = this.ships[i].y + this.ships[i].height/2;
			// 	var x2 = x1 + Math.cos(Math.PI * 2 / nbSensors * j + this.ships[i].direction) * maxSensorSize;
			// 	var y2 = y1 + Math.sin(Math.PI * 2 / nbSensors * j + this.ships[i].direction) * maxSensorSize;
			// 	this.ctx.beginPath();
			// 	this.ctx.moveTo(x1, y1);
			// 	this.ctx.lineTo(x2, y2);
			// 	this.ctx.stroke();
			// }

			this.ctx.strokeStyle = bot1Color;
			this.ctx.strokeRect(this.ships[i].x, this.ships[i].y, this.ships[i].width, this.ships[i].height);
            if(shouldDrawImages) {
                this.ctx.drawImage(images.ship, this.ships[i].x, this.ships[i].y, this.ships[i].width, this.ships[i].height);
            }

            if(shouldDrawSensors) {
                this.ctx.strokeStyle = bot1SensorColor;

                for(var iSensesX in this.ships[i].collisionX) {
                    var x1 = this.ships[i].x + this.ships[i].width/2;
                    var y1 = this.ships[i].y + this.ships[i].height/2;

                    var x2 = this.ships[i].collisionX[iSensesX];
                    var y2 = this.ships[i].collisionY[iSensesX]; //same index is ok

                    this.ctx.beginPath();
                    this.ctx.moveTo(x1, y1);
                    this.ctx.lineTo(x2, y2);
                    this.ctx.stroke();
                }
                
                if(showIntersections) {
                  this.ctx.strokeStyle = "green";
                  for(var iIntersection in intersections) {
                    
                    var intersectionX = intersections[iIntersection][0];
                    var intersectionY = intersections[iIntersection][1];
                    this.ctx.strokeRect(intersectionX, intersectionY, 2, 2);
                  }  
                }
                
                if(showIntersections) {
                  this.ctx.strokeStyle = "grey";
                  for(var iIntersection in intersectionsVert) {
                    
                    var intersectionX = intersectionsVert[iIntersection][0];
                    var intersectionY = intersectionsVert[iIntersection][1];
                    this.ctx.strokeRect(intersectionX-5, intersectionY-5, 10, 10);
                  }  
                }
            }
		}
	}

	for(var i2 in this.ships2){
		if(this.ships2[i2].alive){
			this.ctx.strokeStyle = bot2Color;
			this.ctx.strokeRect(this.ships2[i2].x, this.ships2[i2].y, this.ships2[i2].width, this.ships2[i2].height);

			if(shouldDrawImages) {
                this.ctx.drawImage(images.ship, this.ships2[i2].x, this.ships2[i2].y, this.ships2[i2].width, this.ships2[i2].height);
            }

            if(shouldDrawSensors) {
                this.ctx.strokeStyle = bot2SensorColor;

                for(var iSensesXb in this.ships2[i2].collisionX) {
                    var x1b = this.ships2[i2].x + this.ships2[i2].width/2;
                    var y1b = this.ships2[i2].y + this.ships2[i2].height/2;

                    var x2b = this.ships2[i2].collisionX[iSensesXb];
                    var y2b = this.ships2[i2].collisionY[iSensesXb]; //same index is ok

                    this.ctx.beginPath();
                    this.ctx.moveTo(x1b, y1b);
                    this.ctx.lineTo(x2b, y2b);
                    this.ctx.stroke();
                }
                
                if(showIntersections) {
                  this.ctx.strokeStyle = "green";
                  for(var iIntersection in intersections) {
                    
                    var intersectionX = intersections[iIntersection][0];
                    var intersectionY = intersections[iIntersection][1];
                    this.ctx.strokeRect(intersectionX, intersectionY, 2, 2);
                  }  
                }
                
                if(showIntersections) {
                  this.ctx.strokeStyle = "grey";
                  for(var iIntersection in intersectionsVert) {
                    
                    var intersectionX = intersectionsVert[iIntersection][0];
                    var intersectionY = intersectionsVert[iIntersection][1];
                    this.ctx.strokeRect(intersectionX-5, intersectionY-5, 10, 10);
                  }  
                }
            }
		}
	}

	for(var i3 in this.humanShips){
		if(this.humanShips[i3].alive){

			this.ctx.strokeStyle = "cyan";
			this.ctx.strokeRect(this.humanShips[i3].x, this.humanShips[i3].y, this.humanShips[i3].width, this.humanShips[i3].height);

            if(shouldDrawImages) {
                this.ctx.drawImage(images.ship, this.humanShips[i3].x, this.humanShips[i3].y, this.humanShips[i3].width, this.humanShips[i3].height);
            }
        }
	}

	this.ctx.strokeStyle = asteroidColor;//"yellow";
	for(var ia in this.asteroids){
		this.ctx.strokeRect(this.asteroids[ia].x, this.asteroids[ia].y, this.asteroids[ia].width, this.asteroids[ia].height);
        if(shouldDrawImages) {
            this.ctx.drawImage(images.asteroid, this.asteroids[ia].x, this.asteroids[ia].y, this.asteroids[ia].width, this.asteroids[ia].height);
        }
    }

  if(shouldDrawScoreHistory) {
      /*
      this.ctx.strokeStyle = bot1Color;
      //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/min
      for(var i = Math.min(numScoresToShow, this.scoreHistory.length); i>=0; i--) {
        //console.log(i);
        this.ctx.strokeRect(this.width-20-20*i, this.height, 5, -this.scoreHistory[this.scoreHistory.length-1-i]/100);  
      }
      this.ctx.strokeStyle = bot2Color;
      //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/min
      for(var i = Math.min(numScoresToShow, this.score2History.length); i>=0; i--) {
        //console.log(i);
        this.ctx.strokeRect(this.width-10-20*i, this.height, 5, -this.score2History[this.scoreHistory.length-1-i]/100);  
      }
			*/
			
			var barWidth = (this.width-40)/this.fullScoreHistory.length;
			this.ctx.strokeStyle = bot1Color;
      //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/min
      for(var i = this.fullScoreHistory.length-1; i>=0; i--) {
        
        //console.log(i);
        this.ctx.strokeRect(20+barWidth*i, this.height-this.fullScoreHistory[i]/100, Math.max(1,barWidth/2), 5);  
      }
      this.ctx.strokeStyle = bot2Color;
      //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/min
      for(var i = this.fullScore2History.length-1; i>=0; i--) {
        //console.log(i);
        this.ctx.strokeRect(20+(barWidth/2)+barWidth*i, this.height-this.fullScore2History[i]/100, Math.max(1,barWidth/2), 5);  
      }
  }
  
  if(shouldShowText) {
    this.ctx.fillStyle = "white";
  	this.ctx.font="20px Arial";
  	this.ctx.fillText("Generation : " + this.generation, 10, 25);
  	
  	this.ctx.fillText("Score : "+this.score, 10, 50);
  	this.ctx.fillText("Alive : "+this.alives
  	  + " / " + Neuvol.options.population, 10, 75);
  	
  	this.ctx.fillText("Score2 : "+this.score2, 10, 125);
  	this.ctx.fillText("Alive2 : "+this.alives2
  	  + " / " + Neuvol2.options.population, 10, 150);
  
  	this.ctx.fillText("bot1NetWins " 
  	  + " ("+bot1Color+") bot winnings : "
  	  + bot1NetWins, 10, 175);
  }
};

window.onload = function(){
	var sprites = {
		ship:"img/ship.png",
		asteroid:"img/asteroid.png",
		background:"img/fond.png"
	};

	var start = function(){
	  //44//console.log("var start = function()");
		Neuvol = new Neuroevolution ({
			population:50,//0,
			network:[nbSensors, [9],  2], //[17],[16],[15],[14],[13],[12],[11],[10],[9],[8],[7],[6],[5],[4],[3],
			randomBehaviour:0.1,
			mutationRate:0.5,
			mutationRange:2,
			name:"neuvol1"
		});
		Neuvol2 = new Neuroevolution_ReLU ({
			population:50,//0,
			network:[nbSensors2, [9], 2],
			randomBehaviour:0.1,
			mutationRate:0.5,
			mutationRange:2,
			name:"neuvol2"
		});
		this.game = new Game();
		//44//console.log("onload var start");
		game.start();
		if (FPS == 0) {
			setZeroTimeout(function() {
				game.update();
			});
		}
		else {
			setTimeout(function(){
				game.update();
			}, 1000/FPS);
		}
	};

	loadImages(sprites, function(imgs){
		images = imgs;
		//44//console.log("loadImages")
		start();
	})
};

Game.prototype.saveGame = function(){
    var saveString = "";
    for(var iteration in this.gen){
        saveString += this.ships[iteration].shipScore + detailDivider;
        saveString += this.ships[iteration].x + detailDivider;
        saveString += this.ships[iteration].y + detailDivider;
        saveString += this.ships[iteration].movex + detailDivider;
        saveString += this.ships[iteration].movey + detailDivider;
        saveString += this.ships[iteration].alive + detailDivider;

        for(var iterationSub in this.gen[iteration].getSave().weights){
            saveString += this.gen[iteration].getSave().weights[iterationSub];
            if(iterationSub != this.gen[iteration].getSave().weights.length-1) { //if not the last element
                saveString += weightsDivider;
            }
        }
        if(iteration != this.gen.length-1) {
            saveString += shipDivider; //to divide the csv
        }
    }

    saveString += teamDivider;

    //might be slightly faster if gen1 and gen2 were combined into one loop
    for(var iterationGen2 in this.gen2){
        saveString += this.ships2[iterationGen2].shipScore + detailDivider;
        saveString += this.ships2[iterationGen2].x + detailDivider;
        saveString += this.ships2[iterationGen2].y + detailDivider;
        saveString += this.ships2[iterationGen2].movex + detailDivider;
        saveString += this.ships2[iterationGen2].movey + detailDivider;
        saveString += this.ships2[iterationGen2].alive + detailDivider;

        for(var iterationGen2sub in this.gen2[iterationGen2].getSave().weights){
            saveString += this.gen2[iterationGen2].getSave().weights[iterationGen2sub];
            if(iterationGen2sub != this.gen2[iterationGen2].getSave().weights.length-1) { //if not the last element
                saveString += weightsDivider;
            }
        }
        if(iterationGen2 != this.gen2.length-1) {
            saveString += shipDivider; //to divide the string by ship
        }
    }

    saveString += generalDivider;//";"

    saveString += this.score + generalDivider;
    saveString += this.score2 + generalDivider;
    saveString += this.alives + generalDivider;
    saveString += this.alives2 + generalDivider;
    saveString += this.generation + generalDivider;
    saveString += bot1NetWins + generalDivider;

    for(var iteration3 in this.asteroids){
        saveString += this.asteroids[iteration3].x + asteroidDetailsDivider;
        saveString += this.asteroids[iteration3].y + asteroidDetailsDivider;
        saveString += this.asteroids[iteration3].vx + asteroidDetailsDivider;
        saveString += this.asteroids[iteration3].vy;
        if(iteration3 != this.asteroids.length-1) { //if not the last element
            saveString += asteroidDivider;
        }
    }

    saveString += generalDivider;
    saveString += this.humanShips[0].x;
    saveString += generalDivider;
    saveString += this.humanShips[0].y;

    document.getElementById("mytext").value = saveString;
};

Game.prototype.loadGame = function(){
    this.start();
    
    this.fullScoreHistory = [];
    this.fullScore2History = [];
    this.scoreHistory = [];
    this.score2History = [];
    /*
    Neuvol = new Neuroevolution({
        population:50,
        network:[nbSensors, [9],  2], //[17],[16],[15],[14],[13],[12],[11],[10],[9],[8],[7],[6],[5],[4],[3],
        randomBehaviour:0.1,
        mutationRate:0.5,
        mutationRange:2
    });
    Neuvol2 = new Neuroevolution({
        population:50,
        network:[nbSensors2, [9], 2],
        randomBehaviour:0.1,
        mutationRate:0.5,
        mutationRange:2
    });
    */
    /////////////

    /*
    game = new Game();
    game.start();
    this = game;
    */

    var str = document.getElementById("setmytext").value;
    var sectionArr = str.split(generalDivider);
    var shipsBrainsString = sectionArr[0];

    this.score = parseInt(sectionArr[1]);
    this.score2 = parseInt(sectionArr[2]);
    this.alives = parseInt(sectionArr[3]);
    this.alives2 = parseInt(sectionArr[4]);
    this.generation = parseInt(sectionArr[5]); //note: didn't keep track of generations during previous training
    bot1NetWins = parseInt(sectionArr[6]); //note: didn't keep track of wins during previous training
    var asteroidsString = sectionArr[7]; //parse this string below

    //start shipsBrainString
    var teams = shipsBrainsString.split(teamDivider);
    var genString = teams[0];
    var gen2String = teams[1];
    var shipsStringArr = genString.split(shipDivider);
    var ships2StringArr = gen2String.split(shipDivider);

    for(var iShip in shipsStringArr) {
        var detailsArr = shipsStringArr[iShip].split(detailDivider);
        this.ships[iShip].shipScore = parseInt(detailsArr[0]);
        this.ships[iShip].x = parseFloat(detailsArr[1]);
        this.ships[iShip].y = parseFloat(detailsArr[2]);
        this.ships[iShip].movex = parseInt(detailsArr[3]);
        this.ships[iShip].movey = parseInt(detailsArr[4]);

        this.ships[iShip].alive = (detailsArr[5] == "true");

        var shipsWeightsString = detailsArr[6];
        var shipsWeightsArr = shipsWeightsString.split(weightsDivider);

        var save = this.gen[iShip].getSave();
        for(var iNeuron in save.weights) {
          if(iShip == 0 && iNeuron == 0) {
            //console.log(iNeuron);
            //console.log(Neuvol);
            //33//console.log(save.weights[iNeuron]);
          }
          var weight = parseFloat(shipsWeightsArr[iNeuron]);
          save.weights[iNeuron] = weight;
          if(iShip == 0 && iNeuron == 0) {
            //console.log(iNeuron);
            //console.log(Neuvol);
            //33//console.log(save.weights[iNeuron]);
          }
          //Neuvol.genomes[iShip].network.weights[iNeuron] = weight;
        }
        this.gen[iShip].setSave(save);
        //console.log(this.gen[iShip].getSave());
        //console.log(save);
        if(iShip == 0) {
          console.log("loading. ship 0 neuron 0 is " + this.gen[iShip].getSave().weights[0]);  
        }
    }
    for(var iShip2 in ships2StringArr) {
        var details2Arr = ships2StringArr[iShip2].split(detailDivider);
        this.ships2[iShip2].shipScore = parseInt(details2Arr[0]);
        this.ships2[iShip2].x = parseFloat(details2Arr[1]);
        this.ships2[iShip2].y = parseFloat(details2Arr[2]);
        this.ships2[iShip2].movex = parseInt(details2Arr[3]);
        this.ships2[iShip2].movey = parseInt(details2Arr[4]);

        this.ships2[iShip2].alive = (details2Arr[5] == "true");

        var ships2WeightsString = details2Arr[6];
        var ships2WeightsArr = ships2WeightsString.split(weightsDivider);

        var save2 = this.gen2[iShip2].getSave();
        for(var iNeuron2 in save2.weights) {
            save2.weights[iNeuron2] = parseFloat(ships2WeightsArr[iNeuron2]);
        }
        this.gen2[iShip2].setSave(save2); /////wtf///
    }
    //end shipsBrainString


    this.asteroids = []; //could there be a memory leak from previous asteroids?
    var asteroidsArr = asteroidsString.split(asteroidDivider);
    for(var iAsteroid in asteroidsArr) {
        var asteroidDetailsString = asteroidsArr[iAsteroid];
        var asteroidDetailsArr = asteroidDetailsString.split(asteroidDetailsDivider);

        var a = new Asteroid({
            x:  parseFloat(asteroidDetailsArr[0]),
            y:  parseFloat(asteroidDetailsArr[1]),
            vx: parseFloat(asteroidDetailsArr[2]),
            vy: parseFloat(asteroidDetailsArr[3])
        });

        this.asteroids.push(a);

        /*
        if(iAsteroid < this.asteroids.length) {
            this.asteroids[iAsteroid].x = parseFloat(asteroidDetailsArr[0]);
            this.asteroids[iAsteroid].y = parseFloat(asteroidDetailsArr[1]);
            this.asteroids[iAsteroid].vx = parseFloat(asteroidDetailsArr[2]);
            this.asteroids[iAsteroid].vy = parseFloat(asteroidDetailsArr[3]);
        } else {
            var a = new Asteroid({
                x:  parseFloat(asteroidDetailsArr[0]),
                y:  parseFloat(asteroidDetailsArr[1]),
                vx: parseFloat(asteroidDetailsArr[2]),
                vy: parseFloat(asteroidDetailsArr[3])
            });

            this.asteroids.push(a);
        }
        */

        /*
        var a = new Asteroid({
            x:  asteroidDetailsArr[0],
            y:  asteroidDetailsArr[1],
            vx: asteroidDetailsArr[2],
            vy: asteroidDetailsArr[3]
        });
        */

        //this.asteroids.push(a);
        /*
        this.asteroids[iAsteroid].x = asteroidDetailsArr[0];
        this.asteroids[iAsteroid].y = asteroidDetailsArr[1];
        this.asteroids[iAsteroid].vx = asteroidDetailsArr[2];
        this.asteroids[iAsteroid].vy = asteroidDetailsArr[3];
        */

    }
    
    for(var iShip in this.ships) {
      var print = (iShip == 0);
      if(print) {
        console.log("loading. loop at end. ship 0 neuron 0 is " 
        + this.gen[iShip].getSave().weights[0]);    
      }
      
      //console.log(print);
      if(this.ships[iShip].isDead()) {
        Neuvol.networkScore(this.gen[iShip], this.ships[iShip].shipScore, print);  
      }
    }
    
    for(var iShip2 in this.ships2) {
      if(this.ships2[iShip2].isDead()) {
        Neuvol2.networkScore(this.gen2[iShip2], this.ships2[iShip2].shipScore, false);
      }
    }
};
