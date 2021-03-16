#!/usr/bin/env node

import {deployWithQueue} from "../deploy";
import {AutoTasks} from "../auto.tasks";
import {runServer} from "../server";
import {Feeds} from "../feeds/feeds";
import {DockerFeed} from "../feeds/docker.feed";
import * as fs from "fs";


async function getAllLayers(){
    const dockerFeeds = Feeds.filter(x => x instanceof DockerFeed) as DockerFeed[];
    const blobs = new Set();
    for (let feed of dockerFeeds){
        await feed.init$;
        const images = await feed.getAllLayers();
        for (let image of images){
            for (let layer of image.layers)
                blobs.add(layer)
        }
    }
    fs.writeFileSync('./blobs.ls', [...blobs].join('\n'), 'utf8');
    console.log(blobs.size, 'writen')

}

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

getAllLayers();

runServer();
