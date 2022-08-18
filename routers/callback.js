const router = require('express').Router()

const Trellojs = require("trello.js")
const Trello = new Trellojs.TrelloClient({ key: "4c3f73efe799ce3be4134c6262af24c8", token: "97cb553962782fd607ad992fbc4112c713e1d1d5633026413832d9a1f959e10a" })


router.get("/connect2cardsv1/:id", (req, res) => {
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
                /* var attachments = await Trello.cards.getCardAttachments({ id: "62fe1d05dc3a8d0017101e99" })
                var attachments = attachments.filter(t => t.url.startsWith("https://trello.com/"))
                const dates = []
                attachments.forEach(async at => {
                    try {
                        const idCard = at.url.split('/')[4]
                        const due = (await Trello.cards.getCard({ id: idCard })).due
                        due ? dates.push(new Date(due)) : null
                    } catch (error) {
                        console.error(error)
                        res.send("error")
                    }
                });
                if (dates.length === 0) return */
                if (!data.card.due) return
                var due = (await Trello.cards.getCard({ id })).due
                if (!due) return
                due = new Date(due)
                if (due > new Date(data.card.due)) return
                await Trello.cards.updateCard({ id, due: data.card.due })
            }
        // delete card
        } else if (action.type === "deleteCard") {
            await Trello.cards.deleteCardChecklistItem({ id, idCheckItem: checkItem })
            await Trello.cards.deleteCardAttachment({ id, idAttachment: attch })
        // update date
        } else if (action.type === "updateCheckItem") {
            // await Trello.cards.updateCard({ id, dueComplete: data.old.state === "incomplete" })
        }
    
        res.send("ok")
    } catch (error) {
        console.error(error)
        res.send("error")
    }
})


/* function max(array) {
    var valueMax = 0;
    array.forEach(value => {
        if (valueMax < value) valueMax = value
    })
    return valueMax
} */

module.exports = router