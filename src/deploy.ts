import {spawn,exec, execSync} from "child_process";
import {ITask} from "./auto.tasks";
import {config} from "./config";
import {resolve} from "path";


function getCommand(task: ITask) {
    const command = [
        'ansible-playbook',
        `apps-${task.group}.yml`,
        '-t', `${task.group}-${task.role}`,
        '-l', task.os,
        '-i', `inv/${task.host}.ini`,
        '-vv'
    ];
    const extraVars = {
        host: task.host
    };
    if (task.version && task.version.toString() !== 'latest'){
        extraVars['package_version'] = task.version.toString();
    }
    command.push(
        `--extra-vars`, `'${JSON.stringify(extraVars)}'`
    );
    if (config.ansible.wsl) {
        command.unshift('wsl');
    }
    return command;
};

export function deployInline(task: ITask) {
    const  command = getCommand(task);
    execSync(command.join(' '), {
        cwd: config.ansible.rootDir || resolve('./'),
        stdio: 'inherit'
    });
}


const deployQueue = [];

export async function deployWithQueue(task: ITask,
                                      onErr = (c) => console.error(c.toString()),
                                      onData = (a) => console.log(a.toString())) {
    while (deployQueue.length) {
        await Promise.all(deployQueue);
    }
    const promise = deploy(task, onErr, onData);
    deployQueue.push(promise);
    await promise;
    const index = deployQueue.indexOf(promise);
    deployQueue.splice(index, 1);
}

export function deploy(task: ITask,
                       onErr = (c) => console.error(c.toString()),
                       onData = (a) => console.log(a.toString())) {
    onData(`
    Start deployment ${task.role}@${task.version?.toString()} to ${task.host}
    `);
    process.chdir(config.ansible.rootDir || resolve('./'));
    const  command = getCommand(task);
    onData(`running ${command.join(' ')}`);
    const child = exec(command.join(' '));

    child.stdout.on('data', (data) => {
        onData(data);
    });

    child.stderr.on('data', (data) => {
        onErr(data);
    });

    return new Promise(resolve => {
        child.on('close', (code) => {
            resolve();
        })
    })
}
