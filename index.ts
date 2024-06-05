import * as crypto from 'crypto';


class Transaction {


   constructor(
       public amount: number,
       public payer: string,
       public payee: string
   ) {}


   toString() {
       return JSON.stringify(this);
   }
}


class Block {


   public nonce = Math.round(Math.random() * 999999);
  
   constructor(
       public prevHash: string,
       public transaction: Transaction,
       public ts = Date.now()
   ) {}


   get hash() {
       const str = JSON.stringify(this);
       const hash = crypto.createHash('SHA256');
       hash.update(str).end();
       return hash.digest('hex');
   }
}


class Chain {


   public static instance = new Chain();
   chain: Block[];
   transactionPool: Transaction[];


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
       const transaction = this.transactionPool.shift();  // get the first transaction from the pool


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
               return solution;
           }
           solution++;
       }


       throw new Error('Mining limit reached, no solution found');
   }


   addTransactionToPool(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
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


class Wallet {
   public publicKey: string;
   public privateKey: string;


   constructor() {
       const keypair = crypto.generateKeyPairSync('rsa', {
           modulusLength: 2048,
           publicKeyEncoding: { type: 'spki', format: 'pem' },
           privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
       });
       this.privateKey = keypair.privateKey;
       this.publicKey = keypair.publicKey;
   }


   sendMoney(amount: number, payeePublicKey: string) {
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