const getLogger = require("./logging.js");
const ShutdownManager = require("./shutdown-manager");

const logger = getLogger(__filename);

const WATCH_DOG_INTERVAL = 5000;

function StreamManager(createStream, consumeData) {
    const streamContainer = {};
    connect();
    ShutdownManager.registerForShutdown(shutdown);

    let lastMessageTime = Date.now();
    let shuttingDown = false;
    setInterval(watchDog, WATCH_DOG_INTERVAL);

    function connect() {
        if (streamContainer.stream) shutdown();
        const stream = createStream();
        stream.on("data", dataHandler);
        stream.on("end", endHandler);
        stream.on("error", errorHandler);
        stream.on("status", statusHandler);
        streamContainer.stream = stream;
    }

    function shutdown() {
        const stream = streamContainer.stream;
        logger.info("shutting down stream");
        shuttingDown = true;
        if (stream) {
            if (stream.end) {
                stream.end();
            } else if (stream.cancel) {
                stream.cancel();
            }
        }
        streamContainer.stream = undefined;
        shuttingDown = false;
    }

    function isKeepAlive(data) {
        return data.response_type === "keep_alive" || (data.event && data.event.event_type === "keep_alive");
    }

    function watchDog() {
        const currentTime = Date.now();
        if (currentTime - lastMessageTime > WATCH_DOG_INTERVAL) {
            lastMessageTime = Date.now();
            logger.warn("Lost event stream, trying to reconnect");
            reconnect();
        }
    }

    function reconnect() {
        if (shuttingDown) {
            logger.debug("not trying to reconnect");
        } else {
            logger.debug("reconnecting");
            connect();
        }
    }

    function dataHandler(data) {
        lastMessageTime = Date.now();
        if (!isKeepAlive(data)) consumeData(data, streamContainer.stream);
    }

    function endHandler() {
        logger.debug("caught end event from stream");
        reconnect();
    }

    function errorHandler(error) {
        logger.error("error: " + JSON.stringify(error));
        reconnect();
    }

    function statusHandler(status) {
        logger.info("status: " + JSON.stringify(status));
    }

    return Object.freeze({
        get stream() {
            return streamContainer.stream;
        },
    });
}

module.exports = StreamManager;
