const getLogger = require("./logging");
const Client = require("./client");
const StreamManager = require("./stream-manager");
const EventEmitter = require("events");

const logger = getLogger(__filename);

const EVENT_CONTROL_GRANTED_RESPONSE = "EVENT_CONTROL_GRANTED_RESPONSE";
const MSG_REQUEST_CONTROL = { control_request: { priority: 20 } };
const MSG_RELEASE_CONTROL = { control_release: {} };

function Vector(config) {
    var client;

    const behaviorEventEmitter = new EventEmitter();
    var behaviorStream;

    const init = function () {
        client = Client(config);

        const streamFactory = () => {
            return client.BehaviorControl(MSG_RELEASE_CONTROL); // ClientDuplexStream
        };
        behaviorStream = StreamManager(streamFactory, function (data, stream) {
            if (data.control_granted_response) {
                behaviorEventEmitter.emit(EVENT_CONTROL_GRANTED_RESPONSE);
            }
        });
    };

    function requestControl() {
        return new Promise(function (resolve) {
            behaviorStream.stream.write(MSG_REQUEST_CONTROL);
            behaviorEventEmitter.once(EVENT_CONTROL_GRANTED_RESPONSE, () => {
                resolve();
            });
        });
    }

    function releaseControl() {
        behaviorStream.stream.write(MSG_RELEASE_CONTROL);
    }

    async function sayText(text, options) {
        const args = {
            text: text,
            use_vector_voice: true,
            duration_scalar: "1.0",
            ...options,
        };
        await requestControl();
        return new Promise(function (resolve) {
            client.SayText(args, (error) => {
                if (error) {
                    logger.warn("sayText error:", error);
                }
                releaseControl();
                resolve();
            });
        });
    }

    return {
        init,
        sayText,
    };
}

module.exports = Vector;
