const getLogger = require("../../logging");

const logger = getLogger(__filename);

module.exports = (RED) => {
    function Animation(config) {
        const node = this;
        RED.nodes.createNode(node, config);
        node.on("input", onInput);

        const vector = RED.nodes.getNode(config.vector).vector;

        async function onInput(msg, send, done) {
            var trigger;
            if (config.animation === "__payload__") trigger = msg.payload;
            else trigger = config.animation;
            await vector.playAnimationTrigger(trigger);
            send(msg);
            done();
        }
    }
    RED.nodes.registerType("animation", Animation);
};
