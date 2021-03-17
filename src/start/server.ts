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

async function findFeed(autoTask){
    for (let feed of Feeds){
        if (await feed.Has(autoTask.package, autoTask.packageType, autoTask.os))
            return feed;
    }
}

async function listen() {
    for (let autoTask of AutoTasks) {
        const feed = await findFeed(autoTask);
        await feed.ListenPackage(autoTask.package, (name, version) => {
            deployWithQueue({
                ...autoTask,
                version
            });
        });
    }
}

// getAllLayers();

listen();

runServer();
