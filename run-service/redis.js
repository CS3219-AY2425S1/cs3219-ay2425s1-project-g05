import { redisClient } from "./server.js";

// Function to print Redis memory contents
async function printRedisMemory() {
  try {
    console.log("\n=== Redis Memory Contents ===");

    // Get all keys in the Redis database
    const keys = await redisClient.keys("*");
    for (const key of keys) {
      console.log("Key:", key);

      // Check the time-to-live (TTL) of the key
      const ttl = await redisClient.ttl(key);
      console.log("TTL:", ttl === -1 ? "No expiration" : `${ttl} seconds`);

      // Check the type of each key to handle it appropriately
      const type = await redisClient.type(key);
      console.log("Type:", type);

      let value;
      if (type === "hash") {
        value = await redisClient.hGetAll(key);
      } else if (type === "string") {
        value = await redisClient.get(key);
      } else if (type === "list") {
        value = await redisClient.lRange(key, 0, -1);
      } else if (type === "set") {
        value = await redisClient.sMembers(key);
      } else {
        value = "Unknown or unsupported type";
      }

      console.log("Value:", value);
    }
  } catch (error) {
    console.error("Error printing Redis memory:", error);
  }
}
export default printRedisMemory;