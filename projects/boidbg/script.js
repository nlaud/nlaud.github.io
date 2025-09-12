//Helper Functions
const randomRgbColor = () => {
  let r = Math.floor(Math.random() * 256); // Random between 0-255
  let g = Math.floor(Math.random() * 256); // Random between 0-255
  let b = Math.floor(Math.random() * 256); // Random between 0-255
  return "rgb(" + r + "," + g + "," + b + ")";
};

//From: https://stackoverflow.com/questions/13586999/color-difference-similarity-between-two-values-with-js
function deltaE(rgbA, rgbB) {
  let labA = rgb2lab(rgbA);
  let labB = rgb2lab(rgbB);
  let deltaL = labA[0] - labB[0];
  let deltaA = labA[1] - labB[1];
  let deltaB = labA[2] - labB[2];
  let c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
  let c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
  let deltaC = c1 - c2;
  let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
  let sc = 1.0 + 0.045 * c1;
  let sh = 1.0 + 0.015 * c1;
  let deltaLKlsl = deltaL / (1.0);
  let deltaCkcsc = deltaC / (sc);
  let deltaHkhsh = deltaH / (sh);
  let i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
  return i < 0 ? 0 : Math.sqrt(i);
}

function rgb2lab(rgb){
  let r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, x, y, z;
  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;
  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top,
  };
}

class Vector2D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  getMagnitude() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }
  getUnitVector() {
    return new Vector2D(
      this.x / this.magnitude || 0,
      this.y / this.magnitude || 0
    );
  }
}
function distance(boidObject1, boidObject2) {
  return Math.sqrt(
    Math.pow(boidObject1.pos.x - boidObject2.pos.x, 2) +
      Math.pow(boidObject1.pos.y - boidObject2.pos.y, 2)
  );
  //For Pacman Physics, but unimplemented
  if (
    boidObject1.wallWeight == 0 &&
    Math.sqrt(
      Math.pow(boidObject1.pos.x - boidObject2.pos.x, 2) +
        Math.pow(boidObject1.pos.y - boidObject2.pos.y, 2)
    ) > boidObject1.visibleRange
  ) {
    var deltaX = boidObject1.pos.x - boidObject2.pos.x;
    var deltaY = boidObject1.pos.y - boidObject2.pos.y;

    if (deltaX > canvas.width / dpr / 2) {
      if (deltaX > 0) {
        deltaX -= canvas.width;
      } else {
        deltaX += canvas.width;
      }
    }

    if (deltaY > canvas.height / dpr / 2) {
      if (deltaY > 0) {
        deltaY -= canvas.height;
      } else {
        deltaY += canvas.height;
      }
    }
    return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
  } else {
    return Math.sqrt(
      Math.pow(boidObject1.pos.x - boidObject2.pos.x, 2) +
        Math.pow(boidObject1.pos.y - boidObject2.pos.y, 2)
    );
  }
}
//Boid Behavior
class Boid {
  constructor(canvas, numObjects) {
    this.canvas = canvas;

    this.objects = [];
    for (var i = 0; i < numObjects; i++) {
      var object = new BoidObject(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 2 * Math.PI
      );
      this.objects.push(object);
    }
  }

  addObjects(numObjects) {
    for (var i = 0; i < numObjects; i++) {
      var object = new BoidObject(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 2 * Math.PI
      );
      this.objects.push(object);
    }
    return this.objects.length;
  }

  setWeights(
    separationWeight,
    alignmentWeight,
    cohesionWeight,
    wallWeight,
    protectedRange,
    visibleRange,
    colorism,
    colorismFactor
  ) {
    for (var object of this.objects) {
      object.separationWeight = separationWeight;
      object.alignmentWeight = alignmentWeight;
      object.cohesionWeight = cohesionWeight;
      object.wallWeight = wallWeight;
      object.protectedRange = protectedRange;
      object.visibleRange = visibleRange;
      object.colorism = colorism;
      object.colorismFactor = colorismFactor;
    }
  }

  setColor(color) {
    for (var object of this.objects) {
      object.color = color;
    }
  }

  update() {
    for (var object of this.objects) {
      object.update(this);
    }
  }

  render() {
    for (var object of this.objects) {
      object.render(this.canvas);
    }

    if (DEBUG && this.objects[0].wallWeight > 0) {
      var vertices = [
        { x: this.objects[0].wallMargin, y: this.objects[0].wallMargin },
        {
          x: canvas.width / dpr - this.objects[0].wallMargin,
          y: this.objects[0].wallMargin,
        },
        {
          x: canvas.width / dpr - this.objects[0].wallMargin,
          y: canvas.height / dpr - this.objects[0].wallMargin,
        },
        {
          x: this.objects[0].wallMargin,
          y: canvas.height / dpr - this.objects[0].wallMargin,
        },
        { x: this.objects[0].wallMargin, y: this.objects[0].wallMargin },
      ];
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
      }
      ctx.strokeStyle = "red";
      ctx.stroke();
    }
  }
}

class BoidObject {
  constructor(xPos, yPos, velocity) {
    this.speedFactor = 0.7;
    
    this.scale = 1.0
    this.size = new Vector2D(this.scale * 15, this.scale * 30);

    this.color = randomRgbColor();
    this.trailLength = 0;
    this.pastPos = [];

    this.opacity = 1;

    this.separationWeight = 2;
    this.alignmentWeight = 1.03;
    this.cohesionWeight = 0.02;
    this.cursorWeight = 0;

    this.colorism = true;
    this.colorismFactor = 3;

    this.wallWeight = 0; //75
    this.wallMargin = 250;

    this.protectedRange = 11 * this.scale;
    this.visibleRange = 35;

    this.maxSpeed = 8;
    this.minSpeed = 2;

    this.acceleration = 0.4; //Closer to 0 is more smooth, closer to 1 is more responsive

    this.pos = new Vector2D(
      (Math.random() * canvas.width) / dpr,
      (Math.random() * canvas.height) / dpr
    );
    this.velocity = new Vector2D(
      (Math.random() * 2 - 1) * this.maxSpeed,
      (Math.random() * 2 - 1) * this.maxSpeed
    );
  }
  colorSimilarity(otherBoidObj){
    if(!this.colorism){
      return 1
    }
    const toRGBArray = rgbStr => rgbStr.match(/\d+/g).map(Number);
    var rgb1 = toRGBArray(this.color)
    var rgb2 = toRGBArray(otherBoidObj.color)
    var colorDifference = deltaE(rgb1, rgb2)
    var similarity = (100 - colorDifference * 2) / 100
    var powSimilarity = Math.pow(Math.abs(similarity), 0.33) * Math.sign(similarity)
    return powSimilarity * this.colorismFactor
  }

  updateVelocity(boid) {
    var separationVelocity = new Vector2D(0, 0);
    //Separation
    for (var boidObject of boid.objects) {
      var distance = Math.sqrt(
        Math.pow(this.pos.x - boidObject.pos.x, 2) +
        Math.pow(this.pos.y - boidObject.pos.y, 2)
      );
      if (boidObject != this && distance < this.protectedRange) {
        //Not this boid and distance small enough
        separationVelocity.x += this.pos.x - boidObject.pos.x;
        separationVelocity.y += this.pos.y - boidObject.pos.y;
      }
    }

    //Alignment
    var boidVelocity = new Vector2D(0, 0);
    var visibleBoids = 0;

    for (var boidObject of boid.objects) {
      var distance = Math.sqrt(
        Math.pow(this.pos.x - boidObject.pos.x, 2) +
          Math.pow(this.pos.y - boidObject.pos.y, 2)
      );
      if (distance < this.visibleRange) {
        //Not this boid and distance small enough
        boidVelocity.x += this.colorism ? boidObject.velocity.x * this.colorSimilarity(boidObject) : boidObject.velocity.x;
        boidVelocity.y += this.colorism ? boidObject.velocity.y * this.colorSimilarity(boidObject) : boidObject.velocity.y;

        visibleBoids += 1;
      }
    }
    if (visibleBoids > 0) {
      boidVelocity.x = boidVelocity.x / visibleBoids;
      boidVelocity.y = boidVelocity.y / visibleBoids;
    }
    var alignmentVelocity = new Vector2D(boidVelocity.x, boidVelocity.y);

    //Cohesion
    var cohesionVelocity = new Vector2D(0, 0);
    var visibleBoids = 0;

    for (var boidObject of boid.objects) {
      var distance = Math.sqrt(
        Math.pow(this.pos.x - boidObject.pos.x, 2) +
          Math.pow(this.pos.y - boidObject.pos.y, 2)
      );
      if (distance < this.visibleRange) {
        //Not this boid and distance small enough
        cohesionVelocity.x += this.colorism ? (boidObject.pos.x - this.pos.x) * this.colorSimilarity(boidObject) : (boidObject.pos.x - this.pos.x);
        cohesionVelocity.y += this.colorism ? (boidObject.pos.y - this.pos.y) * this.colorSimilarity(boidObject) : (boidObject.pos.y - this.pos.y);

        visibleBoids += 1;
      }
    }

    if (visibleBoids > 0) {
      cohesionVelocity.x = cohesionVelocity.x / visibleBoids;
      cohesionVelocity.y = cohesionVelocity.y / visibleBoids;
    }

    var wallVelocity = new Vector2D(0, 0);

    if (this.pos.x > canvas.width / dpr - this.wallMargin) {
      wallVelocity.x = -1 / (canvas.width / dpr - this.pos.x);
      if (this.pos.x > canvas.width / dpr) {
        //wallVelocity.x = -1 / (Math.pow(10, canvas.width - this.pos.x))
        wallVelocity.x = 0;
        this.pos.x -= canvas.width / dpr;
        this.pastPos = [this.pos];
      }
    } else if (this.pos.x < this.wallMargin) {
      wallVelocity.x = 1 / this.pos.x;
      if (this.pos.x < 0) {
        //wallVelocity.x = 1 / (Math.pow(10, this.pos.x))
        wallVelocity.x = 0;
        this.pos.x += canvas.width / dpr;
        this.pastPos = [this.pos];
      }
    }
    if (this.pos.y > canvas.height / dpr - this.wallMargin) {
      wallVelocity.y = -1 / (canvas.height / dpr - this.pos.y);
      if (this.pos.y > canvas.height / dpr) {
        //wallVelocity.y = -1 / (Math.pow(10, canvas.height - this.pos.y))
        wallVelocity.y = 0;
        this.pos.y -= canvas.height / dpr;
        this.pastPos = [this.pos];
      }
    } else if (this.pos.y < this.wallMargin) {
      wallVelocity.y = 1 / this.pos.y;
      if (this.pos.y < 0) {
        //wallVelocity.y = 1 / (Math.pow(10, this.pos.y))
        wallVelocity.y = 0;
        this.pos.y += canvas.height / dpr;
        this.pastPos = [this.pos];
      }
    }

    var cursorVelocity = new Vector2D(0, 0);
    var cursorDist =
      Math.pow(mousePos.x - this.pos.x, 2) +
      Math.pow(mousePos.y - this.pos.y, 2);
    cursorVelocity.x = (mousePos.x - this.pos.x) / cursorDist;
    cursorVelocity.y = (mousePos.y - this.pos.y) / cursorDist;

    this.newVelocity = new Vector2D(0, 0);
    this.newVelocity.x =
      separationVelocity.x * this.separationWeight +
      alignmentVelocity.x * this.alignmentWeight +
      cohesionVelocity.x * this.cohesionWeight +
      wallVelocity.x * this.wallWeight +
      cursorVelocity.x * this.cursorWeight;
    this.newVelocity.y =
      separationVelocity.y * this.separationWeight +
      alignmentVelocity.y * this.alignmentWeight +
      cohesionVelocity.y * this.cohesionWeight +
      wallVelocity.y * this.wallWeight +
      cursorVelocity.y * this.cursorWeight;

    var speed = this.newVelocity.getMagnitude();

    if (speed > this.maxSpeed) {
      this.newVelocity.x = (this.newVelocity.x / speed) * this.maxSpeed;
      this.newVelocity.y = (this.newVelocity.y / speed) * this.maxSpeed;
    }
    if (speed < this.minSpeed) {
      this.newVelocity.x = (this.newVelocity.x / speed) * this.minSpeed;
      this.newVelocity.y = (this.newVelocity.y / speed) * this.minSpeed;
    }
    if (speed == 0) {
      this.newVelocity.x = (this.velocity.x / speed) * this.minSpeed;
      this.newVelocity.y = (this.velocity.y / speed) * this.minSpeed;
    }

    const lerp = (start, end, t) => start + t * (end - start);
    this.velocity.x = lerp(
      this.velocity.x,
      this.newVelocity.x,
      this.acceleration
    );
    this.velocity.y = lerp(
      this.velocity.y,
      this.newVelocity.y,
      this.acceleration
    );
    //Debug Rendering
    /*
    if(DEBUG){
      ctx.beginPath();
      ctx.strokeStyle = this.color;
      ctx.moveTo(this.pos.x, this.pos.y);
      ctx.stroke();
    }
    */
  }

  updatePosition() {
    this.pastPos.push({ x: this.pos.x, y: this.pos.y });
    this.pos.x += this.velocity.x * this.speedFactor;
    this.pos.y += this.velocity.y * this.speedFactor;
  }

  update(boid) {
    this.updateVelocity(boid);
    this.updatePosition();
  }

  render(canvas) {
    if (this.velocity.x != 0 && this.velocity.y != 0) {
      this.velocityAngle = Math.atan(this.velocity.x / this.velocity.y);
      if (this.velocity.y < 0) {
        this.velocityAngle += Math.PI;
      }
    } else {
      this.velocityAngle = Math.PI / 2;
    }

    const vertices = [
      {
        x: this.pos.x + (this.size.y / 2) * Math.sin(this.velocityAngle),
        y: this.pos.y + (this.size.y / 2) * Math.cos(this.velocityAngle),
      },
      {
        x:
          this.pos.x -
          (this.size.y / 2) * Math.sin(this.velocityAngle) +
          (this.size.x / 2) * Math.sin(this.velocityAngle + Math.PI / 2),
        y:
          this.pos.y -
          (this.size.y / 2) * Math.cos(this.velocityAngle) +
          (this.size.x / 2) * Math.cos(this.velocityAngle + Math.PI / 2),
      },
      {
        x:
          this.pos.x -
          (this.size.y / 2) * Math.sin(this.velocityAngle) -
          (this.size.x / 2) * Math.sin(this.velocityAngle + Math.PI / 2),
        y:
          this.pos.y -
          (this.size.y / 2) * Math.cos(this.velocityAngle) -
          (this.size.x / 2) * Math.cos(this.velocityAngle + Math.PI / 2),
      },
    ];
    // Begin the path
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.moveTo(parseInt(vertices[0].x), parseInt(vertices[0].y));

    // Draw lines to each vertex
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(parseInt(vertices[i].x), parseInt(vertices[i].y));
    }

    // Close the path and stroke it
    ctx.fillStyle = this.color;
    ctx.fill();

    //Trail
    if (this.trailLength > 0) {
      ctx.beginPath();
      var startIndex = Math.max(0, this.pastPos.length - this.trailLength);
      ctx.moveTo(this.pastPos[startIndex].x, this.pastPos[startIndex].y);
      for (let i = startIndex; i < this.pastPos.length; i++) {
        ctx.lineTo(this.pastPos[i].x, this.pastPos[i].y);
      }
      ctx.strokeStyle = this.color;
      ctx.stroke();
    }

    //Debug Rendering
    if (DEBUG) {
      ctx.beginPath();
      ctx.arc(
        this.pos.x,
        this.pos.y,
        this.protectedRange,
        0,
        2 * Math.PI,
        false
      );
      //ctx.arc(this.pos.x, this.pos.y, this.visibleRange, 0, 2 * Math.PI, false);
      ctx.strokeStyle = this.color;
      ctx.stroke();
    }
  }
}
//Rendering
function renderCanvas(canvas) {
  ctx.fillStyle = "rgb(79,66,181)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  boid.update();
  boid.render(ctx);
}
function resizeCanvas() {
  dpr = window.devicePixelRatio || 90;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);
}
window.addEventListener("resize", function (event) {
  resizeCanvas();
});
document.onclick = function () {
  for (var thingy of boid.objects) {
    if (thingy.cursorWeight == 0) {
      thingy.cursorWeight = 175;
    } else {
      thingy.cursorWeight = 0;
    }
  }
};

var DEBUG = false;

var canvas = document.getElementById("mainCanvas");
var ctx = canvas.getContext("2d");
var dpr;
resizeCanvas();
var mousePos = { x: canvas.width / dpr / 2, y: canvas.height / dpr / 2 };
canvas.addEventListener(
  "mousemove",
  function (evt) {
    mousePos = getMousePos(canvas, evt);
    //console.log('Mouse position: ' + mousePos.x + ',' + mousePos.y);
  },
  false
);

var boid = new Boid(canvas, 500);
var updateInterval = setInterval(function () {
  renderCanvas(canvas);
}, 1000 / 60);
