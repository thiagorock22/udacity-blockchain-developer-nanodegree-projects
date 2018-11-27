const SHA256 = require('crypto-js/sha256');
const Block = require('./Block.js');

const BlockChain = require('./BlockChain.js');


/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {

    /**
     * Constructor to create a new BlockController, you need to initialize here all your endpoints
     * @param {*} app 
     */
    constructor(app) {

        this.chain = new BlockChain.Blockchain();

        this.app = app;
        this.getBlockByHeight();
        this.postNewBlock();
    }

    /**
     * GET Endpoint to retrieve a block by height, url: "/block/:height"
     */
    getBlockByHeight() {
        this.app.get("/block/:height", (req, res) => {
            this.chain.getBlock(req.params.height).then((block) => {
                console.log(JSON.stringify(block))
                if (block == undefined) {
                    res.status(404).json({
                        "status": 404,
                        "message": "Block not found"
                    })
                    return;
                }
                res.send(block)
            }).catch((err) => { 
                console.log(err) 
                res.status(500).send(err)
            })
        });
    }

    /**
     * POST Endpoint to add a new Block, url: "/block"
     */
    postNewBlock() {
        this.app.post("/block", (req, res) => {
            
            this.chain.addBlock(new Block.Block(req.body.body)).then((block) => {
                console.log(JSON.stringify(block))
            
                res.status(201).send(block)
            }).catch((err) => { 
                console.log(err) 
                res.status(500).send(err)
            })
        });
    }


}

/**
 * Exporting the BlockController class
 * @param {*} app 
 */
module.exports = (app) => { return new BlockController(app);}