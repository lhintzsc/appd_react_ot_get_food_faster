const express = require('express')
const app = express()
const port = 3000

app.get('/rating', (req, res) => {
  res.send('get average rating')
})

app.post('/rating', (req, res) => {
  res.send('post my rating')
})

app.get('/rating/distribution', (req, res) => {
  res.send('list rating distribution')
})

app.delete('/rating/distribution', (req, res) => {
  res.send('clear all rating')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})