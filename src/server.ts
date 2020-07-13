import * as http2 from "http2";
import * as http from "http";
import {readFileSync} from "fs";
import {config} from "./config";
import {Handlers} from "./handlers";


export function runServer() {
    if (config.server.https){
        const http2SecureServer = http2.createSecureServer({
            key: readFileSync(config.server.https.key),
            cert: readFileSync(config.server.https.cert),
            settings: {
                maxFrameSize: 16384
            }
        });
        http2SecureServer.on('request', onRequest);
        http2SecureServer.listen(config.server.https.port);
        console.log(`Server running on ${config.server.https.port}`);
    }
    const server = http.createServer();
    server.on('request', onRequest);
    server.listen(config.server.port);
    console.log(`Server running on ${config.server.port}`);
}

async function onRequest(req, response) {
    const [, action] = req.url.split('/');
    await Handlers[action || 'main'](req, response);
}
