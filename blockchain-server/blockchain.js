const crypto = require('crypto');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/blockchain', { useNewUrlParser: true, useUnifiedTopology: true });

const blockSchema = new mongoose.Schema({
    prevHash: String,
    transaction: Object,
    ts: Number,
    nonce: Number,
    hash: String
});

const BlockModel = mongoose.model('Block', blockSchema);

const saveBlock = (block) => {
    const blockDoc = new BlockModel(block);
    return blockDoc.save();
};

class Transaction {
    constructor(amount, payer, payee) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }

    toString() {
        return JSON.stringify(this);
    }
}

class Block {
    constructor(prevHash, transaction, ts = Date.now()) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.ts = ts;
        this.nonce = Math.round(Math.random() * 999999);
    }

    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}

class Chain {
    constructor() {
        this.chain = [new Block('', new Transaction(100, 'genesis', 'satoshi'))];
        this.transactionPool = [];
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    async mine() {
        if (this.transactionPool.length === 0) {
            throw new Error('No transactions to mine');
        }

        let solution = 1;
        const limit = 1000000; 
        const transaction = this.transactionPool.shift();

        if (!transaction) return;

        const newBlock = new Block(this.lastBlock.hash, transaction);

        console.log('mining...');

        while (solution < limit) {
            const hash = crypto.createHash('SHA256');
            hash.update((newBlock.nonce + solution).toString()).end();
            const attempt = hash.digest('hex');
            if (attempt.substring(0, 4) === '0000') {
                console.log(`Solved: ${solution}`);
                this.chain.push(newBlock);
                await saveBlock(newBlock);
                return solution;
            }
            solution++;
        }

        throw new Error('Mining limit reached, no solution found');
    }

    async loadChain() {
        this.chain = await BlockModel.find().sort({ ts: 1 });
    }

    addTransactionToPool(transaction, senderPublicKey, signature) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature);

        if (isValid) {
            this.transactionPool.push(transaction);
        } else {
            throw new Error('Invalid transaction');
        }
    }
}

Chain.instance = new Chain();

class Wallet {
    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }

    sendMoney(amount, payeePublicKey) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();
        const signature = sign.sign(this.privateKey);
        Chain.instance.addTransactionToPool(transaction, this.publicKey, signature);
    }
}

module.exports = { Chain, Wallet, Transaction };
