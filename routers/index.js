const router = require("express").Router()
const Trellojs = require("trello.js")
const axios = require('axios');
const Trello = new Trellojs.TrelloClient({ key: "4c3f73efe799ce3be4134c6262af24c8", token: "97cb553962782fd607ad992fbc4112c713e1d1d5633026413832d9a1f959e10a" })

const primaryBoard = "62ff565b4bc60f00af2cc07e"
require("dotenv").config()

//                          programmation         ,     la fac               ,        ML
const secondaryBoards = [ "62ff55a6507edf006375a4a6", "62ff566a299282008d42db7e" ]
const idLabels = ["62ff565d1818e60499d4c750", "62ff565d1818e60499d4c752", "64b2e720d4ba428534ff827f"]
const idLists = ['62ff9fc7765cfa00d89b143c', '62ff9fc4fa46d400bea49ba3', '62ff9fb5aa7769001f385d85', '62ff9f3b9619c8004d5056e3', '62ff9ec5c366390018576548']
require("dotenv").config()

const MLLists = ['62ff5a34c5bf7400c34ada58', '62ff5af24d6cfa0025421514', '62ff5b4b54c254005352251a', '64b427d3d83ae2e387993ec4']

var types =  [{
    cardId: '62ff565d1818e60499d4c750',
    listId: "0d4a46eb911a97ddd8a1ddad",
    name: 'programmation',
}, {
    cardId: '62ff565d1818e60499d4c752',
    listId: "339d4f4ab45aed888c5201d2",
    name: 'la fac',
}, {
    cardId: '63349140e11e50016110a148',
    listId: "37b648dfa0126fc4cf2ea9c5",
    name: 'English',
}, {
    cardId: '64b2e720d4ba428534ff827f',
    listId: "bdad43c2b928cadca1ee560c",
    name: 'ML',
}]

const URL = process.env.URL

const { google } = require("googleapis")

const oAuth2Client = new google.auth.OAuth2(
    "750612677491-6519kichdcfia0ha0m4vreirqq52mh5r.apps.googleusercontent.com",
    "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",
    URL + "card/calendar"
)

router.patch("/rearrangement", async(req, res) => {
    try {
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
                    var start = today()
                    start.setDate( start.getDate() + 1 )
                    start.setHours(0, 0, 0, 0)

                    var end = today()
                    end.setDate( end.getDate() + 3 )
                    end.setHours(23, 59, 59, 99)

                    return date > start && date < end
                },
                idList: idLists[3]
            },
            {
                callback: card => {
                    const startDate = new Date(card.badges.start)
                    const endDate = new Date(card.badges.due)
                    var start = today()
                    start.setHours(0, 0, 0, 0)
                    
                    var end = today()
                    end.setHours(23, 59, 59, 99)

                    return ( startDate > start && startDate < end ) || ( endDate > start && endDate < end )
                },
                idList: idLists[4]
            },
            {
                callback: card => card.dueComplete ? true : (new Date(card.due) < today() ? null : false),
                idList: idLists[1],
                idList2: idLists[0]
            },
        ]
        const lists = Trello.lists
        idLists.forEach(async(idList, i) => {
            try {
                const cards = await lists.getListCards({ id: idList })
                // console.log(cards[0]?.name)
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
                if (!card.badges.start && !card.badges.due) return
                // console.log(!card.badges.start && !card.badges.due, card.badges.start, card.badges.due)
                var start = today()
                start.setHours(0, 0, 0, 0)
                
                var end = today()
                end.setDate( end.getDate() + 2 )
                end.setHours(23, 59, 59, 99)
                var date;
                var isComplete = false
                if(card.badges.start) {
                    date = new Date(card.badges.start)
                    isComplete = start < date && date > end
                } 
                if(card.badges.due) {
                    date = new Date(card.badges.due)
                    isComplete = isComplete || (date > start && date < end)
                }
                
                if (isComplete) {
                    const atts = await Trello.cards.getCardAttachments({ id: card.id })
                    // find in attachments
                    var isAtt = false
                    for (const att of atts) {
                        if (!att.url || !att.url.startsWith('https://trello.com/c/')) return false
                        const shortId = att.url.split("/")[4]
                        if (!shortId) return false
                        const card2 = await Trello.cards.getCard({ id: shortId, fields: "name" })
                        var name = card2.name.split(" - ")[0]
                        if (card.name === name || card.name === card2.name) isAtt = true
                    }
                    if (isAtt) return
                    const start = today()
                    start.setHours(0, 0, 0, 0)
                    
                    const end = today()
                    end.setHours(23, 59, 59, 99)
                    const iList = date > start && date < end ? 4 : 3
                    const title = (await Trello.lists.getList({ id: card.idList })).name
                    iLabel = MLLists.find( list => list == card.idList) ? 2 : iLabel
                    var card2 = await createConnectCard(card, iLabel, idLists[iList], title)
                    await createOnTicktick(card2)
                    // await createInGoogleC(card, iLabel+7, title)
                }
            });
        })

        // Get complete tasks from ticktick to sync with trello
        /* types.forEach(({ listId: id }) => {
            require("../main.js").fetchData.get(`https://api.ticktick.com/open/v1/project/${id}/data`).then(({data}) => {
                data.tasks.forEach(task => {
                    const start = new Date()
                    start.setHours(0, 0, 0, 0)
                    
                    const end = new Date()
                    end.setHours(23, 59, 59, 99)

                    if(task.dueDate < end && task.dueDate > start && task.desc) {
                        var dt = task.desc.split(',')
                        Trello.cards.updateCardCheckItem({ id: dt[0], idCheckItem: dt[1], state: "complete" })
                    }
                })
            })
        }) */

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

var today = () => new Date(new Date().setDate(new Date().getDate() + 1))

router.post('/connect2cards', async(req, res) => {
    try {
        const { id, iLabel, title } = req.body
        // get card detail
        const card = await Trello.cards.getCard({ id })

        // culc date
        var date = card.badges.start ?? card.due
        if (!date) return await createConnectCard(card, iLabel, idLists[2], title)
        date = new Date(date)
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        
        const end = new Date()
        end.setHours(23, 59, 59, 99)

        const next2day = new Date()
        next2day.setDate( next2day.getDate() + 2 )
        next2day.setHours(23, 59, 59, 99)
        // get list
        var iList = date > start && date < end ? 4 : ( date > next2day ? 2 : 3 )
        await createConnectCard(card, iLabel, idLists[iList], title)
        await createInGoogleC(card, iLabel+7, title)
    } catch (error) {
        console.error(error)
        res.status(400).send("error")
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

const createConnectCard = async(card, iLabel, idList, title) => {
    const card2 = await Trello.cards.createCard({
        ...card,
        name: `${card.name} - ${title}`,
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
    return card2
}

const createOnTicktick = async card => {
    var projectId = ""
    var labels = card.idLabels ?? card.labels.map(v => v.id)
    if (labels.length)
        projectId = types.find(v => v.cardId == labels[0])?.listId
    var checkLists = card.labels ? card.checklists : await Trello.cards.getCardChecklists({ id: card.id })
    checkLists.forEach(items => {
        items.checkItems.forEach(item => {

            require("../main").createTaskOnTicktick({
                title: item.name,
                dueDate: card.due,
                desc: card.name + '\n' + (card.shortUrl ?? card.url),
                content: card.id + ',' + item.id,
                projectId
            })

        });
    });
    /* Trello.webhooks.createWebhook({
        idModel: card.id,
        description: "desc" ,
        callbackURL: `${URL}callback/ticktick/webhook`
    }) */
    // console.log((await Trello.cards.getCard({ id })).idLabels[5])
    // console.log(checkItems)
}

const createInGoogleC = async (card, colorId, title) => {
    oAuth2Client.setCredentials({ refresh_token: process.env.refresh_token })
    const calendar = google.calendar("v3")
    const response = await calendar.events.insert({
        auth: oAuth2Client,
        calendarId: "primary",
        requestBody: {
            summary: `${card.name} - ${title}`,
            description: card.desc,
            colorId,
            start :{ dateTime: card.badges.start ? new Date(card.badges.start) : null },
            end :{ dateTime: card.due ? new Date(card.due) : null },
        }
    })
    return response
}

module.exports = { router, types, createOnTicktick }
