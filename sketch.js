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

// serial stuff
let inData = 0; // for incoming serial data

let serialBegan = false;

function setup() {
  createCanvas(500, windowHeight);

  // angleMode(RADIANS);
  noStroke();
  background("#f7f2eb");

  joints = [
    new Joint("neck", 1, 50, true),
    new Joint("left-shoulder", 70, 50),
    new Joint("left-elbow", 10),
    new Joint("left-hand"),
    new Joint("right-shoulder", -70, 50),
    new Joint("right-elbow", -10),
    new Joint("right-hand"),
    new Joint("center", 0, 200),
    new Joint("left-hip", 70, 30),
    new Joint("right-hip", -70, 30),
    new Joint("left-knee", 0, 120),
    new Joint("right-knee", 0, 120),
    new Joint("left-foot", 0, 140),
    new Joint("right-foot", 0, 140),
  ];

  joints[0].updatePos(width / 2, 100);

  connectJoints(joints[0], joints[1]);
  connectJoints(joints[0], joints[4]);
  connectJoints(joints[0], joints[7]);

  prepareSerial(serialEvent); // pass serialEvent as an argument
}

function draw() {
  // background("#f7f2eb");

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

  for (const joint of joints) {
    joint.update();
  }

  // connectJoints(joints[1], joints[2]);
}

function connectJoints(joint1, joint2) {
  const joint1End = joint1.getEndPos();

  joint2.updatePos(joint1End.x, joint1End.y);
}

// read any incoming data as a string
// (assumes a newline at the end of it):
function serialEvent() {
  serialBegan = true;
  // read a byte from the serial port, convert it to a number:
  const inString = serial.readLine();
  if (inString) {
    inData = Number(inString);
    select("#angles").html(inData);
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
      this.newAng = map(this.slider.value(), 0, 24, 180, -180);
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

  update() {
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
        this.drawInverse();
      } else {
        this.draw();
      }
    }
  }

  drawInverse() {
    this.fillColor.setAlpha(random(10, 100));

    fill(this.fillColor);

    push();
    translate(this.x, this.y + this.length);
    rotate(radians(this.ang));
    ellipse(0, -this.length, this.size);

    for (let i = 0; i < this.length; i++) {
      ellipse(0, -i, random(1, 4));
    }

    pop();
  }

  draw() {
    this.updateSize();
    this.fillColor.setAlpha(random(150, 255));

    fill(this.fillColor);
    const endPos = this.getEndPos();
    ellipse(endPos.x, endPos.y, this.size);

    this.fillColor.setAlpha(random(10, 100));
    fill(this.fillColor);

    push();
    translate(this.x, this.y);
    rotate(radians(this.ang));

    for (let i = 0; i < this.length; i++) {
      ellipse(0, i, random(1, 4));
    }

    pop();
  }
}
