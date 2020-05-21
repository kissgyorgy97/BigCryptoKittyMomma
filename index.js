const express = require('express')
const Web3 = require("web3");
var path = require('path');
const app = express()
const port = 5200


const CryptoKitty = require('./CryptoKitty.json')
let web3 = new Web3(
    // Replace YOUR-PROJECT-ID with a Project ID from your Infura Dashboard
    new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws/v3/ac9cd909275e45378daaa377cbdbc514")
);


web3._provider.on('end', (eventObj) => {
    console.log('Disconnected: ');
    console.log(eventObj);
});

const CryptoKittyInstance = new web3.eth.Contract(CryptoKitty.abi, '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d');


app.get('/BigCryptoKittyMomma', async (req, res) => {
    console.log(req.query)
    /*Momma event
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "kittyId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "matronId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "sireId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "genes",
                "type": "uint256"
            }
        ],
        "name": "Birth",
        "type": "event"
    }
    */
    
    let MommaArray = []
    let eventCount = 0
    let startBlock = parseInt(req.query.startingBlock)
    let endBlock = parseInt(req.query.endingBlock)
    console.log(startBlock)

    console.log(req.query.startingBlock)
    console.log(req.query.endingBlock)
    console.log(endBlock)


    let blockdiff = endBlock - startBlock
    if (blockdiff >= 100) {
        console.log(blockdiff)
        console.log(parseInt(startBlock))
        console.log("too big diff")
        let checkedBlockCount = 0
        let currentStartBlock = parseInt(startBlock)
        //5k block request to check goes over limit with infura
        let currentEndBlock = parseInt(startBlock) + 4500
        do {
            if ((blockdiff - checkedBlockCount) > 4500) {
                console.log('currentstart' + currentStartBlock, 'currentend' + currentEndBlock)
                await CryptoKittyInstance.getPastEvents("Birth", {
                    fromBlock: currentStartBlock,
                    toBlock: currentEndBlock
                }, async function (error, events) {
                    console.log(events.length) 
                    if (events.length > 0) {
                        eventCount = eventCount + events.length
                        await events.forEach(async event => {
                            let mommaId = event.returnValues.matronId
                            console.log('mommaid' + mommaId, 'tx' + event.transactionHash)
                            if (mommaId !== "0") {
                                MommaArray.push(mommaId)
                            }
                        })
                    }

                })


                currentStartBlock = currentEndBlock + 4500 + 1
                currentEndBlock = currentEndBlock + 4500
                checkedBlockCount = checkedBlockCount + 4500
                console.log(blockdiff - checkedBlockCount)
            }
            else {
                //check last remaining blocks
                let leftblock = blockdiff - checkedBlockCount
                currentStartBlock = endBlock - leftblock + 1
                currentEndBlock = endBlock
                console.log(currentStartBlock)
                console.log('lastcheck', 'currentstart' + currentStartBlock, 'currentend' + currentEndBlock)
                await CryptoKittyInstance.getPastEvents("Birth", {
                    fromBlock: currentStartBlock,
                    toBlock: currentEndBlock
                }, async function (error, events) {
                    console.log(events.length) 
                    eventCount = eventCount + events.length
                    if (events.length > "0") {
                        await events.forEach(async event => {
                            let mommaId = event.returnValues.matronId
                            console.log('mommaid' + mommaId, 'tx' + event.transactionHash)
                            if (mommaId !== 0) {
                                MommaArray.push(mommaId)
                            }
                        })
                    }
                })


                checkedBlockCount = checkedBlockCount + leftblock
            }
        }

        while (checkedBlockCount < blockdiff)
        console.log(checkedBlockCount)
        console.log(eventCount + 'events happened')
    }
    else {
        //if start and endblock is closer than 4500 blocks
        console.log(blockdiff)
        await CryptoKittyInstance.getPastEvents("Birth", {
            fromBlock: startBlock,
            toBlock: endBlock
        }, async function (error, events) {
            console.log(events.length)
            if (events.length > 0) {
                await events.forEach(async event => {
                    let mommaId = event.returnValues.matronId
                    console.log('mommaid' + mommaId, 'tx' + event.transactionHash)
                    if (mommaId !== "0") {
                        MommaArray.push(mommaId)
                    }
                })
            }
        })
    }
    if (MommaArray.length !== 0) {
        console.log(
            MommaArray.reduce((a, b) => a + b, 0)
        )
        console.log(MommaArray)
        let counts = {}; //We are going to count occurrence of Mommas here
        let compare = 0;  //We are going to compare using stored value
        let mostFrequent;  //We are going to store most frequent Mommas
        for (let i = 0, len = MommaArray.length; i < len; i++) {
            let Momma = MommaArray[i];
            console.log('Momma ' + Momma)
            console.log('compare' + compare)
            if (counts[Momma] === undefined) { //if count[Momma] doesn't exist
                counts[Momma] = 1;    //set count[Momma] value to 1
                console.log('counts[Momma]' + counts[Momma])
            } else {                  //if exists
                counts[Momma] = counts[Momma] + 1; //increment existing value
                console.log('counts[Momma] ' + counts[Momma])

            }
            if (counts[Momma] > compare) {  //counts[Momma] > 0(first time)
                compare = counts[Momma];   //set compare to counts[Momma]
                console.log('compare ' + compare)
                console.log('MommaArray[i] ' + MommaArray[i])
                console.log('mostFrequent ' + mostFrequent)
                mostFrequent = MommaArray[i];  //set mostFrequent Momma
            }
        }
        console.log(mostFrequent);


        res.status(200).send('Biggest CryptoKitty Momma for these block is : ' + mostFrequent)
    }
    else {
        res.status(500).send("wtf")
    }


})

app.get('/', (req, res) => res.sendFile(path.join(__dirname + '/index.html')))

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))


