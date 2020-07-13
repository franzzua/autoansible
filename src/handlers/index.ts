import {runDeployment} from "./deploy";
import { mainPageContent, mainPageHeader} from "../pages/main";
import {upgrade} from "./upgrade";
import {log} from "./log";
import {ServerResponse} from "http";

export const Handlers: {
    [key: string]: (request, response) => Promise<void>
} = {
    main: (async (request, response: ServerResponse) => {
        response.write(mainPageHeader());
        const content = await mainPageContent();
        response.write(content);
        response.end();
        // response.write(Buffer.alloc(16384, ' ', 'utf8').toString('utf8'));
        // const intervalId = setInterval(async ()=>{
        //     const newContent = await mainPageContent();
        //     if (newContent !== content) {
        //         response.write(newContent);
        //         response.write(`<script>
        //             document.querySelector('tbody').remove()
        //             document.querySelector('table>script').remove()
        //             </script>`);
        //         response.write(Buffer.alloc(16384, ' ', 'utf8').toString('utf8'));
        //     }
        // }, 1000);
        // response.on('close', () => {
        //     console.log('clear');
        //     clearInterval(intervalId)
        // });
    }),
    ['favicon.ico']: (async (request, response) => {
        response.end();
    }),
    deploy: runDeployment,
    upgrade, log,
};

