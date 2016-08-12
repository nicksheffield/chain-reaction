express = require('express')
app = express()
server = require('http').createServer(app)
gsockets = require('gsockets').config({log: true})

console.log('Chain Reaction Game Server running')

process.on('uncaughtException', function (err) { console.log(err) })
app.use(express.static(__dirname + '/public'))
app.use(gsockets.client)

server.listen(8105)
gsockets.listen(9000)