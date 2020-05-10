const getLogger = require("./logging");
const Client = require("./client");
const StreamManager = require("./stream-manager");
const EventEmitter = require("events");

const logger = getLogger(__filename);

const EVENT_CONTROL_GRANTED_RESPONSE = "EVENT_CONTROL_GRANTED_RESPONSE";
const MSG_REQUEST_CONTROL = { control_request: { priority: 20 } };
const MSG_RELEASE_CONTROL = { control_release: {} };
const MSG_EVENT_REQUEST = { connection_id: "1234" };
const MSG_BATTERY_STATE_REQUEST = {};

function Vector(config) {
    var client;

    var behaviorStream;
    const behaviorStreamEmitter = new EventEmitter();
    const eventStreamEmitter = new EventEmitter();

    const init = function () {
        client = Client(config);

        const behaviorStreamFactory = () => {
            return client.BehaviorControl(MSG_RELEASE_CONTROL); // ClientDuplexStream
        };
        behaviorStream = StreamManager(behaviorStreamFactory, function (data, stream) {
            if (data.control_granted_response) {
                behaviorStreamEmitter.emit(EVENT_CONTROL_GRANTED_RESPONSE);
            }
        });
        const eventStreamFactory = () => {
            return client.EventStream(MSG_EVENT_REQUEST);
        };
        StreamManager(eventStreamFactory, function (data, stream) {
            const eventWrapper = data.event;
            const eventType = eventWrapper.event_type;
            const event = eventWrapper[eventType];
            eventStreamEmitter.emit(eventType, event);
        });
    };

    function addEventListener(eventType, listener) {
        eventStreamEmitter.on(eventType, listener);
    }

    function requestControl() {
        return new Promise(function (resolve) {
            behaviorStream.stream.write(MSG_REQUEST_CONTROL);
            behaviorStreamEmitter.once(EVENT_CONTROL_GRANTED_RESPONSE, () => {
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

    function getBatteryState() {
        return new Promise(function (resolve) {
            client.BatteryState(MSG_BATTERY_STATE_REQUEST, (error, response) => {
                resolve(response);
            });
        });
    }

    return {
        init,
        sayText,
        addEventListener,
        getBatteryState,
    };
}

module.exports = Vector;
