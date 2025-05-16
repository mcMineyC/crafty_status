export const prerender = false;
import axios from "axios";
import fs from "fs";
import https from "https";
import config from "../../config.json";

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
export async function getFriendlyStats(){
  const stats = await getPlayerStats();
  const friendly = await transformData(stats.serverStats, stats.systemStats);
  return friendly;
}

export async function GET({ params }) {
  return new Response(JSON.stringify(await getFriendlyStats()), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
