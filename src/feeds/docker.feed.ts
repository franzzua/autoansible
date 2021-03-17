import {requestAsync} from "../request";
import {Feed, Package} from "./feed";
import {SemVer} from "../sem.ver";


export type DockerPackage = Package & {Manifest;};
export class DockerFeed extends Feed<DockerPackage> {
    async Has(pkg: string, pkgType: string, os?: string): Promise<any> {
        if (pkgType != "docker")
            return false;
        return Promise.resolve(undefined);
    }
    private Layers: string[];

    protected async LoadPackage(repo): Promise<DockerPackage[]> {
        try {
            const {tags} = await requestAsync(this.host, `/v2/${repo}/tags/list`);
            return await Promise.all(tags.map(async tag => {
                const manifest = await this.getManifest(repo, tag);
                console.log('new', repo, tag);
                return {
                    Name: repo,
                    Version: SemVer.Parse(tag),
                    Manifest: manifest
                } as DockerPackage;
            }));
        } catch (e) {
            console.error(this.host, `/docker/${this.feed}/Packages?\$format=json`,e);
        }
    }

    protected async Remove(name: string, packages: DockerPackage[]): Promise<any> {

        console.log('delete', name, ...packages.map(x => x.Version.toString()));
        for (let p of packages) {
            await this.deleteDockerTag(p.Name, p.Manifest);
        }
        // все слои из удаляемых пакетов
        const layersToDelete =  [...new Set(packages.flatMap(x => this.getLayers(x.Manifest)))];
        // неудаляемые пакеты
        const notDeletePackages = this.Packages[name].Packages.filter(x => !packages.includes(x));
        // слои которые нужно оставить
        const notDeleteLayers =  new Set(notDeletePackages.flatMap(x => this.getLayers(x.Manifest)));
        // слои которые нужно удалить - все из удаляемых кроме тех что нужно оставить
        const deleteLayers = layersToDelete
            .filter(x => !notDeleteLayers.has(x));

        // console.log(blobsToDelete);
        await deleteLayers.reduce(async (old, blob) => {
            await old;
            await this.deleteBlob(name, blob)
        }, Promise.resolve());

        for (let p of packages) {
            await this.deleteDockerTag(p.Name, p.Manifest);
        }
    }

    private async deleteBlob(repo, blob) {
        try {
            await requestAsync(this.host, `/v2/${repo}/blobs/${blob}`, 'DELETE', {}, `api:${this.token}`);
        } catch (e) {
            console.warn(`unable delete blob ${blob} from ${repo}`, e);
        }
    }

    private async deleteDockerTag(repo, manifest) {
        try {
            const {'docker-content-digest': digest} = manifest._headers;
            await requestAsync(this.host, `/v2/${repo}/manifests/${digest}`, 'DELETE', {}, `api:${this.token}`);
        } catch (e) {
            console.warn(`unable delete ${repo} manifest ${manifest.tag}`);
        }
    }

    private async getManifest(repo, tag) {
        return await requestAsync(this.host, `/v2/${repo}/manifests/${tag.toString()}`, 'GET', {
            Accept: 'application/vnd.docker.distribution.manifest.v2+json'
        });
    }

    private getLayers(manifest) {
        return manifest?.layers?.map(layer => layer.digest) ?? [];
    }


    public async getAllLayers(): Promise<{image,layers}[]> {
        await this.init$;
        const res = [] as {image,layers}[];
        for (let c of Object.values(this.Packages)){
            for (let p of c.Packages){
                if (p.Manifest.layers){
                    res.push({
                        image: `${p.Name}.${p.Version.toString()}}`,
                        layers: p.Manifest.layers.map(x => x.digest.substr('sha256:'.length))
                    });
                }else{
                    res.push({
                        image: `${p.Name}.${p.Version.toString()}}`,
                        layers: p.Manifest.fsLayers.map(x => x.blobSum.substr('sha256:'.length))
                    });
                }
            }
        }
        return res;
    }
}

