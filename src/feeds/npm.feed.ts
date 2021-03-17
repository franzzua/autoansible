import {requestAsync} from "../request";
import {SemVer} from "../sem.ver";
import {Feed, Package} from "./feed";

export class NpmFeed extends Feed<NugetPackage> {

    protected async LoadPackage(pkg: string): Promise<Package[]> {
        try {
            return await this.GetInfo(pkg);
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

    private async GetInfo(packageName: string): Promise<Package[]> {
        try {
            const res: {
                readonly versions: {
                    [version: string]: {

                    }
                }
            } = await requestAsync(this.host, `/npm/${this.feed}/${packageName}`, 'get', {
                accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*'
            });
            return Object.keys(res.versions).map(version => ({
                Version: SemVer.Parse(version),
                Name: packageName
            }));
        } catch (e) {
            console.error(`not found https://${this.host}/npm/${this.feed}`);

        }
    }
}


export type NugetPackage = Package & {

}
