export class SemVer {
    public static compare(a: SemVer, b: SemVer) {
        if (a.Major != b.Major) return a.Major - b.Major;
        if (a.Minor != b.Minor) return a.Minor - b.Minor;
        if (a.Patch != b.Patch) return a.Patch - b.Patch;
        if (a.Build != b.Build) return a.Build - b.Build;
        return 0;
    }

    private constructor(
        public Major,
        public Minor,
        public Patch,
        public Build?
    ) {

    }


    static Parse(version: string): SemVer {
        const [Major, Minor, Patch, Build] = version.split('.');
        return new SemVer(Major, Minor, Patch, Build);
    }

    public Equals = (semVer: SemVer) => {
        return this.toString() == semVer.toString();
    };

    public toString() {
        return [
            this.Major, this.Minor, this.Patch, this.Build
        ].filter(p => p).join('.');
    }

}
