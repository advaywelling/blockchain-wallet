"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
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
    mine() {
        if (this.transactionPool.length === 0) {
            throw new Error('No transactions to mine');
        }
        let solution = 1;
        const limit = 1000000;
        const transaction = this.transactionPool.shift(); // get the first transaction from the pool
        if (!transaction)
            return;
        const newBlock = new Block(this.lastBlock.hash, transaction);
        console.log('mining...');
        while (solution < limit) {
            const hash = crypto.createHash('SHA256');
            hash.update((newBlock.nonce + solution).toString()).end();
            const attempt = hash.digest('hex');
            if (attempt.substring(0, 4) === '0000') {
                console.log(`Solved: ${solution}`);
                this.chain.push(newBlock);
                return solution;
            }
            solution++;
        }
        throw new Error('Mining limit reached, no solution found');
    }
    addTransactionToPool(transaction, senderPublicKey, signature) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature);
        if (isValid) {
            this.transactionPool.push(transaction);
        }
        else {
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
const Ananyaa = new Wallet();
const Advay = new Wallet();
Ananyaa.sendMoney(100, Advay.publicKey);
Advay.sendMoney(50, Ananyaa.publicKey);
Chain.instance.mine();
console.log(Chain.instance);
