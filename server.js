const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const express = require('express')
const app = express()
require('dotenv').config()
app.use(express.json());

app.get('/webhooks',  (req, res) => {

    if (
        req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === process.env.VERIFY_TOKEN
    ) {
        res.send(req.query['hub.challenge']);
        console.log('Endpoint verified')
    } else {
        res.sendStatus(400);
    }
});

app.post('/webhooks',  async (req, res) => {
    console.log('Got new message');
    console.log(JSON.stringify(req.body));
    if (
        req.body.entry &&
        req.body.entry[0].changes &&
        req.body.entry[0].changes[0] &&
        req.body.entry[0].changes[0].value.messages &&
        req.body.entry[0].changes[0].value.messages[0]
    ) {
        let phone_number_id =
            req.body.entry[0].changes[0].value.metadata.phone_number_id;
        let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
        let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload
        let result = await fetch(`https://graph.facebook.com/${process.env.Version}/${phone_number_id}/messages`,
            {
                method: "POST",
                body: JSON.stringify({
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": from,
                    "type": "text",
                    "text": {
                        "preview_url": false,
                        "body": msg_body
                    }
                }),

                headers: {
                    Authorization: `Bearer ${process.env["User-Access-Token"]}`,
                    'Content-type': 'application/json'
                }
            });
        let json = await result.json()
        console.log(json);
    }
    res.sendStatus(200);
});
app.get('/', (req, res)=>{
    res.send("HELLO WORLD!!!!!!")
});

app.listen(process.env.PORT);
console.log(`Listening to port ${process.env.PORT}`)
