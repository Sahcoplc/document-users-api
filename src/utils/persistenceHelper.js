export const persistenceHelper = (client) => {
    return {
        get: (key, callback) => {
            client.get(key, callback);
        },
        // For demo purposes, the client does not set sliding expiration, see the docs https://redis.io/commands/setex
        set: (key, value, callback) => {
            client.set(key, value, callback);
        },
    }
};