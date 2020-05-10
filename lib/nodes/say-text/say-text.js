const getLogger = require("../../logging");

const logger = getLogger(__filename);

module.exports = (RED) => {
    function SayText(config) {
        const node = this;
        RED.nodes.createNode(node, config);
        node.on("input", onInput);

        const vector = RED.nodes.getNode(config.vector).vector;

        async function onInput(msg, send, done) {
            await vector.sayText(msg.payload);
            send(msg);
            done();
        }
    }
    RED.nodes.registerType("say-text", SayText);
};
