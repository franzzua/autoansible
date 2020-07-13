#!/usr/bin/env node

import {deployWithQueue} from "../deploy";
import {AutoTasks} from "../auto.tasks";
import {runServer} from "../server";
import {Feeds} from "../feeds/feeds";

function listen() {
    Feeds.forEach(listener => {

        listener.init$.then(() => {

            listener.Listen(/.*/, (name, version) => {
                AutoTasks
                    .filter(cfg => cfg.pkg == name && cfg.version.test(version))
                    .forEach(task => deployWithQueue({
                        ...task,
                        version: version
                    }, () => {}, () => {}));
            });
            //
            // Object.entries(nugetListener.Packages)
            //     .forEach(([name, versions]) => {
            //         const lastVerion = versions.sort(SemVer.compare)[versions.length - 1];
            //         console.log(`${name}@${lastVerion.toString()}`);
            //     });
            console.log('listening...');
        });
    });
}

listen();

runServer();
