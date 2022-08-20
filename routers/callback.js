const router = require('express').Router()

const Trellojs = require("trello.js")
const Trello = new Trellojs.TrelloClient({ key: "4c3f73efe799ce3be4134c6262af24c8", token: "97cb553962782fd607ad992fbc4112c713e1d1d5633026413832d9a1f959e10a" })


router.get(["/connect2cardsv1/:id", "/connect2cardsv2", "/connect2cards/:id/:wid"], (req, res) => {
    res.status(200).send("this webhook is work")
})

router.post("/connect2cardsv1/:id", async(req, res) => {
    try {
        const id = req.params.id
        const action = req.body.action
        console.log(action)
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
        console.log("--------------------------")
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
        callbackURL: 'https://ai-way.herokuapp.com/card/webhook',
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
    console.log('response', response);
})

router.post("/connect2cards/:id/:wid", async(req, res) => {
    const { id, wid } = req.params
    const { action } = req.body
    // console.log(action.display.entities)
    // const idCard = req.body.action.card.id
    try {
        // desactive webhook in the card
        if (action.type === "updateCard") {
            await Trello.webhooks.updateWebhook({ id: wid, active: false })

            // get Card data
            // const data = await Trello.cards.getCard({ id: idCard })
            // update card
            await Trello.cards.updateCard({ ...action.data.card, id })

            // active webhook in the card
            await Trello.webhooks.updateWebhook({ id: wid, active: true })
        } else if ( action.type.search("CheckItem") !== -1 ) {
            var type;
            var state;
            switch (action.type) {
                case "createCheckItem":
                    type = "createChecklistCheckItems"
                    state = "checklists"
                    action.data.checkItem.checked = action.data.checkItem.state === "complete" ? true : false
                    break;
                
                case "updateCheckItemStateOnCard":
                    type = "updateCardCheckItem"
                    state = "cards"
                    // await Trello.cards.getCardChecklists({})
                    break
            
                default:
                    break;
            }
            await Trello.checklists.createChecklistCheckItems( {  } )
        }
        // updateCheckItemStateOnCard, deleteCheckItem

        res.send("complete")
    } catch (error) {
        console.error(error)
    }
})
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