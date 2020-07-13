import {Ansible} from "../reader";
import {deploy, deployWithQueue} from "../deploy";

export async function runDeployment(request, response) {
    const [, action, role, hostName, version] = request.url.split('/');
    response.writeHead(200, {
        'Content-type': 'text/html',
        'access-control-allow-origin': '*'
    });
    response.write(`<!DOCTYPE html><style>
.error{color: #862; font-weight: bold;}
.changed{color: #AA4; font-weight: bold;}
.task{color: #444; font-weight: bold;}
.fatal{color: #822; font-weight: bold;}
.ok{color: #481; font-weight: bold;}
.skipping{color: #AAA; font-weight: bold;}
</style>`);
    response.write(`<body>`);
    response.write(`<details><summary><h2>deploying ${role}:${version} to ${hostName}</h2></summary>`);
    const [group, roleName] = role.split('-');
    if (roleName == 'all') {
        const host = Ansible.Hosts.find(x => x.Name == hostName);
        for (let role of Ansible.RoleGroups.find(x => x.Name == group).Roles) {
            const info = host.GetConfig(role);
            await runDeploy({group, os: info.os, role: role.Name, host: hostName, version: version}, response);
        }
    } else {
        const info = Ansible.GetInfo(group, roleName, hostName);
        await runDeploy({group, os: info.os, role: roleName, host: hostName, version: version}, response);
    }
    response.end();
}

const deployQueue = [];

async function runDeploy({group, os, role, host, version}, response) {
    await deployWithQueue({group, os: os, role, host, version: version || 'latest'},
        err => {
            response.write(`<li class="error">${err}</li>`);
            response.write(Buffer.alloc(16384, ' ', 'utf8').toString('utf8'));
        },
        (log: string) => {
            const type = log.toString().split(/[ :]/)[0];
            if (/TASK/.test(type)) {
                response.write(`</details><details open class="log ${type}"><summary>${log}</summary>`);
            } else {
                response.write(`<span class="log ${type}">${log}</span>`);
            }
            response.write(Buffer.alloc(16384, ' ', 'utf8').toString('utf8'));
        });
}
