const Block = require('./Block');
const { request, generateNodeId, address, newPeerConnected } = require('../utils/functions');

class Node {
    constructor() {
        this.createGenesis = this.createGenesis.bind(this);
        this.generateNodeId = this.generateNodeId.bind(this);

        // create genesis block
        this.generateNodeId();
        this.createGenesis();

        // this.getBlock = this.getBlock.bind(this);
        this.getAddresses = this.getAddresses.bind(this);
        this.getFullInfo = this.getFullInfo.bind(this);
        this.getGeneralInfo = this.getGeneralInfo.bind(this);
        this.getConfirmedBalances = this.getConfirmedBalances.bind(this);
        this.onPeeerConnected = this.onPeeerConnected.bind(this);
        newPeerConnected.addListener('connection', this.onPeeerConnected)
    }

    async onPeeerConnected(peer) {
        await this.synchronizeChain(peer);
    }

    async synchronizeChain(node) {
        // Implement chain verification
        try {
            let res = await request(`${node}/info`)

            if (res.cumulativeDifficulty > this.cumulativeDifficulty) {
                res = await request(`${node}/blocks`);
                if (!Blockchain.verifyChain(res.blockchain)) return;

                let newChain = res.blockchain;

                let resTxs = await request(`${node}/transactions/pending`);
                let newTransactions = this.synchronizeTransactions(resTxs.transactions);

                if (newChain && newTransactions) {
                    this.blockchain = newChain;
                    this.pendingTransactions = newTransactions;
                }
            }
        } catch (error) { }
        console.log(`syncronized with ${node}`)
    }

    checkPeers() {
        if (Object.keys(this.peers).length === 0) return;

        Object.keys(this.peers).forEach(async (key) => {
            try {
                await request(`${this.peers[key]}/info`, 'GET')
            } catch (error) {
                delete this.peers[key];
            }
        });
    }

    createGenesis() {
        // Blockchain attributes
        this.blockchain = [];
        this.pendingTransactions = [];
        this.confirmedTransactions = [];
        this.blocksCount = 0;
        this.peers = {};
        this.addresses = [];
        this.cumulativeDifficulty = 0;
        this.miningJobs = [];
        //Create genesis block
        this.blockchain.push(new Block({
            index: 0,
            prevBlockHash: '0',
            previousDifficulty: 0,
            pendingTransactions: this.pendingTransactions,
            nonce: 0,
            minedBy: '00000000000000000000000000000000',
        }));
        this.id = `${new Date().toISOString()}${this.blockchain[0].blockHash}`;
    }

    index() {
        let blockchainData = this.getGeneralInfo();
        return {
            about: 'WasakaChain Blockchain Node',
            nodeID: this.nodeID,
            nodeUrl: address(),
            ...blockchainData
        }
    }

    async debugInfo() {
        let nodeInfo = this.getNodeInfo();
        let blockchainFullInfo = await this.getFullInfo();
        return {
            ...nodeInfo,
            ...blockchainFullInfo
        };
    }

    getNodeInfo() {
        return {
            selfUrl: address(),
            nodeID: this.nodeID,
        }
    }


    getGeneralInfo() {
        return {
            chainID: this.id,
            blocksCount: this.blocksCount,
            cumulativeDifficulty: this.cumulativeDifficulty,
            confirmedTransactions: this.confirmedTransactions.length,
            pendingTransactions: this.pendingTransactions.length,
            peers: this.peers
        }
    }

    async getFullInfo() {
        return {
            peers: this.peers,
            chain: {
                chainID: this.id,
                blocks: this.blockchain,
                cumulativeDifficulty: this.cumulativeDifficulty,
            },
            pendingTransactions: this.pendingTransactions,
            confirmedBalances: await this.getConfirmedBalances()
        }
    }

    getAddresses() {
        if (this.addresses.length > 0) {
            return this.addresses;
        }
        else {
            return false;
        }
    }

    addCumulativeDifficulty(blockDifficulty) {
        this.cumulativeDifficulty += Math.pow(16, blockDifficulty)
    }

    synchronizeTransactions(nodeTransactions) {
        return [...this.pendingTransactions, ...nodeTransactions.filter((transaction) => {
            return this.pendingTransactions.find((tx) => tx.transactionDataHash === transaction.transactionDataHash) ? false : true;
        })];
    }

    notifyNewBlock() {
        Object.values(this.peers).forEach((peer) => {

        });
    }

    async registerNode(address) {
        try {
            const res = await request(`${address}/info`);
            if (res) {
                this.peers.push(address);
            }
        } catch (error) { }
    }

    static verifyChain(chain) {
        // TO DO: complete method
        for (const block in chain) {
            if (!Block.isValid(block)) {
                return false;
            }
        }
        return true;
    }

    addAddress(addressData) {
        this.addresses.push({
            address: addressData.address,
            safeBalance: 0,
            confirmedBalance: 0,
            pendingBalance: 0
        });
    }

    getConfirmedBalances() {
        let addresses = this.getAddresses();
        if (addresses) {
            return addresses.filter(({ confirmedBalance }) => confirmedBalance !== 0);
        }
        return [];
    }

    async generateNodeId() {
        this.nodeID = await generateNodeId();
    }

    getAddressesSafeBalances() {
        let addresses = this.getAddresses();
        if (addresses) {
            return addresses.filter(({ confirmedBalance }) => confirmedBalance !== 0)
                .map(({ address, safeBalance }) => {
                    return {
                        [address]: safeBalance
                    };
                });
        }
        return null;
    }
}

module.exports = Node;