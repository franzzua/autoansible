export class SemVer {
    public static compare(a: SemVer, b: SemVer) {
        if (a.Major != b.Major) return a.Major - b.Major;
        if (a.Minor != b.Minor) return a.Minor - b.Minor;
        if (a.Patch != b.Patch) return a.Patch - b.Patch;
        if (!a.Prerelease && b.Prerelease)
            return 1;
        if (a.Prerelease && !b.Prerelease)
            return -1;
        return a.Prerelease - b.Prerelease;
    }

    private constructor(
        public Major,
        public Minor,
        public Patch,
        public Prerelease?
    ) {

    }


    static Parse(version: string): SemVer {
        const [Major, Minor, Patch, Prerelease] = version.split(/[.-]/);
        return new SemVer(Major, Minor, Patch, Prerelease);
    }

    public Equals = (semVer: SemVer) => {
        return this.toString() == semVer.toString();
    };

    public toString() {
        return [
            this.Major, this.Minor, this.Patch
        ].join('.') + (this.Prerelease ? `-${this.Prerelease}` : '');
    }

}
