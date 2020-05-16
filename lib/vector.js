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

    function callAsync(call, request) {
        var boundCall = call.bind(client);
        return new Promise(function (resolve) {
            boundCall(request, (error, response) => {
                if (error) {
                    logger.error(error);
                    throw "Vector error " + error;
                }
                resolve(response);
            });
        });
    }

    async function callWithControlAsync(call, request) {
        await requestControl();
        await callAsync(call, request);
    }

    async function sayText(text, options) {
        const request = {
            text: text,
            use_vector_voice: true,
            duration_scalar: "1.0",
            ...options,
        };
        await callWithControlAsync(client.SayText, request);
        releaseControl();
    }

    async function getBatteryState() {
        return await callAsync(client.BatteryState, MSG_BATTERY_STATE_REQUEST);
    }

    async function driveOffCharger() {
        await callWithControlAsync(client.DriveOffCharger, {});
        releaseControl();
    }

    async function driveOnCharger() {
        await callWithControlAsync(client.DriveOnCharger, {});
        releaseControl();
    }

    async function getAnimationTriggers() {
        const response = await callAsync(client.ListAnimationTriggers, {});
        const list = response.animation_trigger_names.map((x) => x.name);
        return list;
    }

    async function playAnimationTrigger(name) {
        const request = {
            animation_trigger: { name },
            loops: 1,
            use_lift_safe: false,
            ignore_body_track: false,
            ignore_head_track: false,
            ignore_lift_track: false,
        };
        await callWithControlAsync(client.PlayAnimationTrigger, request);
        releaseControl();
    }

    return {
        init,
        sayText,
        addEventListener,
        getBatteryState,
        getAnimationTriggers,
        playAnimationTrigger,
        driveOffCharger,
        driveOnCharger,
    };
}

module.exports = Vector;
