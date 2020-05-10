const getLogger = require("../../logging");

const logger = getLogger(__filename);

module.exports = (RED) => {
    function Events(config) {
        const node = this;
        RED.nodes.createNode(node, config);

        const vector = RED.nodes.getNode(config.vector).vector;

        function emitEvent(event) {
            node.send({ payload: event });
        }
        vector.addEventListener("robot_state", emitEvent);
    }
    RED.nodes.registerType("events", Events);
};
