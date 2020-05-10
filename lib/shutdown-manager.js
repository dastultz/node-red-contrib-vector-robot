const serviceShutdownHandlers = [];

function register(shutdownHandler) {
    serviceShutdownHandlers.push(shutdownHandler);
}

function shutdownServicesAndExit() {
    serviceShutdownHandlers.forEach((shutdownHandler) => {
        try {
            shutdownHandler();
        } catch (error) {
            log.error(`Shutdown handler error ${error}`);
        }
    });
    process.exit(0);
}

process.on("SIGTERM", shutdownServicesAndExit);
process.on("SIGINT", shutdownServicesAndExit);

module.exports.registerForShutdown = register;
