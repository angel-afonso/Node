const { node } = require('../../index');
const { request, NewPeerConnected, address } = require('../utils/functions');

class PeerController {
    static showPeers(_, res) {
        return res.send(node.peers);
    }

    static async connectPeer(req, response) {
        const { peerUrl } = req.body;

        if (!peerUrl) {
            return response.status(400).send({ errorMsg: 'peerUrl is required' });
        }
        try {
            let res = await request(`${peerUrl}/info`, 'GET');
            if (node.peers[res.data.nodeID]) {
                return response.status(409).send({ errorMsg: `Already connected to peer: ${peerUrl}` });
            }
            if (res.data.nodeID === node.nodeID) {
                return response.status(400).send({ errorMsg: 'Invalid peer url' })
            }

            if (res.data.chainID !== node.chainId) {
                return response.status(400).send({ errorMsg: 'Chain ID not match' })
            }

            node.peers[res.data.nodeID] = peerUrl;
            await request(`${peerUrl}/peers/connect`, 'POST', { peerUrl: address() })
            console.log('\x1b[46m%s\x1b[0m', `Connected to peer ${peerUrl}`);
            NewPeerConnected.emit('connection', peerUrl);

            return response.send({ message: `Connected to peer: ${peerUrl}` });

        } catch (error) {
            if (error.status === 409) {
                console.log('\x1b[46m%s\x1b[0m', `Connected to peer ${peerUrl}`);
                NewPeerConnected.emit('connection', peerUrl);

                return response.send({ message: `Connected to peer: ${peerUrl}` })
            }
            console.log('\x1b[46m%s\x1b[0m', `Connection to peer ${peerUrl} failed`);
            return response.status(400).send(error)
        }
    }

    static blockNotification(req, response) {
        const { cumulativeDifficulty = 0, nodeUrl } = req.body;
        if (node.shouldDownloadChain(cumulativeDifficulty)) {
            node.synchronizeChain(nodeUrl);
            node.synchronizeTransactions(nodeUrl);
        }
        return response.send({ message: 'Thank you for the notification' });
    }
}

module.exports = PeerController;