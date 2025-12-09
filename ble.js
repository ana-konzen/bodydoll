const serviceUuid = "19B10000-E8F2-537E-4F6C-D104768A1214";

let myBLE;
let myCharacteristic;
let isConnected = false;

function setupBLE() {
  // Create p5.ble instance
  myBLE = new p5ble();

  // Connect button
  const connectButton = createButton("Connect")
    .addClass("ble-button")
    .addClass("disconnected");
  connectButton.mousePressed(connectAndStartNotifications);

  // Optional: disconnect button
  const disconnectButton = createButton("Disconnect");
  disconnectButton.mousePressed(disconnectFromBle);
}

function handleDisconnect() {
  console.log("Device disconnected");
  isConnected = false;
  const connectButton = select(".ble-button");
  connectButton.removeClass("connected");
  connectButton.addClass("disconnected");
  connectButton.html("Connect");
}

function disconnectFromBle() {
  if (myBLE.isConnected()) {
    myBLE.disconnect();
  }
}

function connectAndStartNotifications() {
  myBLE.connect(serviceUuid, gotCharacteristics);
}

function gotCharacteristics(error, characteristics) {
  if (error) {
    console.error("Error getting characteristics:", error);
    return;
  }

  console.log("Characteristics:", characteristics);

  myCharacteristic = characteristics[0];

  myBLE.startNotifications(myCharacteristic, handleNotifications, "custom");

  // Listen for disconnects
  myBLE.onDisconnected(handleDisconnect);

  isConnected = true;
  const connectButton = select(".ble-button");
  connectButton.removeClass("disconnected");
  connectButton.addClass("connected");
  connectButton.html("Connected");
}
