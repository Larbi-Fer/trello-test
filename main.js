const express = require('express')
const cors = require("cors")
const bodyParser = require('body-parser')

const cards = require('./routers/paths.js');
const callback = require('./routers/callback.js');
const index = require('./routers/index.js');

const URL = "https://ai-way.herokuapp.com/"

const app = express()
require('dotenv').config();
app.use(bodyParser.json({ limit: '30mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }))
app.use(cors())

app.get("/", (req, res) => res.send("hello"))

app.use('/card', cards)
app.use('/callback', callback)
app.use('/', index)

const PORT = process.env.PORT || 5000;

exports.URL = URL
app.listen(PORT, console.log('Server Running on port ', PORT))