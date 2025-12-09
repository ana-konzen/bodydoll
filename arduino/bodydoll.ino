#include <ArduinoBLE.h>

#include <EncoderStepCounter.h>

#include <Adafruit_seesaw.h>



// neck encoder w/ pins:
// neck pins: 16, 17
EncoderStepCounter neck_encoder(16, 17);

EncoderStepCounter left_shoulder_encoder(11, 12);
EncoderStepCounter left_elbow_encoder(9, 10);
EncoderStepCounter left_hip_encoder(5, 6);
EncoderStepCounter left_knee_encoder(2, 3);

int neck_pos = 0;
int neck_oldpos = 0;

Adafruit_seesaw right_ss = Adafruit_seesaw(&Wire);


#define RIGHT_SEESAW_ADDR 0x49


int32_t right_enc_positions[4] = { 0, 0, 0, 0 };

int left_enc_positions[4] = { 0, 0, 0, 0 };

int left_enc_old_positions[4] = { 0, 0, 0, 0 };

BLEService dataService("19B10000-E8F2-537E-4F6C-D104768A1214");

// 6 bytes: side (1) + encoder index (1) + delta (4)
BLECharacteristic dataCharacteristic(
  "19B10002-E8F2-537E-4F6C-D104768A1214",  // new characteristic UUID
  BLERead | BLENotify,
  6,    // value size in bytes
  true  // fixed length
);

void setup() {
  Serial.begin(115200);
  // while (!Serial) delay(10);

  Serial.println("Starting...");

  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");
    while (1)
      ;
  }

  // Set advertised name and service
  BLE.setLocalName("NanoBytes");
  BLE.setAdvertisedService(dataService);

  // Add characteristic to service, and service to BLE
  dataService.addCharacteristic(dataCharacteristic);
  BLE.addService(dataService);

  // Initial value: [1, 2, 3]
  uint8_t initPacket[6] = { 0, 0, 0, 0, 0, 0 };
  dataCharacteristic.writeValue(initPacket, 6);

  Serial.println("BLE started, advertising...");
  // Start advertising
  BLE.advertise();


  initateSS(right_ss, RIGHT_SEESAW_ADDR, right_enc_positions);

  neck_encoder.begin();

  left_shoulder_encoder.begin();
  left_elbow_encoder.begin();
  left_hip_encoder.begin();
  left_knee_encoder.begin();
}

void loop() {
  // Wait for a central (your browser / p5 sketch) to connect
  BLEDevice central = BLE.central();

  if (central) {
    Serial.print("Connected to central: ");
    Serial.println(central.address());

    while (central.connected()) {

      handleEncoder(0, right_ss, right_enc_positions);
      handleNeck();

      handleLeftEncoder(left_shoulder_encoder, 0);
      handleLeftEncoder(left_elbow_encoder, 1);
      handleLeftEncoder(left_hip_encoder, 2);
      handleLeftEncoder(left_knee_encoder, 3);

      BLE.poll();  // be nice to the BLE stack
      delay(1);    // tiny breather so things don’t starve
    }

    Serial.print("Disconnected from central: ");
    Serial.println(central.address());
  }
}

void initateSS(Adafruit_seesaw &ss, int SEESAW_ADDR, int32_t enc_positions[4]) {
  if (!ss.begin(SEESAW_ADDR)) {
    Serial.println("Couldn't find seesaw ");
    while (1) delay(10);
    return;
  }
  Serial.println("seesaw started");

  uint32_t version = ((ss.getVersion() >> 16) & 0xFFFF);

  Serial.print("version: ");
  Serial.println(version);

  // get starting positions
  for (int e = 0; e < 4; e++) {
    enc_positions[e] = ss.getEncoderPosition(e);
    ss.enableEncoderInterrupt(e);  // check if this is necessary
  }
}

void handleEncoder(int side, Adafruit_seesaw &ss, int32_t enc_positions[]) {
  for (int e = 0; e < 4; e++) {

    int32_t new_enc_position = ss.getEncoderPosition(e);

    if (enc_positions[e] != new_enc_position) {
      int32_t posDelta = new_enc_position - enc_positions[e];
      sendData(side, e, posDelta);
      enc_positions[e] = new_enc_position;  
  }
}

void handleNeck() {
  neck_encoder.tick();
  neck_pos = neck_encoder.getPosition();

  if (neck_pos != neck_oldpos) {
    int pos_delta = neck_pos - neck_oldpos;
    sendData(2, 0, pos_delta);
    neck_oldpos = neck_pos;
  }
}

void handleLeftEncoder(EncoderStepCounter &encoder, int index) {
  encoder.tick();

  int encPos = encoder.getPosition();


  if (left_enc_positions[index] != encPos) {
    int posDelta = encPos - left_enc_positions[index];

    sendData(1, index, posDelta);


    left_enc_positions[index] = encPos;
  }
}

void printData(int side, int e, int posDelta) {
  Serial.print(side);
  Serial.print(",");
  Serial.print(e);
  Serial.print(",");
  Serial.println(posDelta);
}

void sendData(int side, int e, int posDelta) {
  printData(side, e, posDelta);
  uint8_t packet[6];
  packet[0] = (uint8_t)side;  // 0 or 1
  packet[1] = (uint8_t)e;     // encoder index

  // pack 32-bit signed int (little endian)
  packet[2] = (uint8_t)(posDelta & 0xFF);
  packet[3] = (uint8_t)((posDelta >> 8) & 0xFF);
  packet[4] = (uint8_t)((posDelta >> 16) & 0xFF);
  packet[5] = (uint8_t)((posDelta >> 24) & 0xFF);

  // send via BLE (updates value + notifies)
  dataCharacteristic.writeValue(packet, 6);
}