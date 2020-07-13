import {config as c} from "../config";
import {AnsibleConfig} from "./ansible.reader";
import {resolve} from "path";

export const Ansible = new AnsibleConfig(c.ansible.rootDir || resolve('./'));
