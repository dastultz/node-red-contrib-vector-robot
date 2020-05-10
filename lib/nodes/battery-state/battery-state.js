const getLogger = require("../../logging");

const logger = getLogger(__filename);

module.exports = (RED) => {
    function BatteryState(config) {
        const node = this;
        RED.nodes.createNode(node, config);
        node.on("input", onInput);

        const vector = RED.nodes.getNode(config.vector).vector;

        async function onInput(msg, send, done) {
            const state = await vector.getBatteryState();
            msg.payload = state;
            send(msg);
            done();
        }
    }
    RED.nodes.registerType("battery-state", BatteryState);
};
