import * as INI from 'ini'
import * as path from "path";
import * as fs from 'fs';
import {AnsibleHost} from "./ansibleHost";
import {AnsibleRoleGroup} from "./ansibleRoleGroup";
import {AnsibleRole} from "./ansibleRole";

export class AnsibleConfig {
    RoleGroups: AnsibleRoleGroup[];
    Hosts: AnsibleHost[];

    constructor(private baseDir) {
        this.ReadRoles();
        this.ReadHosts();
    }

    private ReadHosts() {
        this.Hosts = fs.readdirSync(path.join(this.baseDir, 'inv'))
            .map(x => path.join(this.baseDir, 'inv', x))
            .map(x => new AnsibleHost(x, this.baseDir))
    }

    private ReadRoles() {
        const file = fs.readFileSync(path.join(this.baseDir, 'ansible.cfg'), 'utf8');
        const config = INI.parse(file);
        const rolesPaths = config.defaults.roles_path.split(':');
        this.RoleGroups = rolesPaths
            .map(x => path.join(this.baseDir, x))
            .map(x => new AnsibleRoleGroup(x));
    }

    public GetInfo(groupName: string, roleName: string, hostName: any) {
        const group = this.RoleGroups.find(x => x.Name == groupName);
        const host = this.Hosts.find(x => x.Name == hostName);
        const role = group.Roles.find(x => x.Name == roleName);
        const info = host.GetConfig(role);
        return {
            ...info,
            package: role.Package.Name
        };
    }
}

