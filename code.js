const router = require('express').Router()
const Trello = require("trello-node-api")("4c3f73efe799ce3be4134c6262af24c8", "97cb553962782fd607ad992fbc4112c713e1d1d5633026413832d9a1f959e10a")


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

module.exports = router