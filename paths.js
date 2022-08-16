const router = require('express').Router()
const Trello = require("trello-node-api")("4c3f73efe799ce3be4134c6262af24c8", "97cb553962782fd607ad992fbc4112c713e1d1d5633026413832d9a1f959e10a")
// google calendar
const { google } = require("googleapis")
const { OAuth2 } = google.auth
const client_id = "750612677491-6519kichdcfia0ha0m4vreirqq52mh5r.apps.googleusercontent.com"
// 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
// https://developers.google.com/oauthplayground/#step1&apisSelect=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar%2Chttps%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events&url=https%3A%2F%2F&content_type=application%2Fjson&http_method=GET&useDefaultOauthCred=checked&oauthEndpointSelect=Google&oauthAuthEndpointValue=https%3A%2F%2Faccounts.google.com%2Fo%2Foauth2%2Fv2%2Fauth&oauthTokenEndpointValue=https%3A%2F%2Foauth2.googleapis.com%2Ftoken&includeCredentials=checked&accessTokenType=bearer&autoRefreshToken=unchecked&accessType=offline&prompt=consent&response_type=code&wrapLines=on

const oAuth2Client = new OAuth2(
    "750612677491-6519kichdcfia0ha0m4vreirqq52mh5r.apps.googleusercontent.com",
    "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",
    // "https://localhost:5000"
)

const  rl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"],
    redirect_uri: "https://ai-way.herokuapp.com/card/webhook"
})
console.log(rl)

router.get("/callback", (req, res) => {
    console.log(req.query.code)
    res.send("ok")
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
            idList: "62c88181a3bf5650d2cfb818",
            // due: new Date("07/12/2022"),
            dueComplete: false,
        };
        const result = await Trello.card.create(data);
        console.log(result)
        cards.forEach(async card => {
            let data = {
                idList: "62c88181a3bf5650d2cfb818",
                name: card.name,
                dueComplete: false,
            };
            response = await Trello.card.create(data);
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
    const token = req.query.code
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
    console.log(req.body.action)
    return res.status(200).send(200)
})

router.patch("/rearrangement", (req, res) => {

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