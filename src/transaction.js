const { sha256 } = require('../utils');
const TRANSACTION_STATUS = {
    'pending': 'pending',
    'confirmed': 'confirmed',
};

function Transaction(_from, _to, _value, _fee, _senderPubKey, _data, _senderSignature) {
    var from = _from;
    var to = _to;
    var value = _value;
    var fee = _fee;
    var dateCreated = new Date().toISOString();
    var data = _data;
    var senderPubKey = _senderPubKey;
    var transationDataHash = null;
    var senderSignature = _senderSignature;

    class SingleTransaction {
        constructor() {
            transationDataHash = sha256(JSON.stringify({
                from,
                to,
                value,
                fee,
                dateCreated,
                data,
                senderPubKey,
            }));
        }
        index(_, response) {
            return response.send({ message: 'this are all the transactions' });
        }

        show(req, response) {
            return response.send({ message: `this is the transaction hash number: ${req.params.hash}` });
        }

        pendingTransactions(_, response) {
            return response.send({ message: 'this are all the transactions in pending state' });
        }

        confirmedTransactions(_, response) {
            return response.send({ message: 'this are all the transactions in confirmed state' });
        }

        send(_, response) {
            return response.send({ message: 'transaction done!' });
        }

        addressBalance(req, response) {
            return response.send({ message: `this is the address ${req.params.address} balance` });
        }

        addressTransactions(req, response) {
            return response.send({ message: `this is the address ${req.params.address} transactions` });
        }

        get data() {
            return {
                from,
                to,
                value,
                fee,
                dateCreated,
                data,
                senderPubKey,
                transationDataHash,
                senderSignature,
            }
        }
    }

    return new SingleTransaction();
}
module.exports = Transaction;