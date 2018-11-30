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

        this.mempool = [];
        this.timeoutRequests = [];
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

            if (req.body.body === '') {
                res.status(400).json({
                  error: "The content is required."
                })
                return;
            }

            const body = { address, star } = req.body
            const story = star.story

            body.star = {
                dec: star.dec,
                ra: star.ra,
                story: new Buffer(story).toString('hex'),
                mag: star.mag,
                con: star.con
            }
            
            this.chain.addBlock(new Block.Block(body)).then((block) => {
                console.log(JSON.stringify(block))
            
                res.status(201).send(block)
            }).catch((err) => { 
                console.log(err) 
                res.status(500).send(err)
            })
        });
    }

    
    requestValidation() {
        this.app.post('/requestValidation', async (req, res) => {

            if (!req.body.address) {
                res.status(400).json({
                    error: "The address is required."
                })
                return;
            }
          
            const starValidation = new StarValidation(req)
            const address = req.body.address
        
            try {
                data = await starValidation.getPendingAddressRequest(address)
            } catch (error) {
                data = this.saveNewRequestValidation(address)
            }
        
            res.json(data)
        })
    }

    getPendingAddressRequest(address) {
        return new Promise((resolve, reject) => {
            db.get(address, (error, value) => {
              if (value === undefined) {
                return reject(new Error('Not found'))
              } else if (error) {
                return reject(error)
              }
      
              value = JSON.parse(value)
      
              const nowSubFiveMinutes = Date.now() - (5 * 60 * 1000)
              const isExpired = value.requestTimeStamp < nowSubFiveMinutes
      
              if (isExpired) {
                  resolve(this.saveNewRequestValidation(address))
              } else {
                const data = {
                  address: address,
                  message: value.message,
                  requestTimeStamp: value.requestTimeStamp,
                  validationWindow: Math.floor((value.requestTimeStamp - nowSubFiveMinutes) / 1000)
                }
      
                resolve(data)
              }
            })
        })
    }

    saveNewRequestValidation(address) {
        const timestamp = Date.now()
        const message = `${address}:${timestamp}:starRegistry`
        const validationWindow = 300
      
        const data = {
          address: address,
          message: message,
          requestTimeStamp: timestamp,
          validationWindow: validationWindow
        }
      
        db.put(data.address, JSON.stringify(data))
    
        return data
    }

    messageSignature() {
        this.app.post('/message-signature/validate', [validateAddressParameter, validateSignatureParameter], async (req, res) => {
            const starValidation = new StarValidation(req)
        
            try {
                const { address, signature } = req.body
                const response = await starValidation.validateMessageSignature(address, signature)
        
                if (response.registerStar) {
                    res.json(response)
                } else {
                    res.status(401).json(response)
                }
            } catch (error) {
                res.status(404).json({
                    status: 404,
                    message: error.message
                })
            }
        })
    }

/**
 * Exporting the BlockController class
 * @param {*} app 
 */
module.exports = (app) => { return new BlockController(app);}