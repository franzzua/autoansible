import * as path from "path";
import * as fs from "fs";
import * as YAML from "yaml";
import {AnsibleRoleGroup} from "./ansibleRoleGroup";

export class AnsibleRole {
    public readonly Name: string;
    Package: {
        Name: string;
        Type: string;
    };
    FullName: string;

    constructor(private rootDir, public readonly Group: AnsibleRoleGroup) {
        this.FullName = this.rootDir.split(path.sep).pop();
        const [group, name] = this.FullName.split('-');
        if (name == undefined) {
            this.Name = group;
        } else {
            this.Name = name;
        }
        this.ReadVars();
    }

    private ReadVars() {
        this.Package = this.ReadPackage('common.yml');
    }

    private ReadPackage(file) {
        const filePath = path.join(this.rootDir, 'vars', file);
        if (fs.existsSync(filePath)) {
            const linuxFile = fs.readFileSync(filePath, 'utf8');
            const config = YAML.parse(linuxFile);
            return {
                Name: config.package,
                Type: config['package_type']
            };
        }
        console.error(`could not read package from role ${this.FullName}`)
        return undefined;
    }

    static isRoleDirectory(path: string) {
        return fs.statSync(path).isDirectory() &&
            fs.readdirSync(path).includes('tasks');
    }

    public toString() {
        return `${this.Group}\t${this.Name}`
    }
}
