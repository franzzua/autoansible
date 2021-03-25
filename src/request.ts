import * as https from "https";

export const requestAsync = (hostname, path, method = 'GET', headers = {}, auth = undefined, body = null) => new Promise<any>((resolve, reject) => {
    const options = {
        method, auth, path, hostname,
        headers: {
            'Accept': 'application/json',
            ...headers
        }
    };
    try {
        const req = https.request(options, res => {
            if (res.statusCode < 300) {
                let textData = '';
                res.on('data', data => textData += data);
                res.on('end', (data) => resolve({
                    ...(textData ? JSON.parse(textData) : {}),
                    _headers: res.headers,
                    statusCode: res.statusCode
                }));
            } else {
                res.on('data', data => reject(data.toString()));
                res.on('end', (data) => {
                    reject(res.statusCode);
                });
            }
        });
        if (body)
            req.write(body);
        req.end()
    }catch (e) {
        console.error(e);
        reject(options);
    }
});
