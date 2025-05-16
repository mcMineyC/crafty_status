const axios = require('axios');
const fs = require('fs');
const express = require('express');
const https = require('https');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const PORT = config.port || 3000;

const api = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),
  baseURL: config.url,
  headers: {
    'Authorization': `Bearer ${config.apikey}`,
    'Content-Type': 'application/json'
  },
});

const app = express();
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies
async function getPlayerStats() {
    try {
        // First get system-wide stats
        const systemResponse = await api.get('/api/v2/crafty/stats');

        // Get server UUIDs
        const serversResponse = await api.get('/api/v2/servers');
        const serversData = serversResponse.data.data;
        const serverUUIDs = serversData.map(server => server.server_id);

        // Get detailed stats for each server
        const serverStats = [];
        for (const uuid of serverUUIDs) {
            try {
                const serverResponse = await api.get(`/api/v2/servers/${uuid}/stats`);
                serverStats.push({
                    uuid,
                    ...serverResponse.data.data
                });
            } catch (error) {
                console.warn(`Failed to get stats for server ${uuid}:`, error.message);
            }
        }

        return {
            systemStats: systemResponse.data,
            serverStats: serverStats
        };
    } catch (error) {
        console.error('Error fetching player statistics:', error.message);
        throw error;
    }
}

async function transformData(serverStats, systemStats) {
  // console.log(serverStats.forEach((s) => console.log(s)));
  const response = await api.get("/static/assets/images/pack.png", { responseType: 'arraybuffer' });
  var icon = Buffer.from(response.data).toString('base64');
  return {
    servers: serverStats.map((server) =>{
      return {
        name: server.server_id.server_name,
        // image: server.icon || icon,
        uuid: server.uuid,
        players: server.players == "False" ? [] : JSON.parse(server.players.replaceAll("'", '"')),
        maxPlayers: server.max,
        version: server.version,
        motd: server.desc,
        online: server.running,
        updating: server.updating,
        cpu: server.cpu,
        memory: server.mem_percent,
      }
    }),
  }
}
async function getFriendlyStats(){
  const stats = await getPlayerStats();
  const friendly = await transformData(stats.serverStats, stats.systemStats);
  fs.writeFileSync('./stats.json', JSON.stringify(friendly, null, 2));
  return friendly;
}

app.get('/stats', async (req, res) => res.json(await getFriendlyStats()));
app.get('/', async (req, res) => {
  var response = "<!DOCTYPE html><html><head><title>Server Status</title></head><body><h1>Server Status</h1><br>";
  var stats = await getFriendlyStats();
  response += `<table border="1"><tr><th>Name</th><th>Players</th><th>Max</th><th>Version</th><th>MOTD</th><th>Online</th></tr>`;
  stats.servers.forEach((server) => {
    response += `<tr>
      <td>${server.name}</td>
      <td>${server.online ? server.players.length : ""}</td>
      <td>${server.online ? server.maxPlayers : ""}</td>
      <td>${server.online ? server.version : ""}</td>
      <td>${server.online ? server.motd : ""}</td>
      <td>${server.online ? "Online" : "Offline"}</td>
    `;
  })
  response += `</table></body></html>`;
  res.send(response);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("<center><h1>500 - Internal Server Error</h1><br><h3>"+err.message+"</h3></center>");
});

// Example usage
async function main() {
    const craftyUrl = config.url;
    const authToken = config.apikey;

    try {
        const stats = await getPlayerStats();
        // console.log('System Statistics:', stats.systemStats);
        console.log('Server Statistics:', stats.serverStats);
    } catch (error) {
        console.error('Failed to retrieve statistics:', error.message);
    }
}

app.listen(PORT, config.ip || "127.0.0.1", () => {
    console.log(`Server running on http://${config.ip || "127.0.0.1"}:${PORT}`);
});
const axios = require('axios');
const fs = require('fs');
const express = require('express');
const https = require('https');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const PORT = config.port || 3000;

const api = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),
  baseURL: config.url,
  headers: {
    'Authorization': `Bearer ${config.apikey}`,
    'Content-Type': 'application/json'
  },
});

const app = express();
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies
async function getPlayerStats() {
    try {
        // First get system-wide stats
        const systemResponse = await api.get('/api/v2/crafty/stats');

        // Get server UUIDs
        const serversResponse = await api.get('/api/v2/servers');
        const serversData = serversResponse.data.data;
        const serverUUIDs = serversData.map(server => server.server_id);

        // Get detailed stats for each server
        const serverStats = [];
        for (const uuid of serverUUIDs) {
            try {
                const serverResponse = await api.get(`/api/v2/servers/${uuid}/stats`);
                serverStats.push({
                    uuid,
                    ...serverResponse.data.data
                });
            } catch (error) {
                console.warn(`Failed to get stats for server ${uuid}:`, error.message);
            }
        }

        return {
            systemStats: systemResponse.data,
            serverStats: serverStats
        };
    } catch (error) {
        console.error('Error fetching player statistics:', error.message);
        throw error;
    }
}

async function transformData(serverStats, systemStats) {
  // console.log(serverStats.forEach((s) => console.log(s)));
  const response = await api.get("/static/assets/images/pack.png", { responseType: 'arraybuffer' });
  var icon = Buffer.from(response.data).toString('base64');
  return {
    servers: serverStats.map((server) =>{
      return {
        name: server.server_id.server_name,
        // image: server.icon || icon,
        uuid: server.uuid,
        players: server.players == "False" ? [] : JSON.parse(server.players.replaceAll("'", '"')),
        maxPlayers: server.max,
        version: server.version,
        motd: server.desc,
        online: server.running,
        updating: server.updating,
        cpu: server.cpu,
        memory: server.mem_percent,
      }
    }),
  }
}
async function getFriendlyStats(){
  const stats = await getPlayerStats();
  const friendly = await transformData(stats.serverStats, stats.systemStats);
  fs.writeFileSync('./stats.json', JSON.stringify(friendly, null, 2));
  return friendly;
}

app.get('/stats', async (req, res) => res.json(await getFriendlyStats()));
app.get('/', async (req, res) => {
  var response = "<!DOCTYPE html><html><head><title>Server Status</title></head><body><h1>Server Status</h1><br>";
  var stats = await getFriendlyStats();
  response += `<table border="1"><tr><th>Name</th><th>Players</th><th>Max</th><th>Version</th><th>MOTD</th><th>Online</th></tr>`;
  stats.servers.forEach((server) => {
    response += `<tr>
      <td>${server.name}</td>
      <td>${server.online ? server.players.length : ""}</td>
      <td>${server.online ? server.maxPlayers : ""}</td>
      <td>${server.online ? server.version : ""}</td>
      <td>${server.online ? server.motd : ""}</td>
      <td>${server.online ? "Online" : "Offline"}</td>
    `;
  })
  response += `</table></body></html>`;
  res.send(response);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("<center><h1>500 - Internal Server Error</h1><br><h3>"+err.message+"</h3></center>");
});

// Example usage
async function main() {
    const craftyUrl = config.url;
    const authToken = config.apikey;

    try {
        const stats = await getPlayerStats();
        // console.log('System Statistics:', stats.systemStats);
        console.log('Server Statistics:', stats.serverStats);
    } catch (error) {
        console.error('Failed to retrieve statistics:', error.message);
    }
}

app.listen(PORT, config.ip || "127.0.0.1", () => {
    console.log(`Server running on http://${config.ip || "127.0.0.1"}:${PORT}`);
});