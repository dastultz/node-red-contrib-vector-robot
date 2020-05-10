const grpc = require("grpc");
const path = require("path");
const fs = require("fs");
const protoLoader = require("@grpc/proto-loader");

/*
The Client encapsulates the low-level gRPC stuff
*/
function Client(config) {
    const { name, ipAddress, bearerToken, certificatePath } = config;
    const proto = grpc.loadPackageDefinition(
        protoLoader.loadSync(path.join(__dirname, "./protobufs/anki_vector/messaging/external_interface.proto"), {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
            includeDirs: [
                path.join(__dirname, "../node_modules/google-proto-files"),
                path.join(__dirname, "protobufs"),
            ],
        })
    );

    const metadata = new grpc.Metadata();
    metadata.add("authorization", `Bearer ${bearerToken}`);
    const headerCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => callback(null, metadata));
    if (!fs.existsSync(certificatePath)) {
        logger.error("Missing Vector certificate file.");
        throw "Missing Vector certificate file";
    }
    const sslCreds = grpc.credentials.createSsl(fs.readFileSync(certificatePath));
    const credentials = grpc.credentials.combineChannelCredentials(sslCreds, headerCreds);
    // TODO somewhere in here, deal with "failed to connect to all addresses"
    const client = new proto.Anki.Vector.external_interface.ExternalInterface(ipAddress, credentials, {
        "grpc.ssl_target_name_override": name,
        //interceptors: [LoggerInterceptor],
    });
    return client;
}

module.exports = Client;
