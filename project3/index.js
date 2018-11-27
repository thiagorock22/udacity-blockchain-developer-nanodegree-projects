const express = require('express')
const app = express()

const BlockChain = require('./BlockChain.js');
let myBlockChain = new BlockChain.Blockchain();

const PORT = 8000

app.get('/block/:height', (req, res) => { 
    myBlockChain.getBlock(req.params.height).then((block) => {
        console.log(JSON.stringify(block))
        res.send(block)
    }).catch((err) => { console.log(err) });
})


app.listen(PORT, () => console.log('Running restful web api in local port 8000'))