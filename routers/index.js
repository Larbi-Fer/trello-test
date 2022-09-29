const router = require("express").Router()
const Trellojs = require("trello.js")
const Trello = new Trellojs.TrelloClient({ key: "4c3f73efe799ce3be4134c6262af24c8", token: "97cb553962782fd607ad992fbc4112c713e1d1d5633026413832d9a1f959e10a" })

const primaryBoard = "62ff565b4bc60f00af2cc07e"
require("dotenv").config()

//                          programmation         ,     la fac
const secondaryBoards = [ "62ff55a6507edf006375a4a6", "62ff566a299282008d42db7e" ]
const idLabels = ["62ff565d1818e60499d4c750", "62ff565d1818e60499d4c752"]
const idLists = ['62ff9fc7765cfa00d89b143c', '62ff9fc4fa46d400bea49ba3', '62ff9fb5aa7769001f385d85', '62ff9f3b9619c8004d5056e3', '62ff9ec5c366390018576548']
require("dotenv").config()
const URL = process.env.URL

const { google } = require("googleapis")

const oAuth2Client = new google.auth.OAuth2(
    "750612677491-6519kichdcfia0ha0m4vreirqq52mh5r.apps.googleusercontent.com",
    "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",
    URL + "card/calendar"
)

var date = 0

router.patch("/rearrangement", async(req, res) => {
    console.log("opened")
    try {
        var date2 = new Date().getDate()
        if (date2 === date) return res.send("ok")

        date = new Date().getDate()
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
                    const date = new Date(card.badges.start)
                    var start = new Date()
                    start.setDate( start.getDate() + 1 )
                    start.setHours(00, 00, 00, 00)

                    var end = new Date()
                    end.setDate( end.getDate() + 3 )
                    end.setHours(23, 59, 59, 99)

                    return date > start && date < end
                },
                idList: idLists[3]
            },
            {
                callback: card => {
                    const date = new Date(card.badges.start)
                    var start = new Date()
                    start.setHours(00, 00, 00, 00)
                    
                    var end = new Date()
                    end.setHours(23, 59, 59, 99)

                    return date > start && date < end
                },
                idList: idLists[4]
            },
            {
                callback: card => card.dueComplete ? true : (new Date(card.due) < new Date() ? null : false),
                idList: idLists[1],
                idList2: idLists[0]
            },
        ]
        /* try {
            res.json({ ok: "ok" })
        } catch (error) {
            res.send("error")
            console.log(error)
        }
        return */
        const lists = Trello.lists
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

        // جلب مهام آخر 3 أيام
        secondaryBoards.forEach(async (id, iLabel) => {
            const cards = await Trello.boards.getBoardCards({ id })

            cards.forEach(async card => {
                if (!card.badges.start) return
                const date = new Date(card.badges.start)
                
                var start = new Date()
                start.setHours(00, 00, 00, 00)
                
                var end = new Date()
                end.setDate( end.getDate() + 2 )
                end.setHours(23, 59, 59, 99)
                if (date > start && date < end) {
                    const atts = await Trello.cards.getCardAttachments({ id: card.id })
                    // find in attachments
                    const att = atts.find(att => {
                        
                        if (!att.url || !att.url.startsWith('https://trello.com/c/')) return false
                        const shortId = att.url.split("/")[4]
                        if (!shortId) return false
                        Trello.cards.getCard({ id: shortId, fields: "name" }).then(card2 => {
                            if (card.name === card2.name) return true
                        }).catch(err => {
                            console.error(err)
                            return false
                        })
                    })
                    
                    if (att) return

                    const start = new Date()
                    start.setHours(00, 00, 00, 00)
                    
                    const end = new Date()
                    end.setHours(23, 59, 59, 99)
                    const iList = date > start && date < end ? 4 : 3

                    await createConnectCard(card, iLabel, idLists[iList])
                    await createInGoogleC(card, iLabel+7)
                }
            });
        })

        // archiffed cards
        const cardsArch = await Trello.boards.getBoardCardsFilter({ id: primaryBoard, filter: "closed" })
        cardsArch.forEach(async card => {
            try {
                const date = new Date()
                date.setDate(date.getDate() + 20)
                if (new Date(card.dateLastActivity) > date) await Trello.cards.deleteCard({ id: card.id })
            } catch (error) {
                console.log("error", error)
            }
        })

        return res.send("ok")
    } catch (error) {
        console.error(error)
    }
})

router.post('/connect2cards', async(req, res) => {
    try {
        const { id, iLabel } = req.body
        // get card detail
        const card = await Trello.cards.getCard({ id })

        // culc date
        var date = card.badges.start ?? card.due
        // if (!date) return await createConnectCard(card, iLabel, idLists[2])
        date = new Date(date)
        const start = new Date()
        start.setHours(00, 00, 00, 00)
        
        const end = new Date()
        end.setHours(23, 59, 59, 99)

        const next2day = new Date()
        next2day.setDate( next2day.getDate() + 2 )
        next2day.setHours(23, 59, 59, 99)
        // get list
        var iList = date > start && date < end ? 4 : ( date > next2day ? 2 : 3 )
        // await createConnectCard(card, iLabel, idLists[iList])
        await createInGoogleC(card, 8)
    } catch (error) {
        console.error(error)
        res.send("error")
    }
})

router.post("/calendar/watch2", async(req, res) => {
    try {

        oAuth2Client.setCredentials({ refresh_token: process.env.refresh_token })

        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        const event = await calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });

        console.log(event.data.updated)
        res.status(200).send("ok")
    } catch (error) {
        console.error(error)
        res.send("error !!")
    }
})

router.post("/calendar/watch2/event/:eventId", (req, res) => {
    console.log(req.params.eventId)
    res.send("ok")
})

router.post("/create2calendar", async (req, res) => {
    try {
        const { cardID } = req.body
    
        // get card information
        const card = await Trello.cards.getCard({ id: cardID })
    
        if ( !card.badges.start ) return res.send({ status: "no date start" })
        if ( !card.due ) return res.send({ status: "no due date" })

        // google calendar settings
        oAuth2Client.setCredentials({ refresh_token: process.env.refresh_token })

        const calendar = google.calendar({ version: "v3", auth: oAuth2Client })

        // https://github.com/CamSkiTheDev/Google-Calendar-NodeJS-App
        // set color
        var color = 8
        if( card.labels.length ) {
            const colors = [ "blue", "lime", "purple", "red", "yellow", "orange", "sky", "black", "", "green" ]
            color = colors.findIndex(v => v == card.labels[0].color)
            console.log(color+1)
            color = color === -1 ? 8 : (color + 1)
        }
        // create event
        await calendar.events.insert({
            calendarId: "primary",
            requestBody: {
                summary: card.name,
                description: card.desc,
                start: { dateTime: new Date(card.badges.start) },
                end: { dateTime: new Date(card.due) },
                colorId: color
            }
        })

        return res.send({ status: "Success !!" })
    } catch (error) {
        console.error("error in create event in calendar", error)
        return res.send({ status: "error !!",  })
    }
})

const createConnectCard = async(card, iLabel, idList) => {
    const card2 = await Trello.cards.createCard({
        ...card,
        idList: idList,
        idLabels: [idLabels[iLabel]],
        pos: "bottom"
    })

    // add badges in card 1 to card 2
    if (card.badges.attachments) {
        const atts = await Trello.cards.getCardAttachments({ id: card.id })
        atts.forEach(async att => {
            await Trello.cards.createCardAttachment({ ...att, id: card2.id })
        })
    }

    // connect cards
    await Trello.cards.createCardAttachment({ id: card.id, url: card2.shortUrl })
    await Trello.cards.createCardAttachment({ id: card2.id, url: card.shortUrl })

    if (card.idChecklists.length) {
        const checkls = await Trello.cards.getCardChecklists({ id: card.id, fields: "name" })
        for (const checkl of checkls) {
            const check2 = await Trello.cards.createCardChecklist({ ...checkl, id: card2.id })
            for (const checkItem of checkl.checkItems) {
                checkItem.checked = checkItem.state === "complete"
                await Trello.checklists.createChecklistCheckItems({ ...checkItem, id: check2.id })
            }
        }
    }
    
    const wb = await Trello.webhooks.createWebhook({
        idModel: card.id,
        description: "connect this card with " + card2.shortUrl,
        callbackURL: `${URL}callback/connect2cards/${card2.id}/wid`
    })
    const wb2 = await Trello.webhooks.createWebhook({
        idModel: card2.id,
        description: "connect this card with " + card2.shortUrl,
        callbackURL: `${URL}callback/connect2cards/${card.id}/${wb.id}`
    })
    await Trello.webhooks.updateWebhook({ id: wb.id, callbackURL: `${URL}callback/connect2cards/${card2.id}/${wb2.id}` })
}

const createInGoogleC = async (card, colorId) => {
    oAuth2Client.setCredentials({ refresh_token: process.env.refresh_token })
    const calendar = google.calendar("v3")
    const response = await calendar.events.insert({
        auth: oAuth2Client,
        calendarId: "primary",
        requestBody: {
            summary: card.name,
            description: card.desc,
            colorId,
            start :{ dateTime: card.badges.start ? new Date(card.badges.start) : null },
            end :{ dateTime: card.due ? new Date(card.due) : null },
        }
    })
    return response
}

module.exports = router