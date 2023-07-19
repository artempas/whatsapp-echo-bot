const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const express = require('express')
const app = express()
const util = require('util')
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

app.post('/webhooks',   (req, res) => {
    console.log('Got new message');
    console.log(JSON.stringify(req.body));
    const header = {
        Authorization: `Bearer ${process.env["User-Access-Token"]}`,
        'Content-type': 'application/json'
    };
    if (
        req.body.entry &&
        req.body.entry[0].changes &&
        req.body.entry[0].changes[0] &&
        req.body.entry[0].changes[0].value.messages &&
        req.body.entry[0].changes[0].value.messages[0]
    ) {
        let phone_number_id =
            req.body.entry[0].changes[0].value.metadata.phone_number_id;
        let from = process.env['Recipient-Phone-Number'] ?? req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
        let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload
        const url = `https://graph.facebook.com/${process.env.Version}/${phone_number_id}/messages`;
        Promise.all([
                fetch(url, // Send echo message
                    {
                        method: "POST",
                        body: JSON.stringify({
                            "messaging_product": "whatsapp",
                            "recipient_type": "individual",
                            "to": from,
                            "type": "text",
                            "text": {
                                "body": msg_body
                            }
                        }),

                        headers: header
                    }),
                fetch(url, // Send image by url
                    {
                        method: "POST",
                        headers: header,
                        body: JSON.stringify({
                            "messaging_product": "whatsapp",
                            "recipient_type": "individual",
                            "to": from,
                            "type": "image",
                            "image": {
                                link: "https://picsum.photos/1920/1080"
                            }
                        })
                    }),
                fetch(url, // Send document by url
                    {
                        method: "POST",
                        headers: header,
                        body: JSON.stringify({
                            "messaging_product": "whatsapp",
                            "recipient_type": "individual",
                            "to": from,
                            "type": "document",
                            "document": {
                                link: "https://base.mcn.ru/api/public/api/file/download/0b2b4681781c9530c492ec9204f7a0d1.pdf",
                                caption: "Document example"
                            }
                        })
                    }),
                fetch(url, // Send video by url
                    {
                        method: "POST",
                        headers: header,
                        body: JSON.stringify({
                            "messaging_product": "whatsapp",
                            "recipient_type": "individual",
                            "to": from,
                            "type": "video",
                            "video": {
                                link: "https://base.mcn.ru/api/public/api/file/download/ea9c1271f2ef0759663278ed4d2033be.mp4",
                                caption: "Video example"
                            }
                        })
                    }),
                fetch(url, // Send keyboard
                    {
                        method: "POST",
                        headers: header,
                        body: JSON.stringify({
                            "messaging_product": "whatsapp",
                            "recipient_type": "individual",
                            "to": from,
                            "type": "interactive",
                            "interactive": {
                                "type": "button",
                                "body": {
                                    "text": "Text1"
                                },
                                "action": {
                                    "buttons": [
                                        {
                                            "type": "reply",
                                            "reply": {
                                                "id": "2",
                                                "title": "Text2"
                                            }
                                        },
                                        {
                                            "type": "reply",
                                            "reply": {
                                                "id": "3",
                                                "title": "Text 3"
                                            }
                                        }
                                    ]
                                }
                            }
                        })
                    })
            ])
            .then(r => Promise.all(r.map((i)=> i.json()))).then(jsons=>console.log(util.inspect(jsons, {showHidden: false, depth: null, colors: true})))

    }
     res.sendStatus(200);
});
app.get('/', (req, res)=>{
    res.send("HELLO WORLD!!!!!!")
});

app.listen(process.env.PORT);
console.log(`Listening to port ${process.env.PORT}`)
