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

app.post('/webhooks',  (req, res) => {
    console.log('Got new message');
    console.log(req.body)
    res.sendStatus(200);
});
app.get('/', (req, res)=>{
    res.send("HELLO WORLD!!!!!!")
});

app.listen(process.env.PORT);
console.log(`Listening to port ${process.env.PORT}`)
