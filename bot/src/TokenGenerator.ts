// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { tokenExchangeOperationName } from "botbuilder-core";

export class TokenGenerator {
    constructor() {
    }

    public async handle(res, webChatSecret : string) {
            const response = await fetch('https://directline.botframework.com/v3/directline/tokens/generate', 
                { method: 'POST', headers: { 'Authorization' : `Bearer ${webChatSecret}` } });

            const raw = await response.json() as JSON;
            var body =Buffer.from(JSON.stringify(raw), 'utf8');
            res.writeHead(200, {
                'Content-Length': Buffer.byteLength(body),
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
                });
                res.write(body);
                res.end();
    }

}
