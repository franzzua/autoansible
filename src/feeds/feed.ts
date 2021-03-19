import {SemVer} from "../sem.ver";
import {config} from "../config";
import {resolveSrv} from "dns";

export type Package = { Name: string; Version: SemVer; }

export abstract class Feed<TPackage extends Package = Package> {

    private interval: NodeJS.Timeout;
    private updateLock: boolean = false;
    // protected repositoryHost: string;
    // protected repositoryPath: string;

    public Packages: {
        [key: string]: { Packages: TPackage[]; Listeners: ((name, version)=>void)[]}
    } = {};

    constructor(protected host: string,
                protected feed: string,
                protected token?: string,
                protected os?: string) {
        this.interval = setInterval(() => this.Update(), 60000);
        this.Update();
    }

    public init$: Promise<void> & { resolve } = (() => {
        let resolve;
        const promise: any = new Promise(res => resolve = res);
        promise.resolve = resolve;
        return promise;
    })();


    public async ListenPackage(pkg: string, listener: (name, version) => void) {
        if (pkg in this.Packages){
            this.Packages[pkg].Listeners.push(listener);
            return;
        }
        const packages = await this.LoadPackage(pkg);
        this.Packages[pkg] = {
            Packages: packages,
            Listeners: [listener]
        };
    }


    private cleanLock = false;

    public async Clean(rules: { versions, count }[]) {
        if (this.cleanLock)
            return;
        console.log('start clean');
        this.cleanLock = true;
        for (const name in this.Packages) {
            const packages = this.Packages[name].Packages;
            const toRemove: TPackage[] = [];
            for (let rule of rules) {
                const regex = new RegExp(rule.versions);
                const versions = packages
                    .sort((a,b) => SemVer.compare(a.Version, b.Version))
                    .filter(x => regex.test(x.Version.toString()));
                if (versions.length > rule.count)
                    toRemove.push(...versions.slice(0, -rule.count));
            }
            if (toRemove.length == 0)
                continue;
            try {
                await this.Remove(name, toRemove);
            }catch (e) {
                console.warn(e);
            }
            this.Packages[name].Packages = await this.LoadPackage(name);
        }
        this.cleanLock = false;
    }

    protected abstract async Remove(name: string, packages: TPackage[]);

    public async Update() {
        if (this.updateLock)
            return;
        this.updateLock = true;
        for (let pkg in this.Packages) {
            const packages = await this.LoadPackage(pkg);
            for (let newPackage of packages) {
                this.TryAdd(newPackage);
            }
            for (let i = 0; i < this.Packages[pkg].Packages.length; i++){
                const oldPackage = this.Packages[pkg].Packages[i];
                if (!packages.some(x => x.Version.Equals(oldPackage.Version))){
                    this.Packages[pkg].Packages.splice(i,1);
                    i--;
                }
            }
        }
        this.init$.resolve();
        this.updateLock = false;
        this.Clean(config.cleaner.rules)
    }

    private TryAdd(newPackage: TPackage){
        const existedVersions = this.Packages[newPackage.Name].Packages.map(x => x.Version);
        if (existedVersions.some(x => x.Equals(newPackage.Version))) {
            return;
        }
        this.Packages[newPackage.Name].Packages.push(newPackage);
        this.OnUpdate(newPackage.Name, newPackage.Version)
    }

    protected OnUpdate(name, version) {
        console.log('add', name, version.toString());
        for (let listener of this.Packages[name].Listeners) {
            listener(name, version);
        }
    }

    protected abstract async LoadPackage(pkg: string): Promise<TPackage[]>;

    public async abstract Has(pkg: string, pkgType: string, os?: string);
}
