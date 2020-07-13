import * as path from "path";
import * as fs from "fs";
import {AnsibleRole} from "./ansibleRole";
import * as YAML from 'yaml'

export class AnsibleRoleGroup {
    Roles: AnsibleRole[];
    Name: string;

    constructor(private baseDir) {
        this.ReadRoles();
        this.Name = baseDir.split(path.sep).filter(Boolean).pop();
    }

    private ReadRoles() {
        this.Roles = fs.readdirSync(this.baseDir)
            .map(y => path.join(this.baseDir, y))
            .filter(x => AnsibleRole.isRoleDirectory(x))
            .map(x => new AnsibleRole(x, this))
    }

    Check() {
        const appsFile = fs.readFileSync(path.join(this.baseDir, `apps-${this.Name}.yml`), 'utf8');
        const yamlConfig = YAML.parse(appsFile) as {host, roles: {role}[]}[];
        const yawmlRoles = yamlConfig.flatMap(x => x.roles).map(x => x.role);
        for (let i =0; i < this.Roles.length; i++){
            if (!yawmlRoles.includes(this.Roles[i].FullName)){
                i--;
                this.Roles.splice(i, 1);
            }
        }
    }
}
