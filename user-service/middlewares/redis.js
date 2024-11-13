import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();
console.log("[user-service] connecting to redis with url " + process.env.REDIS_URL);
const client = createClient({
    url: process.env.REDIS_URL || 'redis://redis:6379' // Adjust the URL if using Docker or a remote instance
});

client.on("ready", () => console.log("Connected to redis!"));
client.on('error', err => console.log('Redis Client Error', err));

if (!client.isOpen) {
    await client.connect();
}

export default client;

export async function printAllKeys() {
    try {
        const keys = await client.keys('*');
        console.log('Keys:', keys);
    } catch (error) {
        console.error('Error printing all keys:', error);
    }
}

export async function addToken(key) {
    const expiryInSeconds = 60 * 2
    const value = 'refreshToken'
    try {
        await client.set(key, value, {
            EX: expiryInSeconds,
            NX: true
        });
        console.log(`Key "${key}" set with expiry of ${expiryInSeconds} seconds.`);
    } catch (error) {
        console.error('Error setting key with expiry:', error);
        throw error;
    }
    printAllKeys();
}

export async function removeToken(key) {
    try {
        const result = await client.del(key);
        console.log('Number of keys deleted:', result);
        if (result > 0) {
            console.log('Key deleted:', key);
        }
    } catch (error) {
        console.error('Error deleting key:', error);
        throw error;
    }
    printAllKeys();
}

export async function tokenExists(key) {
    printAllKeys();
    try {
        const result = await client.exists(key);
        if (result === 0) {
            console.log(`Key "${key}" does not exist.`);
            return false;
        }
        console.log(`Key "${key}" exists.`);
        return true;
    } catch (error) {
        console.error('Error checking if key exists:', error);
        throw error;
    }
}