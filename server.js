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

function parse_user(change){
    return {
        id: change.value.metadata.phone_number_id,
        name: change.contacts[0].profile.name,
        phone_number: change.contacts[0].wa_id
    }
}

async function id_to_url(id) {
    let response = await fetch(`https://graph.facebook.com/${process.env.Version}/${id}`)
    return await response.json().url;
}

function parse_message(message){
    let result={
        text: '',
        callback_data: undefined,
        image_url: undefined,   // Valid for 5 mins. In order to download asset u should provide auth header
        video_url: undefined,   // Valid for 5 mins. In order to download asset u should provide auth header
        document_url: undefined // Valid for 5 mins. In order to download asset u should provide auth header
    };
    switch (message.type){
        case 'text':
            result.text = message.text;
            break;
        case 'image':
            result.text = message.image.caption ?? message.text;
            result.image_url = id_to_url(message.image.id);
            break;
        case 'interactive':
            result.text = message.interactive.button_reply.title;
            result.callback_data = message.interactive.button_reply.id;
            break
        case 'video':
            result.text = message.video.caption ?? message.text;
            result.video_url = id_to_url(message.video.id);
            break;
        case 'document':
            result.text = message.document.caption ?? message.text;
            result.document_url = id_to_url(message.document.id);
            break;
        default:
            result.text = 'Unsupported message';
    }
    return result
}

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
        let message = parse_message(req.body.entry[0].changes[0].value.message);
        let user = parse_user(req.body.entry[0].changes[0]);
        const phone_number_id = req.body.entry[0].changes[0].value.metadata.phone_number_id;
        const url = `https://graph.facebook.com/${process.env.Version}/${phone_number_id}/messages`;
        Promise.all([
                fetch(url, // Send echo message
                    {
                        method: "POST",
                        body: JSON.stringify({
                            "messaging_product": "whatsapp",
                            "recipient_type": "individual",
                            "to": user.id,
                            "type": "text",
                            "text": {
                                "body": `Message data:\n${JSON.stringify(message)}`
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
                            "to": user.id,
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
                            "to": user.id,
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
                            "to": user.id,
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
                            "to": user.id,
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
