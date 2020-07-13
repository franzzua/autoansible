import {SemVer} from "./sem.ver";
import {AnsibleConfig} from "./reader/ansible.reader";
import {config as c} from "./config";
import {Ansible} from "./reader";


export const Hosts =Ansible.Hosts.map(x => x.Name);

export const AutoTaskGroups: {
    group: string;
    roles: {
        role: string;
        hosts: {
            host: string;
            os: string;
            package: string;
            regex: RegExp
        }[];
    }[]
}[] = Ansible.RoleGroups.map(gr => ({
    group: gr.Name,
    roles: gr.Roles.map(role => ({
        role: role.Name,
        hosts: Ansible.Hosts.map(host => {
            const config = host.GetConfig(role);
            return ({
                host: host.Name,
                os: config.os,
                package: role.Packages[config.os],
                regex: new RegExp(config.regex)
            });
        })
    }))
}));

export interface ITaskTemplate {
    os, group, role, host, pkg, enabled, version: RegExp
}
export interface ITask {
    os, group, role, host, version: SemVer
}

export const AutoTasks: ITaskTemplate[] = AutoTaskGroups.flatMap(group =>
    group.roles.flatMap(role => role.hosts.map(host => ({
        host: host.host,
        version: host.regex,
        enabled: 1,
        pkg: host.package,
        role: role.role,
        os: host.os,
        group: group.group
    }))));
