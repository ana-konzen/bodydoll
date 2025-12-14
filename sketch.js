let joints = [];

const palette = [
  "#EAB69F",
  // "#E5987F",
  // "#E07A5F",
  "#bf3a15",
  "#8F5D5D",
  "#3D405B",
  "#83929c",
  // "#5F797B",
  // "#9ca115",
  "#a15415",
  "#402d1d",
  "#4a3a3f",
  "#B86C5E",
];

const rightJointList = [
  "right-elbow",
  "right-hand",
  "right-knee",
  "right-foot",
];
const leftJointList = ["left-elbow", "left-hand", "left-knee", "left-foot"];
const jointLists = [leftJointList, rightJointList];

const trails = [];

let trail;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  trails.push(new Trail());

  noStroke();
  background("#f7f2eb");

  // pixelDensity(1);

  joints = [
    new Joint("neck", 1, 50, true),
    new Joint("left-shoulder", 80, 10),
    new Joint("left-elbow", 35, 160),
    new Joint("left-hand", 20, 180),
    new Joint("right-shoulder", -80, 10),
    new Joint("right-elbow", -35, 160),
    new Joint("right-hand", -20, 180),
    new Joint("center", 0, 240),
    new Joint("left-hip", 80, 10),
    new Joint("right-hip", -80, 10),
    new Joint("left-knee", 15, 200),
    new Joint("right-knee", -15, 200),
    new Joint("left-foot", 10, 220),
    new Joint("right-foot", -10, 220),
  ];

  joints[0].updatePos(width / 2, 100);

  connectJoints(joints[0], joints[1]);
  connectJoints(joints[0], joints[4]);
  connectJoints(joints[0], joints[7]);

  setupBLE();
}

function keyPressed() {
  if (key === "r") {
    clear();
    background("#f7f2eb");
    trails[0].pg.clear();
  }
}

function draw() {
  updateJointsFromData();
  translate(-width / 2, -height / 2);
  background("#f7f2eb");

  connectJoints(joints[1], joints[2]);
  connectJoints(joints[2], joints[3]);
  connectJoints(joints[4], joints[5]);
  connectJoints(joints[5], joints[6]);
  connectJoints(joints[7], joints[8]);
  connectJoints(joints[7], joints[9]);
  connectJoints(joints[8], joints[10]);
  connectJoints(joints[9], joints[11]);
  connectJoints(joints[10], joints[12]);
  connectJoints(joints[11], joints[13]);

  // push();
  // fill(247, 242, 235, 5);
  // rect(0, 0, width, height);
  // pop();
  for (const trail of trails) {
    trail.display();
    // trail.update();
  }

  // for (let i = trails.length - 1; i >= 0; i--) {
  //   if (trails[i].isDead()) {
  //     trails.splice(i, 1);
  //   }
  // }

  // for (const joint of joints) {
  //   joint.update();
  // }
}

function connectJoints(joint1, joint2) {
  const joint1End = joint1.getEndPos();

  joint2.updatePos(joint1End.x, joint1End.y);
}

function updateJointsFromData() {
  if (incomingData.length === 3) {
    console.log("Updating joints with incoming data:", incomingData);
    const side = incomingData[0];
    const encoder = incomingData[1];
    const delta = incomingData[2];

    if (side === 2) {
      joints[0].newAng -= delta * 20;
    } else {
      updateJoints(side, encoder, delta);
    }

    // trails.push(new Trail());

    // Clear incoming data after processing
    incomingData = [];
  }
}

function updateJoints(side, encoder, delta) {
  const currentJoint = jointLists[side][encoder];
  const direction = side === 0 ? -1 : 1;

  const deltaAng = delta * direction;

  select("#angles").html(`Joint ${currentJoint} angle: ${delta}`);

  let nextJoint = null;

  if (currentJoint === "right-elbow") {
    nextJoint = "right-hand";
  } else if (currentJoint === "left-elbow") {
    nextJoint = "left-hand";
  } else if (currentJoint === "right-knee") {
    nextJoint = "right-foot";
  } else if (currentJoint === "left-knee") {
    nextJoint = "left-foot";
  }

  for (const joint of joints) {
    if (
      joint.type === currentJoint ||
      (nextJoint && joint.type === nextJoint)
    ) {
      if (
        joint.type === "right-elbow" ||
        joint.type === "right-hand" ||
        joint.type === "left-hand" ||
        joint.type === "left-foot"
      ) {
        if (joint.type === currentJoint) {
          if (joint.type !== "right-hand") {
            joint.newAng += deltaAng * 18;
          } else {
            joint.newAng -= deltaAng * 18;
          }
        } else {
          if (joint.type !== "right-elbow" && joint.type !== "right-hand") {
            joint.newAng -= deltaAng * 18;
          } else {
            joint.newAng += deltaAng * 18;
          }
        }
      } else {
        joint.newAng -= deltaAng * 18;
      }
    }
  }
}

function jitterColor(c, jitterLevel = 5) {
  const r = randomGaussian(c.levels[0], jitterLevel);
  const g = randomGaussian(c.levels[1], jitterLevel);
  const b = randomGaussian(c.levels[2], jitterLevel);
  return color(r, g, b);
}

class Joint {
  constructor(type, ang = 0, length = 100, inverse = false) {
    this.type = type;
    this.length = length;
    this.x = 0;
    this.y = 0;
    this.size = 15;
    this.color = color(random(palette));
    this.fillColor = this.color;
    this.noiseDimension = random(1, 10);
    this.slider = createSlider(0, 24);
    this.ang = ang;
    this.newAng = ang + 1;

    this.inverse = inverse;

    this.createDomElements();

    this.slider.input(() => {
      this.newAng = map(this.slider.value(), 0, 24, -180, 180);
    });
  }

  createDomElements() {
    const container = createDiv(this.type);
    container.parent("slider-cont");
    container.class("cont");
    this.slider.parent(container);
    this.slider.size(80);
    const sliderValue = map(this.ang, -180, 180, 24, 0);
    this.slider.value(sliderValue);
  }

  getEndPos() {
    const angRad = radians(this.ang - 90);
    const x2 = this.x - this.length * cos(angRad);
    const y2 = this.y - this.length * sin(angRad);
    return { x: x2, y: y2 };
  }

  updateSize() {
    const n = noise(this.y * 0.05, this.x * 0.05, this.noiseDimension);
    this.size = n * 30;
  }

  updatePos(newX, newY) {
    this.x = newX;
    this.y = newY;
    this.updateSize();
  }

  update(pg) {
    if (frameCount % 1000 === 0) {
      this.color = color(random(palette));
    }

    if (this.ang !== this.newAng) {
      // this.updateSize();
      this.fillColor = jitterColor(this.color);
      this.ang = lerp(this.ang, this.newAng, 0.1);
      const n = noise(
        abs(sin(this.newAng)) * this.length * 0.9,
        abs(cos(this.newAng)) * this.length * 0.9,
        this.noiseDimension
      );
      this.size = n * 30;
      if (this.inverse) {
        this.drawInverse(pg);
      } else {
        this.draw(pg);
      }
    }
  }

  drawInverse(pg) {
    this.fillColor.setAlpha(random(2, 10));

    pg.fill(this.fillColor);

    pg.push();
    pg.translate(this.x, this.y + this.length);
    pg.rotate(radians(this.ang));
    // ellipse(0, -this.length, this.size);

    for (let i = 0; i < this.length; i++) {
      pg.ellipse(0, -i, random(4, 10));
    }

    pg.pop();
  }

  draw(pg) {
    this.updateSize();
    this.fillColor.setAlpha(random(2, 10));

    pg.fill(this.fillColor);
    // const endPos = this.getEndPos();
    // ellipse(endPos.x, endPos.y, this.size);

    this.fillColor.setAlpha(random(2, 10));
    pg.fill(this.fillColor);

    pg.push();
    pg.translate(this.x, this.y);
    pg.rotate(radians(this.ang));

    for (let i = 0; i < this.length; i++) {
      pg.ellipse(0, i, random(4, 10));
    }

    pg.pop();
  }
}

class Trail {
  constructor() {
    this.pg = createGraphics(windowWidth, windowHeight);
    this.lifetime = 255;
    this.pg.noStroke();
    // this.pg.pixelDensity(1);
  }

  update() {
    this.lifetime -= 2;
  }

  isDead() {
    return this.lifetime <= 0;
  }

  display() {
    this.pg.push();
    this.pg.translate(0, 100);
    for (const joint of joints) {
      joint.update(this.pg);
    }
    tint(255, this.lifetime);
    this.pg.pop();
    image(this.pg, 0, 0);
  }
}
