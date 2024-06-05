const express = require('express');
const bodyParser = require('body-parser');
const { Chain, Wallet, Transaction } = require('./blockchain');

const app = express();
const port = 3001;

app.use(bodyParser.json());

app.post('/createWallet', (req, res) => {
  const wallet = new Wallet();
  res.json({
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey
  });
});


app.post('/sendTransaction', (req, res) => {
  const { amount, payeePublicKey } = req.body;
  const wallet = new Wallet();
  wallet.sendMoney(amount, payeePublicKey);
  res.json({ message: 'Transaction sent' });
});


app.get('/api/chain', (req, res) => {
  res.json(Chain.instance.chain);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
