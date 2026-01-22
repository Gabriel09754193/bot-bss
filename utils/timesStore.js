const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "times.json");

function carregarTimes() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }

  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

function salvarTimes(times) {
  fs.writeFileSync(filePath, JSON.stringify(times, null, 2));
}

module.exports = {
  carregarTimes,
  salvarTimes
};
