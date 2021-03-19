import {requestAsync} from "../request";
import {SemVer} from "../sem.ver";
import {Feed, Package} from "./feed";

export class NugetFeed extends Feed<NugetPackage> {
    private PackageLoading$: Promise<NugetPackage[]>;

    protected async LoadPackage(pkg: string): Promise<NugetPackage[]> {
        return (await this.PackageLoading$)
            .filter(x => x.Name == pkg);
    }

    public async Update() {
        this.PackageLoading$ = this.GetPackages();
        await super.Update();
    }

    async Has(pkg: string, pkgType: string, os?: string): Promise<any> {
        if (pkgType != "nuget")
            return false;
        if (os && os != this.os)
            return false;
        return true;
    }

    protected async GetPackages(): Promise<NugetPackage[]> {
        try {
            const packagesResult: any = await requestAsync(this.host, `/nuget/${this.feed}/Packages?\$format=json`);
            const packages = packagesResult.d.results.map(({Id, Version}) => ({Id, Version}));
            return packages
                .map(pkg => ({Name: pkg.Id, Version: SemVer.Parse(pkg.Version)} as NugetPackage))
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
