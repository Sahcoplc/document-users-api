import fs from 'fs'

 /**
 * Cache Plugin configuration
 */

export const cachePlugin = function (cacheLocation) {
    const beforeCacheAccess = (cacheContext) => {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(cacheLocation)) {
                fs.readFile(cacheLocation, "utf-8", (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        cacheContext.tokenCache.deserialize(data);
                        resolve();
                    }
                });
            } else {
               fs.writeFile(cacheLocation, cacheContext.tokenCache.serialize(), (err) => {
                    if (err) {
                        reject(err);
                    }
                });
            }
        });
    }
    
    const afterCacheAccess = (cacheContext) => {
        return new Promise((resolve, reject) => {
            if(cacheContext.cacheHasChanged){
                fs.writeFile(cacheLocation, cacheContext.tokenCache.serialize(), (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    };
    
    
    return {
        beforeCacheAccess,
        afterCacheAccess
    }
}

export const cachePlugins = (persistenceHelper, sessionId) => {
    return {
        beforeCacheAccess: async (cacheContext) => {
            return new Promise(async (resolve, reject) => {
                
                // express session ids start with the prefix "sess:"
                persistenceHelper.get("sess:" + sessionId, (err, sessionData) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }

                    if (sessionData) {
                        try {
                            const parsedSessionData = JSON.parse(sessionData); // parse the session data

                            persistenceHelper.get(parsedSessionData.account.homeAccountId, (err, cacheData) => {
                                if (err) {
                                    console.log(err);
                                    reject(err);
                                }
                                cacheContext.tokenCache.deserialize(cacheData);
                                resolve();
                            });

                        } catch (err) {
                            console.log(err)
                            reject(err);
                        }
                    } else {
                        resolve();
                        return;
                    }
                });

            });
        },
        afterCacheAccess: async (cacheContext) => {
            return new Promise((resolve, reject) => {

                if (cacheContext.cacheHasChanged) {
                    const kvStore = cacheContext.tokenCache.getKVStore();
                    
                    if (Object.keys(kvStore).length > 0) {
                        const accountEntity = Object.values(kvStore)[1]; // the second entity is the account

                        if (accountEntity.hasOwnProperty("homeAccountId")) {
                            const homeAccountId = accountEntity.homeAccountId; // the homeAccountId is the partition key

                            persistenceHelper.set(homeAccountId, cacheContext.tokenCache.serialize(), (err, data) => {
                                if (err) {
                                    console.log(err);
                                    reject(err);
                                }
                                resolve();
                            });

                        } else {
                            reject(new Error("homeAccountId is not defined"));
                        }
                    }
                } else {
                    resolve();
                    return;
                }
            });
        }
    };
};
