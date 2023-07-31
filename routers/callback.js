const router = require('express').Router()

const Trellojs = require("trello.js")
const Trello = new Trellojs.TrelloClient({ key: "4c3f73efe799ce3be4134c6262af24c8", token: "97cb553962782fd607ad992fbc4112c713e1d1d5633026413832d9a1f959e10a" })
require("dotenv").config()

const url = process.env.URL


router.get(["/connect2cardsv1/:id", "/connect2cardsv2", "/connect2cards/:id/:wid", "/ticktick/webhook"], (req, res) => {
    res.status(200).send("this webhook is work")
})

router.post("/connect2cardsv1/:id", async(req, res) => {
    try {
        const id = req.params.id
        const action = req.body.action
        const { checkItem, checklist, attch } = req.query
        const data = action.data

        if (action.type === "updateCard") {
            if (data.old.dueComplete === true || data.old.dueComplete === false ) {
                // const check = await Trello.checklists.getChecklist({ id: "" })
                await Trello.cards.updateCardCheckItem({ idChecklist: checklist, idCheckItem: checkItem, state: !data.old.dueComplete, id, pos: "bottom" })
            }
            else if (data.old.due) {
                var attachments = await Trello.cards.getCardAttachments({ id })
                attachments = attachments.filter(t => t.url.startsWith("https://trello.com/"))
                if (attachments.length === 0) return
                const dates = []
                for (let i = 0; i < attachments.length; i++) {
                    const at = attachments[i];
                    const idCard = at.url.split('/')[4]
                    const due = (await Trello.cards.getCard({ id: idCard })).due
                    // const due = card.due
                    if (due) dates.push(new Date(due))
                }

                if (dates.length === 0) return await Trello.cards.updateCard({ id, due: null })
                const due = max(dates)
                await Trello.cards.updateCard({ id, due })
                /* const card = await Trello.cards.getCard({ id })
                var due = card.due
                if (card.badges.attachmentsByType.trello.card === 1) return await Trello.cards.updateCard({ id, due: data.card.due })
                if (!due) return
                due = new Date(due)
                if (due > new Date(data.card.due)) return */
            }
        // delete card
        } else if (action.type === "deleteCard") {
            await Trello.cards.deleteCardChecklistItem({ id, idCheckItem: checkItem })
            await Trello.cards.deleteCardAttachment({ id, idAttachment: attch })
        // update date
        }
    
        res.send("ok")
    } catch (error) {
        console.error(error)
        res.send("error")
    }
})


function max(array) {
    var valueMax = 0;
    array.forEach(value => {
        if (valueMax < value) valueMax = value
    })
    return valueMax
}

router.post("/connect2cardsv2", async(req, res) => {
    try {
        const action = req.body.action
        const data = action.data

        if (action.type === "updateCheckItemStateOnCard") {
            if (!data.checkItem.name.startsWith("https://trello.com/")) return
            const idCard = data.checkItem.name.split('/')[4]

            await Trello.cards.updateCard({ id: idCard, dueComplete: data.checkItem.state === "complete" })
        }
        return res.status(200).send("complete")
        
    } catch (error) {
        console.error(error)
        return res.status(400).send("error")
    }
})

router.get('/addwebhook/:id', async(req, res) => {
    let data = {
        description: 'Webhook board',
        callbackURL: url + 'card/webhook',
        idModel: req.params.id,
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
})

router.post("/connect2cards/:id/:wid", async(req, res) => {
    const { id, wid } = req.params
    const { action } = req.body
    // console.log(action.display.entities)
    // const idCard = req.body.action.card.id
    try {
        // desactive webhook in the card
        await Trello.webhooks.updateWebhook({ id: wid, active: false })

        if (action.type === "updateCard") {
            // update card
            await Trello.cards.updateCard({ ...action.data.card, id })
        } else if ( action.type.search("CheckItem") !== -1 ) {
            var type;
            var state;
            var check;
            switch (action.type) {
                case "createCheckItem":
                    type = "createChecklistCheckItems"
                    state = "checklists"
                    action.data.checkItem.checked = action.data.checkItem.state === "complete" ? true : false
                    check = (await Trello.cards.getCardChecklists({ id })).find(c => c.name === action.data.checklist.name)
                    action.data.checkItem.id = check.id
                    break;

                case "updateCheckItemStateOnCard":
                    type = "updateCardCheckItem"
                    state = "cards"
                    action.data.checkItem.idCheckItem = (await getCheck(id, action.data.checklist.name)).checkItems.find(ci => ci.name === action.data.checkItem.name).id
                    action.data.checkItem.id = id
                    break;

                case "deleteCheckItem":
                    type = "deleteChecklistCheckItem"
                    state = "checklists"
                    check = await getCheck(id, action.data.checklist.name)
                    action.data.checkItem.id = check.id
                    action.data.checkItem.idCheckItem = check.checkItems.find(ci => ci.name === action.data.checkItem.name).id
                    break;

                default:
                    return res.send("no code")
            }
            await Trello[state][type]( { ...action.data.checkItem } )
        } else if ( action.type.search("Checklist") !== -1 ) {
            var type;
            switch (action.type) {
                case "addChecklistToCard":
                    type = "createChecklist"
                    action.data.checklist.idCard = id
                    break;

                case "updateChecklist":
                    type = "updateChecklist"
                    action.data.checklist.id = (await getCheck(id, action.data.old.name ?? action.data.checklist.name)).id
                    break;

                case "removeChecklistFromCard":
                    type = "deleteChecklist"
                    action.data.checklist.id = (await getCheck(id, action.data.checklist.name)).id
                    break;
            
                default:
                    return res.json("no code")
            }
            await Trello.checklists[type](action.data.checklist)
            // await Trello.checklists.createChecklist({  })
        } else if ( action.type.search("Attachment") !== -1 ) {
            // Attachments
            var type;
            switch (action.type) {
                case "addAttachmentToCard":
                    action.data.attachment.id = id
                    type = "createCardAttachment"
                    break;
                case "deleteAttachmentFromCard":
                    action.data.attachment.id = id
                    action.data.attachment.idAttachment = (await Trello.cards.getCardAttachments({ id })).find(a => a.name === action.data.attachment.name).id
                    type = "deleteCardAttachment"
                    break;

                default:
                    return res.send('no code')
            }
            await Trello.cards[type](action.data.attachment)
        } else if ( action.type === "deleteCard" ) {
            // delete card
            await Trello.cards.deleteCard({ id })
        }
        
        // active webhook in the card
        await Trello.webhooks.updateWebhook({ id: wid, active: true })
        
        res.send("complete")
    } catch (error) {
        await Trello.webhooks.updateWebhook({ id: wid, active: true })
        res.send("error")
        console.error(error)
    }
})


router.post("/ticktick/webhook", async(req, res) => {
    const { action } = req.body
    console.log(action.type)
    if (action.type == "createCheckItem") {
        var { id, due, shortUrl, idLabels } = (await Trello.cards.getCard({ id: action.data.card.id }))
        due = new Date(due).toISOString()
        require("../main").createTaskOnTicktick({
            title: action.data.checkItem.name,
            dueDate: due,
            content: action.data.card.name + "\n" + shortUrl,
            desc: id + "," + action.data.checkItem.id,
            projectId: require(".").types.find(v => v.cardId == idLabels[0]).listId
        })
    }
    res.send("complete")
})

const getCheck = async(idCard, name) => (await Trello.cards.getCardChecklists({ id: idCard })).find(c => c.name === name)

/* 
deleteCheckItem = {
    board: {
      id: '62ff55a6507edf006375a4a6',
      name: 'langages de programmation',
      shortLink: 'ht6995ez'
    },
    checklist: { id: '6300b44fdcfdd7003e1c7b9f', name: 'Checklist' },
    card: {
      id: '6300b429f8450d008d173709',
      name: 'face detaction',
      idShort: 1,
      shortLink: 'jbktxLeL'
    },
    checkItem: {
      id: '6300b4510446f6005a7c9368',
      name: '1',
      state: 'complete',
      textData: [Object]
    }
}

createCheckItem = {
    card: {
      id: '6300b429f8450d008d173709',
      name: 'face detaction',
      idShort: 1,
      shortLink: 'jbktxLeL'
    },
    board: {
      id: '62ff55a6507edf006375a4a6',
      name: 'langages de programmation',
      shortLink: 'ht6995ez'
    },
    checklist: { id: '6300b44fdcfdd7003e1c7b9f', name: 'Checklist' },
    checkItem: {
      id: '6300c777b67b2e00ff399b2b',
      name: '1',
      state: 'incomplete',
      textData: [Object]
    }
}

updateCheckItemStateOnCard = {
    board: {
      id: '62ff55a6507edf006375a4a6',
      name: 'langages de programmation',
      shortLink: 'ht6995ez'
    },
    card: {
      id: '6300b429f8450d008d173709',
      name: 'face detaction',
      idShort: 1,
      shortLink: 'jbktxLeL'
    },
    checklist: { id: '6300b44fdcfdd7003e1c7b9f', name: 'Checklist' },
    checkItem: {
      id: '6300c777b67b2e00ff399b2b',
      name: '1',
      state: 'complete',
      textData: [Object]
    }
}

removeChecklistFromCard = {
    card: {
      id: '6300b429f8450d008d173709',
      name: 'face detaction',
      idShort: 1,
      shortLink: 'jbktxLeL'
    },
    board: {
      id: '62ff55a6507edf006375a4a6',
      name: 'langages de programmation',
      shortLink: 'ht6995ez'
    },
    checklist: { id: '6300b44fdcfdd7003e1c7b9f', name: 'Checklist' }
}, */
// addChecklistToCard, updateChecklist
    

module.exports = router