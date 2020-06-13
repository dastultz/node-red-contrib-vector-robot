function expiringPromise(timeoutMillis, promise) {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject("Request timed out.");
        }, timeoutMillis);
    });

    return Promise.race([promise, timeout])
        .then((result) => {
            clearTimeout(timeoutId);
            return result;
        })
        .catch((error) => {
            clearTimeout(timeoutId);
            throw error;
        });
}

module.exports.expiringPromise = expiringPromise;
