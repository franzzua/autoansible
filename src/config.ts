import {readFileSync} from "fs";

export const config: {
    log: string;
    feeds: {
        type: 'nuget' | 'docker' | 'npm';
        host: string;
        feed: string;
        os?: string;
        token?: string;
    }[];
    ansible: {
        wsl: boolean;
        rootDir: string;
        playbook: string;
    },
    server: {
        https?: {
            port: number;
            key; cert;
        };
        port: number;
    },
    cleaner: {
        rules: {
            versions: string;
            count: number;
        }[];
    }
} = JSON.parse(readFileSync("autoansible.json", 'utf8'));
