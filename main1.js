const gameConstants = { planetDiameter: 350, bulletSpeed: 2, bulletDiameter: 10 }

let counter = 0
let xText;
const flights = [
  {
    playerNumber: 0,
    playerName: "player0",
    x: 100,
    y: 100,
    r: 30,
    xMouse: 0,
    yMouse: 0,
    spawnX: 100,
    spawnY: 100,
    color: 'green',
    buls: [],
    // Contains number of times "me" has hit the different flights
    // The playerNumber is the index on the tables.
    // If hits[5] = 3, then the flight with playerNumber 5 has been
    // hit 3 times by "me"
    hits: [0, 0],
  },
  {
    playerNumber: 1,
    playerName: "player1",
    x: 200,
    y: 200,
    r: 30,
    xMouse: 0,
    yMouse: 0,
    spawnX: 200,
    spawnY: 200,
    color: 'blue',
    buls: [],
    hits: [0, 0],
  },
];

let me;
let guests;
let gameState = "PLAYING"; // TITLE, PLAYING

function preload() {

  //partyConnect("wss://p5js-spaceman-server-29f6636dfb6c.herokuapp.com", "jkv-MultiPlayerPoc");
  partyConnect("wss://demoserver.p5party.org", "jkv-MultiPlayerPoc");
  me = partyLoadMyShared({ playerName: "observer" });
  guests = partyLoadGuestShareds();

  shared = partyLoadShared("shared", {
    shared: { xSun: 0 },
  });
}

function setup() {
  createCanvas(400, 400);

  // Move this when entry screen is added
  if (me.playerName !== "player0" && me.playerName !== "player1") {
    joinGame();
    return;
  }
}

function draw() {

  background(0);
  fill('white')
  ellipse(200, 200, gameConstants.planetDiameter)

  if (partyIsHost()) {
    console.log("I am host")
    fill('yellow')
    text('I am host', 10, 10);
    //      stepHost();
  }

  text(me.playerName, 10, 30);
  /*
    if (counter < 1) {
      console.log({ guests })
      console.log({ me })
      //    console.log({ sharedBullet0Player0 })
      //    console.log({ sharedBullet1Player0 })
      counter++
    }
      */

  if (gameState === "PLAYING") {
    stepLocal();

    if (me.playerName != "observer") {
      moveMe();
      checkCollisions();

    }
    drawGame();
  }
}

function stepHost() {
}

function moveMe() {
  let offSetX = 0;
  let offSetY = 0;
  if (keyIsDown(70)) { offSetX = -3 } // F
  if (keyIsDown(72)) { offSetX = 3 } // H
  if (keyIsDown(84)) { offSetY = -3 } // T
  if (keyIsDown(71)) { offSetY = 3 } // G

  xTemp = me.x + offSetX;
  yTemp = me.y + offSetY;

  if (onScreen(xTemp, yTemp)) {
    me.x = xTemp;
    me.y = yTemp;
  }

  me.xMouse = mouseX;
  me.yMouse = mouseY;

  moveBullets();
}
function moveBullets() {

  for (let i = me.buls.length - 1; i >= 0; i--) {

    let bullet = me.buls[i];
    let bulletVector = createVector(
      int(bullet.xMouseStart) - bullet.xStart,
      int(bullet.yMouseStart) - bullet.yStart,
    ).normalize();
    bullet.x += bulletVector.x * 2;
    bullet.y += bulletVector.y * 2;

    if (!onScreen(bullet.x, bullet.y)) {
      me.buls.splice(i, 1);
    }
  }
}
function checkCollisions() {

  flights.forEach((flight) => {
    if (flight.playerName != me.playerName) {
      checkCollisionsWithFlight(flight);
    }
  });

}
function checkCollisionsWithFlight(flight) {

  for (let i = me.buls.length - 1; i >= 0; i--) {

    let bullet = me.buls[i];

    let d = dist(flight.x, flight.y, bullet.x, bullet.y);

    if (d < (flight.r + gameConstants.bulletDiameter) / 2) {
      me.hits[flight.playerNumber]++;
      me.buls.splice(i, 1);
    }
  }
}
function onScreen(x, y) {
  return dist(200, 200, x, y) < gameConstants.planetDiameter / 2;
}
function stepLocal() {

  // find the current players, if they exist
  const p0 = guests.find((p) => p.playerName === "player0");
  const p1 = guests.find((p) => p.playerName === "player1");

  // hide flights if they are not in the game
  if (!p0) flights[0].x = -32;
  if (!p1) flights[1].x = -32;

  // sync flight positions from shared to local
  const syncFlight = (localFlight, sharedFlight) => {
    localFlight.x = sharedFlight.x;
    localFlight.y = sharedFlight.y;
    localFlight.r = sharedFlight.r;
    localFlight.xMouse = sharedFlight.xMouse;
    localFlight.yMouse = sharedFlight.yMouse;
    localFlight.rotation = sharedFlight.rotation;
    localFlight.buls = sharedFlight.buls;
    localFlight.hits = sharedFlight.hits
  };
  if (p0) syncFlight(flights[0], p0);
  if (p1) syncFlight(flights[1], p1);
}

function mousePressed() {

  if (me.playerName === "observer")
    return

  let bullet = { x: me.x, y: me.y, xStart: me.x, yStart: me.y, xMouseStart: mouseX, yMouseStart: mouseY }

  //if (me.buls.length < 3) {
  me.buls.push(bullet)
  //}
}

function drawGame() {
  xText = 0
  flights.forEach((flight) => {
    drawFlight(flight);
    drawBullets(flight);
    drawScore(flight);
  });

}

function drawFlight(flight) {
  fill(flight.color)

  push();
  imageMode(CENTER);
  translate(flight.x, flight.y);
  let head = createVector(
    flight.xMouse - flight.x,
    flight.yMouse - flight.y,
  ).normalize().heading();
  rotate(head + 1.555);
  rect(-10, -10, 30, 30)
  rect(0, -15, 10, 15)
  //image(flightImages[flight.playerNumber], 0, 0, 24, 20);
  pop();
}

function drawBullets(flight) {
  fill(flight.color)

  if (flight.buls) {
    flight.buls.forEach((bullet) => {
      drawBullet(bullet);
    });
  }
}

function drawBullet(bullet) {
  fill('yellow')

  push();
  imageMode(CENTER);  
  translate(bullet.x, bullet.y);
  let head = createVector(
    bullet.xMouseStart - bullet.xStart,
    bullet.yMouseStart - bullet.yStart,
  ).normalize().heading();
  rotate(head + 1.555);
  rect(-3, -3, 10, 10)
  //image(flightImages[flight.playerNumber], 0, 0, 24, 20);
  pop();

}

function drawScore(flight) {
  fill(flight.color)

  xText += 30
  if (flight.playerName === "player0") {
    if (flight.hits) {
      text("Player0 (" + flight.hits[1] + ")", 320, xText)
    } else {
      text("Player0", 320, xText)
    }
  } else if (flight.playerName === "player1") {
    if (flight.hits) {
      text("Player1 (" + flight.hits[0] + ")", 320, xText)
    } else {
      text("Player1", 320, xText)
    }
  }
}

function joinGame() {

  // don't let current players double join
  if (me.playerName === "player0" || me.playerName === "player1") return;

  if (!guests.find((p) => p.playerName === "player0")) {
    spawn(flights[0]);
    me.playerName = "player0";
    return;
  }
  if (!guests.find((p) => p.playerName === "player1")) {
    spawn(flights[1]);
    me.playerName = "player1";
  }
}

function watchGame() {
  me.playerName = "observer";
}

function spawn(flight) {
  me.playerNumber = flight.playerNumber;
  me.playerName = flight.playerName;
  me.x = flight.spawnX;
  me.y = flight.spawnY;
  me.r = flight.r
  me.rotation = flight.rotation;
  me.color = flight.color;
  me.buls = [];
  me.hits = [0, 0];
}
