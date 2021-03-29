// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityHandler, MessageFactory } from 'botbuilder';

export class EchoBot extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            if( context.activity.text.includes("title")) {
                // If the message contains title, send a message including custom channelData for processing on FrontEnd
                const newTitle = context.activity.text.replace("title", "");
                const replyText = `Change Window Title to: ${ newTitle }`;
                const activity = MessageFactory.text(replyText, replyText);
                // Adding custom data to the activity message for parsing on front end
                activity.channelData = {"event": "titlechange", "text": newTitle };
                await context.sendActivity(activity);
            } else {
                // Standard Echo Bot example
                const replyText = `Echo: ${ context.activity.text }`;
                await context.sendActivity(MessageFactory.text(replyText, replyText));
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome!';
            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}
