#!/usr/bin/env node

import {deploy, deployInline} from "../deploy";
import {Ansible} from "../reader";
const path = require('path');
const fs = require('fs');

function print_help() {
    console.info('deploy application to server');
    console.log(`usage:
    node deploy # shows this info
    node deploy {group} {role} # shows info about targets for a role
    node deploy {group} {role|all} {target} {version} # deploy specific version of group-role to target
    `);
    for (let g of Ansible.RoleGroups) {
        console.info(`* ${g.Name}:`);
        console.info(`  - ${g.Roles.map(x => x.Name).join(', ')}`);
    }
    const hosts = Ansible.Hosts.map(x => x.Name);
    console.info(`\nhosts:\n${hosts.join(', ')}`);
}


function print_target_help(groupName, roleName) {
    try {
        const group = Ansible.RoleGroups.find(x => x.Name == groupName);
        const role = group.Roles.find(x => x.Name == roleName);
        for (let host of Ansible.Hosts) {
            const config = host.GetConfig(role);
            console.info(`${host.Name}: 
            ${config.os}, ${role.Package.Name}, versions: ${new RegExp(config.regex || '.*')}`);
        }
    } catch (e) {
        console.log(`unknown role ${group}-${role}.`);
        print_help();
    }
}


async function run_deploy(groupName, roleName, hostName, version?) {
    const host = Ansible.Hosts.find(x => x.Name == hostName);
    const group = Ansible.RoleGroups.find(x => x.Name == groupName);
    if (roleName == 'all'){
        for (const role of group.Roles) {
            console.log(`deploy ${role.FullName}`);
            await deployInline({
                host: host.Name,
                version,
                group: group.Name,
                os: host.GetConfig(role).os,
                role: role.Name
            })
        }
    }else {
        const role = group.Roles.find(x => x.Name == roleName);
        if (!role) {
            console.log(`role ${role.Name} not found in ${group.Name}. It has ${group.Roles.length} roles: ${group.Roles.map(x => x.Name)}`);
            return;
        }
        console.log(`deploy ${group.Name}-${role.Name}`);
        await deployInline({
            host: host.Name,
            role: role.Name,
            group: group.Name,
            os: host.GetConfig(role).os,
            version
        })
    }
}


const [group, role, host, version] = process.argv.slice(['node', 'npx'].includes(process.argv0) ? 2 : 1);

if (!group) {
    print_help();
} else if (!host) {
    print_target_help(group, role);
} else {
    run_deploy(group, role, host, version);
}


function get_config(group, role, host) {
    const inventory = fs.readFileSync(path.resolve('./', 'group_vars', host, 'inventory.yml'), 'utf8');

}
