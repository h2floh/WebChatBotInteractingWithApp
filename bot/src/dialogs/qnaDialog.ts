// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { 
    QnAMakerDialog
} from 'botbuilder-ai';
import {
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { 
    MessageFactory,
    StatePropertyAccessor,
    TurnContext
} from 'botbuilder';

const INITIAL_DIALOG = 'initial-dialog';
const ROOT_DIALOG = 'root-dialog';
const QNAMAKER_BASE_DIALOG = 'qnamaker-base-dialog';

/**
 * Creates QnAMakerDialog instance with provided configuraton values.
 */
function createQnAMakerDialog (knowledgeBaseId: string, endpointKey: string, endpointHostName: string, defaultAnswer: string) {
    let noAnswerActivity;
    if (typeof defaultAnswer === 'string') {
        noAnswerActivity = MessageFactory.text(defaultAnswer);
    }

    const qnaMakerDialog = new QnAMakerDialog(knowledgeBaseId, endpointKey, endpointHostName, noAnswerActivity);
    qnaMakerDialog.id = QNAMAKER_BASE_DIALOG;

    return qnaMakerDialog;
}

export class QnADialog extends ComponentDialog {
    /**
     * QnA dialog for this bot. Creates a QnAMakerDialog.
     * @param {string} knowledgeBaseId Knowledge Base ID of the QnA Maker instance.
     * @param {string} endpointKey Endpoint key needed to query QnA Maker.
     * @param {string} endpointHostName Host name of the QnA Maker instance.
     * @param {string} defaultAnswer (optional) Text used to create a fallback response when QnA Maker doesn't have an answer for a question.
     */
    constructor(knowledgeBaseId: string, endpointKey: string, endpointHostName: string, defaultAnswer: string) {
        super(ROOT_DIALOG);
        // Initial waterfall dialog.
        this.addDialog(new WaterfallDialog(INITIAL_DIALOG, [
            this.startInitialDialog.bind(this)
        ]));

        this.addDialog(createQnAMakerDialog(knowledgeBaseId, endpointKey, endpointHostName, defaultAnswer));
        this.initialDialogId = INITIAL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    public async run(turnContext: TurnContext, accessor: StatePropertyAccessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    // This is the first step of the WaterfallDialog.
    // It kicks off the dialog with the QnA Maker with provided options.
    private async startInitialDialog(stepContext: WaterfallStepContext) {
        return await stepContext.beginDialog(QNAMAKER_BASE_DIALOG);
    }
}
