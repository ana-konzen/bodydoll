let incomingData = [];
function handleNotifications(data) {
  const view = new DataView(data.buffer);

  const side = view.getInt8(0);
  const encoder = view.getInt8(1);
  const delta = view.getInt32(2, true); // little-endian

  console.log("side:", side, "encoder:", encoder, "delta:", delta);
  incomingData = [side, encoder, delta];
}
