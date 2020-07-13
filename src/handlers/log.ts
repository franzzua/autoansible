import {ServerResponse} from "http"
import {Log} from "../log";

export async function log(request, response: ServerResponse) {
    const [, action, groupRole, host, version, result] = request.url.split('/');
    const [group, role] = groupRole.split('-');
    Log.add({group, role, host, version, result});
    response.writeHead(204);
    response.end();
}

