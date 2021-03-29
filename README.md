# WebChat interaction with WebView2

This examples shows how WebChat of Bot Framework can be used to callback to
a host application which is using WebView2 to display the WebChat.

## Bot

The bot is written in Typescript and also is hosting the WebChat.

`bot/src/bot.ts` adding an echo option to echo custom event data for client side processing

```typescript
if( context.activity.text.includes("title")) {
                // If the message contains title, send a message including custom channelData for processing on FrontEnd
                const newTitle = context.activity.text.replace("title", "");
                const replyText = `Change Window Title to: ${ newTitle }`;
                const activity = MessageFactory.text(replyText, replyText);
                // Adding custom data to the activity message for parsing on front end
                activity.channelData = {"event": "titlechange", "text": newTitle };
                await context.sendActivity(activity);
```

## Server Side WebChat

`bot/src/webchat.ts` renders the [webchat html page](bot/static/index.html). Important here is that the directline token will be
generated on the server so that the WebChatSecret does not get exposed.

```typescript
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
```

## ClientSide WebChat

`bot/static/index.html` callback to host via browser specific callbacks

```typescript
        function sendMessageToHost(title) {
            console.log('sendTitleEvent ' + title);
            try {
              // WebView2 -- https://github.com/MicrosoftEdge/WebView2Samples/blob/master/SampleApps/WebView2APISample/README.md#8-scenariowebmessagecpp-and-scenariowebmessagehtml
              window.chrome.webview.postMessage('SetTitleText ' + title);
            } catch {}
            try {
              // WebView -- https://github.com/MicrosoftDocs/WindowsCommunityToolkitDocs/blob/master/docs/controls/wpf-winforms/WebView.md#interact-with-web-view-content
              // https://docs.microsoft.com/en-us/uwp/api/windows.web.ui.interop.webviewcontrol.scriptnotify?view=winrt-19041
              window.external.notify('SetTitleText ' + title);
            } catch {}
        };
```

`bot/static/index.html` using activityMiddleware of WebChat to react on custom event data

```typescript
        const activityMiddleware = () => next => (...setupArgs) => {
          const [card] = setupArgs
          if (card.activity.from.role === 'bot') {
            // process Event
            if (card.activity.channelData != null
                && card.activity.channelData.event != null
                && card.activity.channelData.event === 'titlechange') {          
                  if (processedEvents.indexOf(card.activity.id) === -1) {
                    sendTitleEvent(card.activity.channelData.text);
                    processedEvents.push(card.activity.id);
                  }
            }

            return (...renderArgs) => (
              <BotActivityDecorator activityID={card.activity.id} key={card.activity.id}>
                {next(card)(...renderArgs)}
              </BotActivityDecorator>
            );
          } 
          else {
            return next(card);
          }
        };

        window.ReactDOM.render(
          <ReactWebChat directLine={window.WebChat.createDirectLine({ token: '<%= it.token %>' })} 
                        userID='<%= it.userID %>' 
                        store={store} 
                        toastMiddleware={toastMiddleware}
                        activityMiddleware={activityMiddleware} />,
          document.getElementById('webchat')
        );
```

## App WebView2

`app/WebView2APISample\ScenarioWebMessage.cpp` change Application title if message starts with 'SetTiltleText '.
Part of the [standard example](https://github.com/MicrosoftEdge/WebView2Samples/blob/master/SampleApps/WebView2APISample/README.md#8-scenariowebmessagecpp-and-scenariowebmessagehtml)

```cpp
        wil::unique_cotaskmem_string messageRaw;
        CHECK_FAILURE(args->TryGetWebMessageAsString(&messageRaw));
        std::wstring message = messageRaw.get();

        if (message.compare(0, 13, L"SetTitleText ") == 0)
        {
            m_appWindow->SetTitleText(message.substr(13).c_str());
        }
```

## Demo

![WebChatWebView2InteractionDemo](media/webview2_demo.gif)
