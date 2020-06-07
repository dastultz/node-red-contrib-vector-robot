const getLogger = require("../../logging");

const logger = getLogger(__filename);

module.exports = (RED) => {
    function OverrideBehavior(config) {
        const node = this;
        RED.nodes.createNode(node, config);
        node.on("input", onInput);

        const vector = RED.nodes.getNode(config.vector).vector;

        async function onInput(msg, send, done) {
            await vector.overrideBehavior();
            send(msg);
            done();
        }
    }
    RED.nodes.registerType("override", OverrideBehavior);
};
