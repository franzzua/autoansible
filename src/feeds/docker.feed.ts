import {requestAsync} from "../request";
import {Feed, Package} from "./feed";
import {SemVer} from "../sem.ver";


export type DockerPackage = Package & {Manifest;};
export class DockerFeed extends Feed<DockerPackage> {
    private Layers: string[];

    protected async LoadPackages() {
        try {
            const {repositories} = await requestAsync(this.host, `/v2/_catalog`);
            for await (let repo of repositories.filter((x: string) => x.startsWith(this.feed))) {
                const {tags} = await requestAsync(this.host, `/v2/${repo}/tags/list`);
                const existed = this.Packages[repo]?.map(x => x.Version.toString()) ?? [];
                for (let tag of tags) {
                    if (existed.includes(tag))
                        continue;
                    const manifest = await this.getManifest(repo, tag);
                    this.LoadPackage({
                        Name: repo,
                        Version: SemVer.Parse(tag),
                        Manifest: manifest
                    });
                }
            }
        } catch (e) {
            console.error(this.host, `/nuget/${this.feed}/Packages?\$format=json`,e);
        }
    }


    protected async Remove(name: string, packages: DockerPackage[]): Promise<any> {
        for (let p of packages) {
            await this.deleteDockerTag(p.Name, p.Manifest);
        }

        const notDeletePackages = this.Packages[name].filter(x => !packages.includes(x));
        const notDeleteLayers =  new Set(notDeletePackages.flatMap(x => this.getLayers(x.Manifest)));
        const deleteLayers = [...new Set(packages
            .flatMap(x => this.getLayers(x.Manifest))
            .filter(x => !notDeleteLayers.has(x)))];

        // console.log(blobsToDelete);
        await deleteLayers.reduce(async (old, blob) => {
            await old;
            await this.deleteBlob(name, blob)
        }, Promise.resolve());
    }

    private async deleteBlob(repo, blob) {
        try {
            await requestAsync(this.host, `/v2/${repo}/blobs/${blob}`, 'DELETE', {}, `api:${this.token}`);
        } catch (e) {

        }
    }

    private async deleteDockerTag(repo, manifest) {
        try {
            const {'docker-content-digest': digest} = manifest._headers;
            await requestAsync(this.host, `/v2/${repo}/manifests/${digest}`, 'DELETE', {}, `api:${this.token}`);
        } catch (e) {
            console.error(e);
        }
    }

    private async getManifest(repo, tag) {
        return await requestAsync(this.host, `/v2/${repo}/manifests/${tag.toString()}`, 'GET', {
            Accept: 'application/vnd.docker.distribution.manifest.v2+json'
        });
    }

    private getLayers(manifest) {
        return manifest.layers.map(layer => layer.digest);
    }


}

