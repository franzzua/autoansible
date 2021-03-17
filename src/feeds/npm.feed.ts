import {requestAsync} from "../request";
import {SemVer} from "../sem.ver";
import {Feed, Package} from "./feed";
import * as packageJson  from "package-json";

export class NpmFeed extends Feed<NugetPackage> {

    protected async LoadPackage(pkg: string): Promise<Package[]> {
        try {
            const res = await packageJson(pkg, {
                allVersions: true,
                registryUrl: `https://${this.host}/npm/${this.feed}/`,
            });
            return Object.keys(res.versions).map(version => ({
                Version: SemVer.Parse(version),
                Name: pkg
            }));
        }catch (e) {
            console.error(pkg,  `https://${this.host}/npm/${this.feed}`);
            throw e;
        }
    }


    async Has(pkg: string, pkgType: string, os?: string): Promise<any> {
        if (pkgType != "npm")
            return false;
        return true;
    }

    protected async Remove(name: string, packages: NugetPackage[]): Promise<any> {
        for (let p of packages) {
        }
    }
}


export type NugetPackage = Package & {

}
