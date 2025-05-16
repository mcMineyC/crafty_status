const axios = require('axios');
const fs = require('fs');
const express = require('express');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

async function getPlayerStats(craftyUrl, authToken) {
    const api = axios.create({
        baseURL: craftyUrl,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    });

    try {
        // First get system-wide stats
        const systemResponse = await api.get('/api/v2/crafty/stats');

        // Get server UUIDs
        const serversResponse = await api.get('/api/v2/servers');
        const serversData = serversResponse.data;
        const serverUUIDs = Object.keys(serversData);

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
            serverStats
        };
    } catch (error) {
        console.error('Error fetching player statistics:', error.message);
        throw error;
    }
}

// Example usage
async function main() {
    const craftyUrl = config.url;
    const authToken = config.apikey;

    try {
        const stats = await getPlayerStats(craftyUrl, authToken);
        console.log('System Statistics:', stats.systemStats);
        console.log('Server Statistics:', stats.serverStats);
    } catch (error) {
        console.error('Failed to retrieve statistics:', error.message);
    }
}

main();
