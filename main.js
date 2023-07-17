const express = require('express')
const cors = require("cors")
const bodyParser = require('body-parser')
const axios = require('axios')

const cards = require('./routers/paths.js');
const callback = require('./routers/callback.js');
const index = require('./routers/index.js');

const app = express()
require('dotenv').config();
app.use(bodyParser.json({ limit: '30mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }))
app.use(cors())

app.get("/", (req, res) => res.send("hello"))

app.use('/card', cards)
app.use('/callback', callback)
app.use('/', index.router)

const PORT = process.env.PORT || 5000;
const URL = process.env.URL

app.listen(PORT, () => {
    console.log('Server Running on url ', URL)
})

var fetchData = new axios.Axios({
    headers: {
        Authorization: `Bearer 397f6e8e-99c3-4ac6-8eb5-109a84157b31`,
        "Content-Type": "application/json"
    },
    method: "POST"
})
exports.fetchData = fetchData

exports.createTaskOnTicktick = data => {
    console.log(data.title)
    data = JSON.stringify(data)
    fetchData.post("https://api.ticktick.com/open/v1/task", data).catch(e => console.log("error: ", e))
}