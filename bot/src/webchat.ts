// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import {readFile} from 'fs';
import * as Eta from 'eta';
import * as fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

export class WebChat {
    constructor() {
    }

    public handle_react_code_in_html(req, res, webChatSecret : string) {
        this.handle(req, res, webChatSecret, '/../static/index.html');
    }

    public handle_react_compiled_in_html(req, res, webChatSecret : string) {
        this.handle(req, res, webChatSecret, '/../static/webchat_react_entry.html');
    }

    private handle(req, res, webChatSecret : string, file: string) {
        readFile(__dirname + file, async function(err, html) {
            if (err) {
                throw err; 
            }     
            const response = await fetch('https://directline.botframework.com/v3/directline/tokens/generate', 
                { method: 'POST', headers: { 'Authorization' : `Bearer ${webChatSecret}` } });
            const token = await response.json();
            const renderResult = await Eta.render(html.toString(), { token: token.token, userID: uuidv4() });

            var body = Buffer.from(String(renderResult), 'utf8');
            res.writeHead(200, {
                'Content-Length': Buffer.byteLength(body),
                'Content-Type': 'text/html'
                });
                res.write(body);
                res.end();
            
        });
    }
}
