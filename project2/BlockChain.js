/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./LevelSandbox.js');
const Block = require('./Block.js');

class Blockchain {

    constructor() {
        this.bd = new LevelSandbox.LevelSandbox();
        this.generateGenesisBlock();
    }

    // Auxiliar method to create a Genesis Block (always with height= 0)
    // You have to options, because the method will always execute when you create your blockchain
    // you will need to set this up statically or instead you can verify if the height !== 0 then you
    // will not create the genesis block
    generateGenesisBlock(){
        this.getBlockHeight().then(height=>{
            if (height<0) {
                this.addBlock(new Block.Block("First block in the chain - Genesis block"));
            }
        })
    }

    // Get block height, it is auxiliar method that return the height of the blockchain
    getBlockHeight() {        
        let blocksCount = this.bd.getBlocksCount();
        return new Promise(function(resolve, reject) {            
            blocksCount.then(count => resolve(count-1))
                .catch(err=>reject(err));
        })
    }

    // Add new block
    addBlock(newBlock) {
        let self = this;

        return new Promise(function(resolve, reject) {
            // Block height
            self.getBlockHeight().then(height => {
                newBlock.height = height + 1
                
                // UTC timestamp
                newBlock.time = new Date().getTime().toString().slice(0,-3);

                // Get previous block
                self.getBlock(newBlock.height - 1).then(previousBlock => {
                    if (previousBlock != undefined) {
                        newBlock.previousBlockHash = previousBlock.hash;
                    }
                    // Block hash with SHA256 using newBlock and converting to a string
                    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

                    // Adding block object to chain
                    self.bd.addLevelDBData(newBlock.height, JSON.stringify(newBlock).toString())
                        .then(block => resolve(block))
                        .catch(err => reject(err));
                }).catch(err => reject(err));
            });
        });        
    }

    // Get Block By Height
    getBlock(height) {
        let self = this;
        return new Promise(function(resolve, reject) {
            self.bd.getLevelDBData(height).then(block => {
                if (block != undefined) {
                    resolve(JSON.parse(block))
                } else {
                    resolve(block)
                }
            }).catch((error) => {
                reject(error);
            });
        });
    }

    // Validate if Block is being tampered by Block Height
    validateBlock(height) {        
        let self = this;
        return new Promise(function(resolve, reject) {
            // get block object
            self.getBlock(height).then(block => {            
                // get block hash
                let blockHash = block.hash;
                // remove block hash to test block integrity
                block.hash = '';
                // generate block hash
                let validBlockHash = SHA256(JSON.stringify(block)).toString();
                // Compare
                if (blockHash === validBlockHash) {
                    resolve(true);                
                } else {
                    reject('Block #'+height+' invalid hash:\n'+blockHash+'<>'+validBlockHash);                
                }
            });
        });
    }

    // Validate Blockchain
    validateChain() {
        let self = this;
        return new Promise(function(resolve, reject) {
            let errorLog = [];
            self.getBlockHeight().then(height => {
                let promises = [];
                for (var i = 0; i < height; i++) {
                    // validate block
                    let validateBlock = self.validateBlock(i).catch(_=>errorLog.push('Block # ' + i + ' Validation Failed'));
                    promises.push(validateBlock)

                    // compare blocks hash link
                    let all = Promise.all([self.getBlock(i + 1), self.getBlock(i)]).then(([nextBlock, block]) => {
                        if (block.hash !== nextBlock.previousBlockHash) {
                            errorLog.push('Block # ' + (i+1) + ' has error in previousBlockHash');
                        }
                    }); 
                    promises.push(all)                   
                }
                Promise.all(promises)
                    .then(_=>resolve(errorLog))
                    .catch(error=>reject(error));
            });
        });
    }

    // Utility Method to Tamper a Block for Test Validation
    // This method is for testing purpose
    _modifyBlock(height, block) {
        let self = this;
        return new Promise( (resolve, reject) => {
            self.bd.addLevelDBData(height, JSON.stringify(block).toString()).then((blockModified) => {
                resolve(blockModified);
            }).catch((err) => { console.log(err); reject(err)});
        });
    }
   
}

module.exports.Blockchain = Blockchain;