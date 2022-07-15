const express = require('express')
const cors = require("cors")
const bodyParser = require('body-parser')

const r = require('./code.js');

const app = express()

app.use(bodyParser.json({ limit: '30mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }))
app.use(cors())
app.use('/card', r)

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log('Server Running on port ', PORT))