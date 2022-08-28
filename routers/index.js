const router = require("express").Router()
const Trellojs = require("trello.js")
const Trello = new Trellojs.TrelloClient({ key: "4c3f73efe799ce3be4134c6262af24c8", token: "97cb553962782fd607ad992fbc4112c713e1d1d5633026413832d9a1f959e10a" })

const primaryBoard = "62ff565b4bc60f00af2cc07e"
const secondaryBoards = [ "62ff55a6507edf006375a4a6", "62ff566a299282008d42db7e" ]
require("dotenv").config()
const URL = process.env.URL

router.patch("/rearrangement", async(req, res) => {
    try {
        const idLists = ['62ff9fc7765cfa00d89b143c', '62ff9fc4fa46d400bea49ba3', '62ff9fb5aa7769001f385d85', '62ff9f3b9619c8004d5056e3', '62ff9ec5c366390018576548']
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
            // const wh = await Trello.cards.updateCard({ id: "6300b429f8450d008d173709", start: new Date("2022-08-19") })
            const wh = await Trello.cards.getCard({ id: "7G4go8d2", fields: "none,name" })
            // await Trello.checklists.createChecklist({ id: "6300b429f8450d008d173709" })
            res.json(wh)
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
        secondaryBoards.forEach(async id => {
            const cards = await Trello.boards.getBoardCards({ id })

            cards.forEach(async card => {
                if (!card.badges.start) return
                const date = new Date(card.badges.start)

                var start = new Date()
                start.setHours(00, 00, 00, 00)
                start.setDate( start.getDate() + 2 )
                
                var end = new Date()
                end.setDate( end.getDate() + 2 )
                end.setHours(23, 59, 59, 99)

                if (date > start && date < end) {
                    // return res.json(card)
                    card.idLabels = []
                    const card2 = await Trello.cards.createCard({
                        ...card,
                        idList: idLists[3],
                    })
                    // connect cards
                    await Trello.cards.createCardAttachment({ id: card.id, url: card2.shortUrl })
                    await Trello.cards.createCardAttachment({ id: card2.id, url: card.shortUrl })

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
                } else {
                    start = new Date()

                    end.setDate( end.getDate() + 1 )
                    end.setHours(23, 59, 59, 99)

                    if (date > start && date < end) {

                        const atts = await Trello.cards.getCardAttachments({ id: card.id })
                        // find in attachments
                        const att = atts.find(async att => {

                            if (!att.url || !att.url.startsWith('https://trello.com/c/')) return false
                            console.log(1)
                            const shortId = att.url.split("/")[4]
                            console.log(shortId)
                            if (!shortId) return false
                            console.log(2)
                            try {
                                const card2 = await Trello.cards.getCard({ id: shortId, fields: "name" })
                                console.log(card2.name)
                                if (card.name === card2.name) return true
                            } catch (error) {
                                return false
                            }
                        })
                        console.log(att)
                        if (att) return
                        card.idLabels = []
                        const card2 = await Trello.cards.createCard({
                            ...card,
                            idList: idLists[3],
                        })
                        // connect cards
                        await Trello.cards.createCardAttachment({ id: card.id, url: card2.shortUrl })
                        await Trello.cards.createCardAttachment({ id: card2.id, url: card.shortUrl })
    
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
                }
            });
        })
    return res.send("ok")
    } catch (error) {
        console.error(error)
    }
})

module.exports = router