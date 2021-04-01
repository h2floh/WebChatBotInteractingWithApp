// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityHandler, MessageFactory, ConversationState, UserState } from 'botbuilder';
import { DialogState } from 'botbuilder-dialogs';
import { StatePropertyAccessor } from 'botbuilder-core'
import { QnADialog } from './dialogs/qnaDialog';

export class EchoBot extends ActivityHandler {
    private dialog: QnADialog;
    private conversationState: ConversationState;
    private userState: UserState;
    private dialogState: StatePropertyAccessor<DialogState>;
    /**
     *
     * @param {Dialog} dialog
     */
    constructor(conversationState: ConversationState, userState: UserState, dialog: QnADialog) {
        super();
        if (!conversationState) throw new Error('[Bot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[Bot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[Bot]: Missing parameter. dialog is required');
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {

            if(context.activity.text.startsWith("Q")) {
                // Run the Dialog with the new message Activity.
                context.activity.text = context.activity.text.slice(1);
                await this.dialog.run(context, this.dialogState);
            }
            if(context.activity.text.includes("title")) {
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

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });
    }

    // /**
    //  * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
    //  */
    //      async run(context: TurnContext) {
    //         await super.run(context);
    
    //         // Save any state changes. The load happened during the execution of the Dialog.
    //         await this.conversationState.saveChanges(context, false);
    //         await this.userState.saveChanges(context, false);
    //     }
}
