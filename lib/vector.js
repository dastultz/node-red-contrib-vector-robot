const getLogger = require("./logging");
const utils = require("./utils");
const Client = require("./client");
const StreamManager = require("./stream-manager");
const ShutdownManager = require("./shutdown-manager");
const EventEmitter = require("events");

const logger = getLogger(__filename);

const ControlRequestPriority = {
    UNKNOWN: 0,
    OVERRIDE_BEHAVIORS: 10,
    DEFAULT: 20,
    RESERVE_CONTROL: 30,
};

const EVENT_CONTROL_GRANTED_RESPONSE = "EVENT_CONTROL_GRANTED_RESPONSE";
const MSG_RELEASE_CONTROL = { control_release: {} };
const MSG_EVENT_REQUEST = { connection_id: Date.now().toString() };
const MSG_BATTERY_STATE_REQUEST = {};
const CONTROL_REQUEST_TIMEOUT = 1000;
const DEFAULT_TIMEOUT = 5000;

function Vector(config) {
    var client;

    var behaviorStream;
    const behaviorStreamEmitter = new EventEmitter();
    const eventStreamEmitter = new EventEmitter();

    var hasControl = false;
    var overridingBehavior = false;
    var callInProgress = false;
    var lastControlReleaseRequest = 0;

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
        ShutdownManager.registerForShutdown(shutDown);
    };

    const shutDown = function () {
        releaseControl();
    };

    function addEventListener(eventType, listener) {
        eventStreamEmitter.on(eventType, listener);
    }

    function removeEventListener(eventType, listener) {
        eventStreamEmitter.removeListener(eventType, listener);
    }

    function manageControl() {
        if (overridingBehavior) return;
        if (!hasControl || callInProgress) return;
        if (Date.now() - lastControlReleaseRequest > 250) {
            releaseControl();
        } else {
            setTimeout(manageControl, 250);
        }
    }

    function releaseControl() {
        behaviorStream.stream.write(MSG_RELEASE_CONTROL);
        hasControl = false;
        overridingBehavior = false;
    }

    function requestControl(controlRequestPriority) {
        if (hasControl) return;
        const promise = new Promise(function (resolve) {
            const request = { control_request: { priority: controlRequestPriority } };
            behaviorStream.stream.write(request);
            behaviorStreamEmitter.once(EVENT_CONTROL_GRANTED_RESPONSE, () => {
                hasControl = true;
                resolve();
            });
        });
        return utils.expiringPromise(CONTROL_REQUEST_TIMEOUT, promise);
    }

    async function overrideBehavior() {
        await requestControl(ControlRequestPriority.OVERRIDE_BEHAVIORS);
        overridingBehavior = true;
    }

    function queueReleaseControl() {
        lastControlReleaseRequest = Date.now();
        manageControl();
    }

    function callAsync(call, request) {
        const promise = new Promise(function (resolve, reject) {
            const boundCall = call.bind(client);
            callInProgress = true;
            boundCall(request, (error, response) => {
                callInProgress = false;
                queueReleaseControl();
                if (error) {
                    reject(error);
                } else {
                    resolve(response);
                }
            });
        });
        return utils.expiringPromise(DEFAULT_TIMEOUT, promise);
    }

    async function callWithControlAsync(call, request) {
        await requestControl(ControlRequestPriority.DEFAULT);
        return callAsync(call, request);
    }

    function sayText(text, options) {
        const request = {
            text: text,
            use_vector_voice: true,
            duration_scalar: "1.0",
            ...options,
        };
        return callWithControlAsync(client.SayText, request);
    }

    function getBatteryState() {
        return callAsync(client.BatteryState, MSG_BATTERY_STATE_REQUEST);
    }

    function driveOffCharger() {
        return callWithControlAsync(client.DriveOffCharger, {});
    }

    function driveOnCharger() {
        return callWithControlAsync(client.DriveOnCharger, {});
    }

    async function getAnimationTriggers() {
        const response = await callAsync(client.ListAnimationTriggers, {});
        const list = response.animation_trigger_names.map((x) => x.name);
        return list;
    }

    function playAnimationTrigger(name) {
        const request = {
            animation_trigger: { name },
            loops: 1,
            use_lift_safe: false,
            ignore_body_track: false,
            ignore_head_track: false,
            ignore_lift_track: false,
        };
        return callWithControlAsync(client.PlayAnimationTrigger, request);
    }

    function setFaceColor(red, green, blue, durationSeconds) {
        // RBG values between 0.0 and 1.0
        const R = Math.trunc(red * 31);
        const G = Math.trunc(green * 63);
        const B = Math.trunc(blue * 31);
        const RGB = (R << 11) | (G << 6) | B;
        const bigEndian = RGB >> 8;
        const littleEndian = RGB & 255;
        const imageData = Array(35328);
        for (let i = 0; i < 35327; i += 2) {
            imageData[i] = bigEndian;
            imageData[i + 1] = littleEndian;
        }
        const request = {
            face_data: imageData,
            duration_ms: Math.trunc(1000 * durationSeconds),
            interrupt_running: true,
        };
        return callAsync(client.DisplayFaceImageRGB, request);
    }

    return {
        init,
        sayText,
        addEventListener,
        removeEventListener,
        getBatteryState,
        getAnimationTriggers,
        playAnimationTrigger,
        driveOffCharger,
        driveOnCharger,
        overrideBehavior,
        releaseControl,
        setFaceColor,
    };
}

module.exports = Vector;
