const https = require("https");

const services = [
  "https://taskflow-autth.onrender.com/health",

  "https://taskflow-socket.onrender.com/healthz",
];

function pingServices() {
  services.forEach((url) => {
    https
      .get(url, (res) => {
        console.log(`Pinged ${url} - Status Code: ${res.statusCode}`);
      })
      .on("error", (e) => {
        console.error(`Error pinging ${url}: ${e.message}`);
      });
  });
}

pingServices();
