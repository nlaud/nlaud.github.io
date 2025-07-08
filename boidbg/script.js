//Helper Functions
const randomRgbColor = () => {
  let r = Math.floor(Math.random() * 256); // Random between 0-255
  let g = Math.floor(Math.random() * 256); // Random between 0-255
  let b = Math.floor(Math.random() * 256); // Random between 0-255
  return "rgb(" + r + "," + g + "," + b + ")";
};

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
    visibleRange
  ) {
    for (var object of this.objects) {
      object.separationWeight = separationWeight;
      object.alignmentWeight = alignmentWeight;
      object.cohesionWeight = cohesionWeight;
      object.wallWeight = wallWeight;
      object.protectedRange = protectedRange;
      object.visibleRange = visibleRange;
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

    this.size = new Vector2D(15, 30);

    this.color = randomRgbColor();
    this.trailLength = 0;
    this.pastPos = [];

    this.opacity = 1;

    this.separationWeight = 2;
    this.alignmentWeight = 1.03;
    this.cohesionWeight = 0.02;
    this.cursorWeight = 0;

    this.wallWeight = 0; //75
    this.wallMargin = 250;

    this.protectedRange = 11;
    this.visibleRange = 35;

    this.maxSpeed = 10;
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
        boidVelocity.x += boidObject.velocity.x;
        boidVelocity.y += boidObject.velocity.y;

        visibleBoids += 1;
      }
    }
    if (visibleBoids > 0) {
      boidVelocity.x = boidVelocity.x / visibleBoids;
      boidVelocity.y = boidVelocity.y / visibleBoids;
    }
    var alignmentVelocity = new Vector2D(boidVelocity.x, boidVelocity.y);

    //Cohesion
    var boidPos = new Vector2D(0, 0);
    var visibleBoids = 0;

    for (var boidObject of boid.objects) {
      var distance = Math.sqrt(
        Math.pow(this.pos.x - boidObject.pos.x, 2) +
          Math.pow(this.pos.y - boidObject.pos.y, 2)
      );
      if (distance < this.visibleRange) {
        //Not this boid and distance small enough
        boidPos.x += boidObject.pos.x;
        boidPos.y += boidObject.pos.y;

        visibleBoids += 1;
      }
    }

    if (visibleBoids > 0) {
      boidPos.x = boidPos.x / visibleBoids;
      boidPos.y = boidPos.y / visibleBoids;
    }
    var cohesionVelocity = new Vector2D(
      boidPos.x - this.pos.x,
      boidPos.y - this.pos.y
    );

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
    ctx.moveTo(vertices[0].x, vertices[0].y);

    // Draw lines to each vertex
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
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
