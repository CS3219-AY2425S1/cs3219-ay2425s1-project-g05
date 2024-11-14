import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export const connectMockDb = async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri).then(() => {
        // console.log("Connected to in-memory database");
    }).catch((error) => {
        console.log("Failed to connect to in-memory database");
        console.log(error);
    });;
};

export const clearMockDb = async () => {
    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
        const collection = mongoose.connection.collections[collectionName];
        await collection.deleteMany({}).then(() => {
            // console.log(`Cleared collection: ${collectionName}`);
        }).catch((error) => {
            console.log(`Failed to clear collection: ${collectionName}`);
            console.log(error);
        });
    }
};

export const disconnectMockDb = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop().then(() => {
        // console.log("Disconnected from in-memory database");
    }).catch((error) => {
        console.log("Failed to disconnect from in-memory database");
        console.log(error);
    });
};
