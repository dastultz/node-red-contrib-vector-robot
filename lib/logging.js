const path = require("path");
const { homedir } = require("os");
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, splat } = format;

const logfile = `${homedir()}${path.sep}vector.log`;

const plain = format.printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

const rootLogger = createLogger({
    level: "debug",
    transports: [new transports.File({ filename: logfile, handleExceptions: true })],
    format: combine(splat(), timestamp(), plain),
});

const getLogger = (fullPathToFile) => {
    const scriptName = path.basename(fullPathToFile);
    const label = scriptName.substring(0, scriptName.lastIndexOf("."));
    return rootLogger.child({ label });
};

// useful for swapping out during dev
const getConsoleLogger = (context) => {
    return {
        info: (msg) => console.log(msg),
        debug: (msg) => console.log(msg),
        trace: (msg) => console.log(msg),
        warn: (msg) => console.log(msg),
        error: (msg) => console.log(msg),
    };
};

module.exports = getLogger;
/*
Other things to explore
    logger is a stream, it has end() and on finish, could integrate with stream manager
    exception handling wrt exiting
    profiling
*/
