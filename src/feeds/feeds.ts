import {config} from "../config";
import {DockerFeed} from "./docker.feed";
import {NugetFeed} from "./nuget.feed";
import { NpmFeed } from "./npm.feed";
import {Feed} from "./feed";

export const Feeds: Feed[] = config.feeds.map(cfg => {
    switch (cfg.type) {
        case "docker":
            return new DockerFeed(cfg.host, cfg.feed, cfg.token, cfg.os);
        case "nuget":
            return new NugetFeed(cfg.host, cfg.feed, cfg.token, cfg.os);
        case "npm":
            return new NpmFeed(cfg.host, cfg.feed, cfg.token, cfg.os);
        default:
            throw new Error(`${cfg.type} not implemented yet`)
    }
});
