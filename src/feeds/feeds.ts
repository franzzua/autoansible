import {config} from "../config";
import {DockerFeed} from "./docker.feed";
import {NugetFeed} from "./nuget.feed";

export const Feeds = config.feeds.map(cfg => {
    switch (cfg.type) {
        case "docker":
            return new DockerFeed(cfg.host, cfg.feed, cfg.token);
        case "nuget":
            return new NugetFeed(cfg.host, cfg.feed, cfg.token);
        default:
            throw new Error(`${cfg.type} not implemented yet`)
    }
});
