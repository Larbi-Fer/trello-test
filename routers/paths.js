const password = ""
const router = require('express').Router()
const Trello = require("trello-node-api")("4c3f73efe799ce3be4134c6262af24c8", "97cb553962782fd607ad992fbc4112c713e1d1d5633026413832d9a1f959e10a")

// google calendar
const { google } = require("googleapis")

// ticktick
const TickTickAPI = require('ticktick-node-api')
const tickAPI = new TickTickAPI()

const Trellojs = require("trello.js")
const Trello2 = new Trellojs.TrelloClient({ key: "4c3f73efe799ce3be4134c6262af24c8", token: "97cb553962782fd607ad992fbc4112c713e1d1d5633026413832d9a1f959e10a" })
// Trello2 = Trello2("4c3f73efe799ce3be4134c6262af24c8", "97cb553962782fd607ad992fbc4112c713e1d1d5633026413832d9a1f959e10a")

// const { OAuth2 } = google.auth
const client_id = "750612677491-6519kichdcfia0ha0m4vreirqq52mh5r.apps.googleusercontent.com"
require("dotenv").config()
const URL = process.env.URL
// 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
// https://developers.google.com/oauthplayground/#step1&apisSelect=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar%2Chttps%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events&url=https%3A%2F%2F&content_type=application%2Fjson&http_method=GET&useDefaultOauthCred=checked&oauthEndpointSelect=Google&oauthAuthEndpointValue=https%3A%2F%2Faccounts.google.com%2Fo%2Foauth2%2Fv2%2Fauth&oauthTokenEndpointValue=https%3A%2F%2Foauth2.googleapis.com%2Ftoken&includeCredentials=checked&accessTokenType=bearer&autoRefreshToken=unchecked&accessType=offline&prompt=consent&response_type=code&wrapLines=on

/* const oAuth2Client = new OAuth2(
    "750612677491-6519kichdcfia0ha0m4vreirqq52mh5r.apps.googleusercontent.com",
    "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",
    URL
)

const  rl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"],
    redirect_uri: URL + "card/calendar"
})
console.log(rl) */

router.get("/callback", async(req, res) => {
    try {
        const tick = await tickAPI.login({ username: "", password })
        // const tasks = await tickAPI.getCompletedTasks({begin: new Date("06/09/2022"), end: new Date("06/11/2022")})
        res.send("ok")
    } catch (error) {
        res.send("error")
        console.error(error)
    }
})

router.post("/complete", async(req, res) => {
    if (!req.body.idCard || !req.body.idList) return res.status(400).json({error: "no fields"})
    let data = {
        // name: req.body.name,
        // desc: 'Card description',
        // pos: 'bottom',
        idList: req.body.idList, //REQUIRED
        // due: new Date("07/12/2022"),
        dueComplete: true,
        // idMembers: [],
        // idLabels: [],
        // urlSource: 'https://example.com',
        // fileSource: 'file',
        // idCardSource: 'CARD_ID',
        // keepFromSource: 'attachments,checklists,comments,due,labels,members,stickers'
    };
    let response;
    try {
        response = await Trello.card.update(req.body.idCard, data);
    } catch (error) {
        if (error) {
            console.log('error ', error);
            res.status(400).json({error: "error"})
        }
    }
    res.status(200).json({ status: "ok" })
})

router.post("/addcards", async(req, res) => {
    try {
        const { cards, title, idList } = req.body
        let data = {
            name: title,
            idList: idList,
            dueComplete: false,
        };
        const result = await Trello2.cards.createCard(data);
        const check = await Trello2.checklists.createChecklist({ idCard: result.id, name: "les steps" });
        await Trello2.webhooks.createWebhook({
            idModel: result.id,
            description: `connect this card (${result.url}) with multi cards`,
            callbackURL: `${URL}callback/connect2cardsv2`
        })
        
        cards.forEach(async card => {
            try {
                let data = {
                    idList: idList,
                    name: `${title} - ${card.name}`,
                    dueComplete: false,
                };
                var cardData = await Trello2.cards.createCard(data);
                const checkItem = await Trello2.checklists.createChecklistCheckItems({ id: check.id, name: cardData.url })
                await Trello2.cards.createCardAttachment({ id: cardData.id, url: result.url, name: result.name })
                const attch = await Trello2.cards.createCardAttachment({ id: result.id, url: cardData.url })
                await Trello2.webhooks.createWebhook({
                    idModel: cardData.id,
                    description: `connect this card (${cardData.url}) with (${result.url})`,
                    callbackURL: `${URL}callback/connect2cardsv1/${result.id}?checkItem=${checkItem.id}&attch=${attch.id}&checklist=${check.id}`
                })
            } catch (error) {
                console.log(error)
                return res.status(400).send("err")
            }
        });

        res.status(200).json({ status: "ok" })
    } catch (error) {
        res.status(400).json({status: "error"})
        console.log(error)
    }
})

router.post('/move-cards-to-list', (req, res) => {
    const { idList, idCards } = req.body
    idCards.forEach(async idCard => {
        
        let data = {
            idList: idList, //REQUIRED
            dueComplete: true,
        };
        let response;
        try {
            response = await Trello.card.update(idCard, data);
            res.status(200).json({ status: "ok" })
        } catch (error) {
            if (error) {
                console.log('error ', error);
                res.status(400).json({error: "error"})
            }
        }
    });
})

router.get('/webhook', (req, res) => {
    return res.status(200).send("ok")
})

router.post('/calendar', async(req, res) => {
    console.log("open")
    res.send("ok")
})

router.get('/calendar', async(req, res) => {
    try {
        const code = req.query.code
        console.log(code)
        const t = await oAuth2Client.getToken(code)
        oAuth2Client.setCredentials({ refresh_token: code })
        console.log(t)
        // return res.send("ok")
        const calendar = google.calendar({ version: "v3", auth: oAuth2Client })
        const start = new Date(new Date().setDate(new Date().getDate() + 2))
        const end = new Date(new Date().setDate(new Date().getDate() + 2))
        end.setMinutes(end.getMinutes() + 45)

        calendar.events.insert({
            calendarId: "primary",
            resource: {
                summary: "title",
                location: "JQ38+JWG، بشار",
                description: "desc",
                start: { dateTime: start },
                end: { dateTime: end },
                colorId: 2
            }
        }, err => {
            if (err) return console.error("error in create new calendar", err)
            return console.log("calendar event created.")
        })

        /* calendar.freebusy.query({
            requestBody: {
                timeMin: start,
                timeMax: end,
                items: [{id: "primary"}]
            }
        }, (err, res) => {
            if (err) return console.error("error in google calendar", err)
            const eventsArr = res.data.calendars.primary.busy
            if (eventsArr.length === 0) return calendar.events.insert({
                calendarId: "primary",
                requestBody: {
                    summary: "title",
                    location: "JQ38+JWG، بشار",
                    description: "desc",
                    start: { dateTime: start },
                    end: { dateTime: end },
                    colorId: 2
                }
            }, err => {
                if (err) return console.error("error in create new calendar", err)
                return console.log("calendar event created.")
            })
            return console.log("sorry")
        }) */
    
        return res.status(200).json({ status: "ok" })
    } catch (error) {
        console.log(error)
        return res.send("error !!")
    }
})

router.post('/webhook', async(req, res) => {
    const action = req.body.action
    if (action.type === "updateCard") {
        if (action.data.old.dueComplete === false) {
            let data = { pos: 'bottom' }
            try {
                await Trello.card.update(action.data.card.id, data)
            } catch (error) {
                console.error(error)
                return res.send('error')
            }
            return res.json({ status: "card completd" })
        }
        return res.status(200).send(200)
    }
    res.send("this action not update card")
})


module.exports = router