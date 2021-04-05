// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityHandler, MessageFactory, ConversationState, UserState } from 'botbuilder';
import { DialogState } from 'botbuilder-dialogs';
import { StatePropertyAccessor } from 'botbuilder-core'
import { QnADialog } from './dialogs/qnaDialog';

export class QnABot extends ActivityHandler {
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

            await this.dialog.run(context, this.dialogState);
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
}
