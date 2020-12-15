import {requestAsync} from "../request";
import {SemVer} from "../sem.ver";
import {Feed, Package} from "./feed";

export class NugetFeed extends Feed<NugetPackage> {

    protected async LoadPackages() {
        try {
            const packagesResult: any = await requestAsync(this.host, `/nuget/${this.feed}/Packages?\$format=json`);
            const packages = packagesResult.d.results.map(({Id, Version}) => ({Id, Version}));
            packages
                .map(pkg => ({Name: pkg.Id, Version: SemVer.Parse(pkg.Version)} as NugetPackage))
                .forEach(pkg => this.LoadPackage(pkg));
        } catch (e) {
            console.error(this.host, `/nuget/${this.feed}/Packages?\$format=json`, e);
        }
    }

    protected async Remove(name: string, packages: NugetPackage[]): Promise<any> {
        for (let p of packages) {
            try {
                await requestAsync(this.host, `/nuget/${this.feed}/package/${name}/${p.Version.toString()}`, 'DELETE', {}, `api:${this.token}`);
                console.log('remove', name, p.Version.toString());
            } catch (e) {
                console.warn('remove', name, p.Version.toString(), 'failed');
            } finally {
            }
        }
    }
}


export type NugetPackage = Package & {}
