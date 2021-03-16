import {SemVer} from "../sem.ver";
import {config} from "../config";

export type Package = { Name: string; Version: SemVer; }

export abstract class Feed<TPackage extends Package = Package> {

    private interval: NodeJS.Timeout;
    private updateLock: boolean = false;
    // protected repositoryHost: string;
    // protected repositoryPath: string;

    public Packages: {
        [key: string]: TPackage[]
    } = {};

    constructor(protected host: string,
                protected feed: string,
                protected token) {
        this.interval = setInterval(() => this.Update(), 60000);
        this.Update();
    }

    public init$: Promise<void> & { resolve } = (() => {
        let resolve;
        const promise: any = new Promise(res => resolve = res);
        promise.resolve = resolve;
        return promise;
    })();


    public async Listen(key: RegExp, listener: (name, version) => void) {
        await this.init$;
        this.Listeners.push({key, listener});
    }


    private cleanLock = false;

    public async Clean(rules: { versions, count }[]) {
        if (this.cleanLock)
            return;
        this.cleanLock = true;
        for (const [name, values] of Object.entries(this.Packages)) {
            const toRemove: TPackage[] = [];
            for (let rule of rules) {
                const regex = new RegExp(rule.versions);
                const versions = values
                    .filter(x => regex.test(x.Version.toString()));
                if (versions.length > rule.count)
                    toRemove.push(...versions.slice(0, -rule.count));
            }
            if (toRemove.length == 0)
                continue;
            await this.Remove(name, toRemove);
            for (let version of toRemove) {
                const index = values.indexOf(version);
                values.splice(index, 1);
            }
        }
        this.cleanLock = false;
    }

    protected abstract async Remove(name: string, packages: TPackage[]);


    private Listeners: { key: RegExp, listener: ((name, version) => void) }[] = [];

    protected OnUpdate(name, version) {
        console.log('add', name, version.toString());
        this.Listeners
            .filter(listener => listener.key.test(name))
            .forEach(listener => listener.listener(name, version));
    }

    private async Update() {
        if (this.updateLock)
            return;
        this.updateLock = true;
        await this.LoadPackages();
        this.init$.resolve();
        this.updateLock = false;
        this.Clean(config.cleaner.rules)
    }

    protected abstract async LoadPackages();


    protected LoadPackage(pkg: TPackage) {
        if (!this.Packages[pkg.Name]) this.Packages[pkg.Name] = [];
        if (!this.Packages[pkg.Name].some(x => pkg.Version.Equals(x.Version))) {
            this.Packages[pkg.Name].push(pkg);
            this.OnUpdate(pkg.Name, pkg.Version);
        }
    }
}
