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
const URL = "https://ai-way.herokuapp.com/"
// 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
// https://developers.google.com/oauthplayground/#step1&apisSelect=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar%2Chttps%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events&url=https%3A%2F%2F&content_type=application%2Fjson&http_method=GET&useDefaultOauthCred=checked&oauthEndpointSelect=Google&oauthAuthEndpointValue=https%3A%2F%2Faccounts.google.com%2Fo%2Foauth2%2Fv2%2Fauth&oauthTokenEndpointValue=https%3A%2F%2Foauth2.googleapis.com%2Ftoken&includeCredentials=checked&accessTokenType=bearer&autoRefreshToken=unchecked&accessType=offline&prompt=consent&response_type=code&wrapLines=on

// const oAuth2Client = new OAuth2(
//     "750612677491-6519kichdcfia0ha0m4vreirqq52mh5r.apps.googleusercontent.com",
//     "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",
//     // "https://localhost:5000"
// )

// const  rl = oAuth2Client.generateAuthUrl({
//     access_type: "offline",
//     scope: ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"],
//     redirect_uri: "https://ai-way.herokuapp.com/card/webhook"
// })
// console.log(rl)

router.get("/callback", async(req, res) => {
    try {
        const tick = await tickAPI.login({ username: "ferhaoui.20044@gmail.com", password })
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
        /* await Trello2.webhooks.createWebhook({
            idModel: cardData.id,
            description: `connect this card (${cardData.url}) with (${cardData.url})`,
            callbackURL: `${URL}callback/connect2cardsv1/${result.id}?checkItem=${checkItem.id}&attch=${attch.id}&checklist=${check.id}`
        }) */
        
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
                    description: `connect this card (${cardData.url}) with (${cardData.url})`,
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
    const token = req.query.code
    oAuth2Client.getToken("4/0AdQt8qgulyCIlr8PMcDyGhXeI0BF5rfCtlndigJ0tGb5eLA0SYT5GwQCqZH6xwWFKsDHCA").then(v => console.log("value", v)).catch(err => console.error("error", err))
    oAuth2Client.setCredentials({ refresh_token: token })
    const calendar = google.calendar({ version: "v3", auth: oAuth2Client })
    const start = new Date(new Date().setDate(new Date().getDate() + 2))
    const end = new Date(new Date().setDate(new Date().getDate() + 2))
    end.setMinutes(end.getMinutes() + 45)
    calendar.freebusy.query({
        resource: {
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
    })

    return res.status(200).json({ status: "ok" })
})
router.post('/webhook', (req, res) => {
    const action = req.body.action
    if (action.type === "updateCard") {
        if (action.data.old.dueComplete === false) {
            let data = { pos: 'bottom' }
            Trello.card.update(action.data.card.id, data).then(response => console.log(response)).catch(err => console.error(err))
            return res.json({ status: "card completd" })
        }
        return res.status(200).send(200)
    }
})

router.patch("/rearrangement", async(req, res) => {
    try {
        const idLists = ['62c88181a3bf5650d2cfb818', '62c89a0d6f727002afc941c6', '62cf2597103c6b53861cc939', '62c88169436e171953dc1dba', '62c881766611d95d455082fc']
        const conditions = [
            {
                callback: () => false
            },
            {
                callback: () => true,
                archive: true
            },
            {
                callback: card => {
                    const date = new Date(card.badges.start).getDate()
                    const day = new Date().getDate()
                    return day <= date && date <= (day + 7)
                },
                idList: idLists[3]
            },
            {
                callback: card => new Date(card.badges.start).getDate() === new Date().getDate(),
                idList: idLists[4]
            },
            {
                callback: card => card.dueComplete ? true : (new Date(card.due) < new Date() ? null : false),
                idList: idLists[1],
                idList2: idLists[0]
            },
        ]
        try {
            // const t = await Trello.cards.createCardAttachment({ id: "62f93d4f4f0657201efb851a", url: "https://trello.com/c/r64RFMG4/56-formation-des-phrases" })
            const t = await Trello2.cards.getCard({ id: "62c881be0803f576e477f902" })
            // await Trello2.cards.updateCardCheckItem({ idChecklist: "62fe01d59372e300df212dd8", idCheckItem: "62fe0eb93eedca70ac87f9fa", state: "complete", id: "62f93c42866a297e09ac948d", pos: "bottom" })
            // console.log(t)
            return res.json(t)
        } catch (error) {
            res.send("error")
            console.log(error)
        }
        return
        const lists = Trello2.lists
        idLists.forEach(async(idList, i) => {
            try {
                const cards = await lists.getListCards({ id: idList })
                cards.forEach(async card => {
                    const result = conditions[i].callback(card)
                    if (!result && !conditions[i].idList2) return
                    if (result === false) return
                    if (conditions[i].archive) {
                        lists.archiveAllCardsInList({ id: idList })
                        return
                    }
                    const data = { idList: result ? conditions[i].idList : conditions[i].idList2, id: card.id }
                    try {
                        await Trello.cards.updateCard(data)
                    } catch (error) {
                        return res.json({ error: "err", card: card.name })
                    }
                })
            } catch (error) {
                return res.json({ error: "error", index: i })
            }
        })
    return res.send("ok")
        // const list = await Trello.list.search(idLists[0])
        // console.log(list)
    } catch (error) {
        
    }
})

router.get('/addwebhook', async(req, res) => {
    let data = {
        description: 'Webhook description',
        callbackURL: 'https://ai-way.herokuapp.com/card/webhook', // REQUIRED
        idModel: '62c8815599d7756a150a56ff', // REQUIRED
        // active: false
    };
    let response;
    try {
        response = await Trello.webhook.create(data);
    } catch (error) {
        if (error) {
            console.log('error ', error);
            return res.send("error")
        }
    }
    res.send("OK")
    console.log('response', response);
})

module.exports = router