const getLogger = require("../../logging");
const Vector = require("../../vector");

const logger = getLogger(__filename);

// TODO need to handle the close event somehow
module.exports = (RED) => {
    function VectorConnection(config) {
        const node = this;
        RED.nodes.createNode(node, config);
        node.vector = Vector({
            name: config.name,
            ipAddress: config.ipAddress,
            bearerToken: config.bearerToken,
            certificatePath: config.certificatePath,
        });
        setTimeout(() => {
            try {
                node.vector.init();
            } catch (error) {
                logger.error(error);
            }
        }, 500);
    }
    RED.nodes.registerType("vector-connection", VectorConnection);
};

// NODE_TLS_REJECT_UNAUTHORIZED=0 /usr/bin/env node-red
