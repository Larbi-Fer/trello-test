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
    return res.status(200).json({ status: "ok" })
})
router.post('/webhook', (req, res) => {
    console.log(req.body.action)
    return res.status(200).send(200)
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