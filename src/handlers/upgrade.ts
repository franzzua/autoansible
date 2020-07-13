import {spawn} from "child_process";

export async function upgrade(request, response) {
    response.write(`
<body>
<div>upgrading... wait about two minutes..</div>
<span>120</span>
<script>
let i = 0;
setInterval(() => {
if (i++ < 119)
    document.querySelector('span').innerText = (119 - i)+'sec'; 
else 
    location.pathname = '/'
}, 1000);
</script>
</body>`);
    response.end();
    runUpgrade();
}


function runUpgrade() {
    const ls = spawn(`ansible-playbook`, ['./bootstrap.yml', '-t', 'infr-autodeploy']);
    ls.stderr.on('data', data => console.error(data));
}
