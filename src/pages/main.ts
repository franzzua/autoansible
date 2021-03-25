import {AutoTaskGroup, AutoTaskGroups, HostInfo, Hosts} from "../auto.tasks";
import {SemVer} from "../sem.ver";
import {Feeds} from "../feeds/feeds";
import {Log} from "../log";

export function hostTemplate(pkg, x: HostInfo, group, role, regex: RegExp) {
    if (!pkg) return '';
    const feed = Feeds
        .find(feed => feed.Match(x.packageType, x.os));
    if (!feed?.Packages[pkg]?.Packages?.length)
        return '';
    const versions = feed.Packages[pkg].Packages
        .map(x => x.Version)
        .filter(x => regex.test(x.toString()))
        .filter(x => x.toString() != 'latest')
        .sort(SemVer.compare)
        .reverse();
    const lastResult = Log.LastData.find(Log.Equals({
        host: x.host, group, role
    }));
    const pkgParts = pkg.split(/[\.\/]/);
    const main = pkgParts.pop();
    return `
    <div style="display: flex; justify-content: space-between">
        <div class="name">
            <div style="font-size: .6em">${pkgParts.join('.')}</div>
            <span >${main}</span>
        </div>
        ${versions.length ? `
        <div>
            <select class="version ${lastResult?.result}">
                ${versions.map(version => `
                    <option ${version.toString() == lastResult?.version ? `selected ${lastResult.result}` : ''}>
                        ${version.toString()}
                    </option>`).join('\n')}
            </select>
            <button data-host=${x.host} data-role=${group}-${role} data-pkg=${pkg} onclick="deploy(event.target)"
                    class="deploy"></button>
        </div>
         ` : ''}
   </div>
`
}
type ArrayElement<ArrayType extends readonly unknown[]> =
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export function roleTemplate(x: ArrayElement<AutoTaskGroup["roles"]>, group) {
    return `
    <tr>
        <td>${x.role}</td> 
        ${Hosts
        .map(h => x.hosts.find(x => x.host == h))
        .map(host => {
            const pkg = host.package;
            const regExp = host.regex;
            return `<td>
                ${hostTemplate(pkg, host, group, x.role, regExp)}
            </td>`;
        }).join('\n')}
    </tr>
`;
}

export function groupTemplate(x: AutoTaskGroup) {
    return `
        <tr class="group"><td>${x.group}</td>${Hosts.map(host => `
<td>
    <button data-host=${host} data-role=${x.group}-all onclick="deploy(event.target)"
            class="deploy all"></button>
</td>
`).join('\n')}</tr>
        ${x.roles.map(role => roleTemplate(role, x.group)).join('\n')}
    `
}

export const mainPageHeader = () => {
    function switchAutodeploy(target: HTMLInputElement) {
        const pkg = target.name;
        fetch(`/switch/${pkg}`);
    }

    function deploy(btn: HTMLButtonElement) {
        const td = btn.parentElement;
        const role = btn.dataset.role;
        const host = btn.dataset.host;
        const version = td.querySelector<HTMLSelectElement>(`.version`)?.value ?? '';
        window.open(['', 'deploy', role, host, version].join('/'), '_popup');
    }


    return `
<!DOCTYPE html>
<head>
    <script>
        ${deploy.toString()}
        ${switchAutodeploy.toString()}
    </script>
    <style>
        thead {
            background-color: #3f87a6;
            color: #fff;
            height: 1em;
         }
        tr{
            height: 3em;
        }
        td{
            border-right: solid .1px #3333;
            padding: 0 1em;
        }
        tr.group{
            font-weight: bold;
            background-color: #A668;
            height: 1em;
        }
        tr:nth-child(2n){
            background-color: #4444;
        }
        tbody {
            background-color: #e4f0f5;
        }
        
        caption {
            padding: 10px;
            caption-side: bottom;
        }
        
        table {
            border-collapse: collapse;
            border: 2px solid rgb(200, 200, 200);
            letter-spacing: 1px;
            font-family: sans-serif;
            font-size: .8rem;
        }
        select {
            background: none;
            border: none;
            border-bottom: solid .1px #4444;
            outline: none;
        }
        select:focus, select:hover{
            border-bottom: solid .2px #A44;
        }
        select.success{
            border-bottom: solid 2px #281;
        }
        select.failure{
            border-bottom: solid 2px #811;
        }
        select.waiting{
            border-bottom: solid 2px #881;
        }
        
        .deploy{
            width: .6em; 
            height: 1.2em; 
            clip-path: polygon(0 0, 100% 50%, 0 100%);
            border: none;
            outline: none; 
            background: rgba(120,139,117,0.7); 
            cursor:pointer;
        }
        .deploy.all{
           width: 1.2em; 
           clip-path: polygon(0 0, 40% 40%, 40% 0, 100% 50%, 40% 100%, 40% 60%, 0 100%);
        }
        .deploy:focus, .deploy:hover{
            background: #1a8b19;
        }

</style>
</head>
<table>
    <thead>
        <td width="12%">Role</td>
        ${Hosts.map(host => `<td width="22%">${host}</td>`).join('\n')}
    </thead>
<!--    </tbody>-->
<!--</table>-->
    `;
};

export const mainPageContent = async () => {
    try {
        Log.LastData = await Log.getLatest();
    }catch (e) {
        Log.LastData = [];
    }
    const groupHtml = AutoTaskGroups.map(groupTemplate).join('\n');
    return `<tbody>${groupHtml}</tbody>`;
};
