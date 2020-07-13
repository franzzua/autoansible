import {config} from "./config";

const store = require('nedb');


class LogDB {
    private db: any;

    constructor() {
        this.db = new store({filename: config.log});
        this.db.loadDatabase();
    }

    public LastData: ILogInfo[];

    public async getLatest(){
        const docs = await this.readAll();
        return docs.reduce((latest, log) => {
            const existed = latest.find(this.Equals(log));
            if (!existed) {
                latest.push(log);
                return latest;
            }
            if (new Date(existed.time) < new Date(log.time)){
                // if (!existed.result){
                //     existed.start = new Date(existed.time);
                //     existed.end = new Date(log.time);
                //     existed.result = log.result;
                //     delete existed.time;
                // }else{
                existed.result = log.result;
                existed.time = log.time;
                existed.version = log.version;
                // }
            }
            return latest;
        }, [] as ILogInfo[]);
    }
    public get({ role, group, host }): Promise<ILogInfo[]> {
        return new Promise(((resolve, reject) => {
            this.db.find({role, group, host }, (err, docs) => {
                if (err) {
                    reject(err);
                }else{
                    resolve(docs);
                }

            });
        }));
    }

    public readAll(): Promise<ILogInfo[]> {
        return new Promise(((resolve, reject) => {
            this.db.find({}, (err, docs) => {
                if (err) {
                    reject(err);
                }else{
                    resolve(docs);
                }

            });
        }));
    }

    public add(data: Omit<ILogInfo, "time">) {
        this.db.insert({
            ...data, time: utc()
        });
    }

    public Equals = (one: ILogInfo) => (two: ILogInfo) =>
        one.group == two.group &&
        one.role == two.role &&
        one.host == two.host;


}

export function utc() {
    const date = new Date();
    return date.toISOString()
}

export const Log = new LogDB();

export interface ILogInfo {
    end?: Date;
    start?: Date;
    group, role, host, version?, result?: 'success' | 'failure', time?: string;
}
