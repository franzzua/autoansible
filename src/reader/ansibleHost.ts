import * as path from "path";
import * as fs from "fs";
import * as INI from 'ini';
import * as YAML from 'yaml';
import {AnsibleRole} from "./ansibleRole";

type PackageConfig = {
    os?: 'linux' | 'windows';
    regex?: string;
};

export class AnsibleHost {
    Name: string;
    private Config: PackageConfig & {
        [group: string]: PackageConfig & {
            [role: string]: PackageConfig;
        }
    } = {};

    constructor(private file: string, private baseDir) {
        this.Name = path.basename(file, '.ini');
        this.Parse();
        this.ReadRoleConfigs();
    }

    public GetConfig(role: AnsibleRole): PackageConfig {
        return {
            os: 'linux',
            regex: '.*',
            ...this.Config,
            ...this.Config[role.Group.Name],
            ...(this.Config[role.Group.Name] ?? {})[role.Name],
        }
    }

    public get HasLinux() {
        return Boolean(
            this.HostGroups['linux'] && this.HostGroups['linux'].length
        );
    }


    public get HasWindows() {
        return Boolean(
            this.HostGroups['windows'] && this.HostGroups['windows'].length
        );
    }

    public HostGroups: {
        [key: string]: string[]
    } = {};

    private Parse() {
        const content = fs.readFileSync(this.file, 'utf8');
        const config = INI.parse(content);
        for (let key in config) {
            const [group, isChildren] = key.split(':');
            if (isChildren == 'vars') {
                continue;
            }
            this.HostGroups[group] = Object.keys(config[key]);
        }
    }


    private ReadRoleConfigs() {
        const config = path.join(this.baseDir, 'group_vars', this.Name, 'packages.yml');
        if (fs.existsSync(config)) {
            const content = fs.readFileSync(config, 'utf8');
            this.Config = YAML.parse(content);
        }
    }
}
