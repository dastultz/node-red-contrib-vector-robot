const getLogger = require("../../logging");

const logger = getLogger(__filename);

module.exports = (RED) => {
    function DriveOffCharger(config) {
        const node = this;
        RED.nodes.createNode(node, config);
        node.on("input", onInput);

        const vector = RED.nodes.getNode(config.vector).vector;

        async function onInput(msg, send, done) {
            const response = await vector.driveOffCharger();
            msg.payload = response;
            send(msg);
            done();
        }
    }
    RED.nodes.registerType("drive-off-charger", DriveOffCharger);
};
