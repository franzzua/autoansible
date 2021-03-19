import {requestAsync} from "../request";
import {SemVer} from "../sem.ver";
import {Feed, Package} from "./feed";
const npmFetch = require('npm-registry-fetch');

export class NpmFeed extends Feed<Package> {

    protected async LoadPackage(pkg: string): Promise<Package[]> {
        try {
            return await this.GetInfo(pkg);
        }catch (e) {
            console.error(pkg,  `https://${this.host}/npm/${this.feed}`);
            throw e;
        }
    }

    private FeedInfo = requestAsync(this.host, `/api/management/feeds/get/${this.feed}?api_key=${this.token}`)

    public Packages: {
        [key: string]: {
            Packages: Package[];
            Listeners: ((name, version)=>void)[];
            _rev: string;
        }
    };

    async Has(pkg: string, pkgType: string, os?: string): Promise<any> {
        if (pkgType != "npm")
            return false;
        return true;
    }

    protected async Remove(name: string, packages: Package[]): Promise<any> {
        for (let pkg of packages) {
            const resp = await requestAsync(this.host, `/api/json/NpmPackages_DeletePackage`, 'post', {
                'Content-Type': 'application/json'
            }, null, JSON.stringify({
                Feed_Name: 'npm',
                Package_Name: name.split('/').pop(),
                Scope_Name: name.split('/')[0],
                API_Key: this.token,
                Version_Text: pkg.Version.toString()
            }));
        }
        return ;
        const pkg = await this.requestAsync( `/npm/${this.feed}/${name}?write=true`, 'get');
        const latestVer = pkg['dist-tags'].latest
        const toDelete = [];
        for (let pkgToDelete of packages) {
            toDelete.push(pkg.versions[pkgToDelete.Version.toString()])
            delete pkg.versions[pkgToDelete.Version.toString()]
        }
        if (packages.some(x => x.Version.toString() == latestVer)){
            pkg['dist-tags'].latest = Object.keys(pkg.versions)
                .map(x => SemVer.Parse(x))
                .sort(SemVer.compare)
                .pop().toString();
        }
        delete pkg._revisions
        delete pkg._attachments;
        const putURI = `/npm/${this.feed}/${escape(name)}/-rev/${pkg._rev}`;
        await npmFetch(putURI, {
            method: 'put',
            body: pkg,
            ignoreBody: true.valueOf(),
            query: {write: true},
            force: true
        });
        for (let toDel of toDelete) {
            const uri = new URL(toDel.dist.tarball).pathname;
            const {_rev} = await this.requestAsync( `/npm/${this.feed}/${name}?write=true`, 'get');
            await this.requestAsync( `${uri}/-rev/${_rev}`, 'delete');
        }
    }

    private async GetInfo(packageName: string): Promise<Package[]> {
        try {
            const res = await this.requestAsync( `/npm/${this.feed}/${packageName}?write=true`, 'get');
            return Object.keys(res.versions).map(version => ({
                Version: SemVer.Parse(version),
                Name: packageName
            }));
        } catch (e) {
            console.error(`not found https://${this.host}/npm/${this.feed}`);

        }
    }

    private requestAsync(path, method, body = null): Promise<{
        readonly versions: {
            [version: string]: {
                dist: {tarball: string};
                _id;
                version;
                name;
            }
        },
        readonly _rev: string;
        _revisions;
        _attachments;
        'dist-tags': { [tag: string]: string }
    }>{
        return requestAsync(this.host, path, method, {
            accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*'
        }, `api:${this.token}`, body);
    }
}


export type NugetPackage = Package & {

}
