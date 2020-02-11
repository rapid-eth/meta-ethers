# meta-ethers
A wrapper adding simple meta-transaction functionality to [ethers.js](https://github.com/ethers-io/ethers.js)

This lib is highly experimental, please do not use.

## How to use

Treat it just like its normal ethers:
```js
const ethers = require('meta-ethers')
```

Create a `Meta-Signer`, similar to a normal ethers `Signer` (Wallet with provider) but capable of signing meta-transactions
```js
let metaWallet = new ethers.MetaWallet(privateKey, ethersProvider)
```
or you can call `toMetaWallet()` function on existing signer
```js
let wallet = new ethers.Wallet(privateKey, ethersProvider)

let metaWallet = wallet.toMetaWallet()
```

Use an existing ethers contract object and connect a metasigner
```js
let metaContract = myContract.connectMeta(metaWallet)
```

Now you can call the `metaContract` object just like you would to create a normal transaction and it will return a raw metatransaction signed by the `metaWallet`
```js
let signedMetaTransaction = await metaContract.someFunction(param1, param2)
```