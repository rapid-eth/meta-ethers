"use strict";

var ethers = require('ethers');

var populateMetaTransaction = require('./populateMetaTransaction');

var checkProperties = ethers.utils.checkProperties;
var shallowCopy = ethers.utils.shallowCopy;
var resolveProperties = ethers.utils.resolveProperties;
var hexlify = ethers.utils.hexlify;
var arrayify = ethers.utils.arrayify;
var id = ethers.utils.id;
var splitSignature = ethers.utils.splitSignature;
var solidityKeccak256 = ethers.utils.solidityKeccak256;
var RLP = ethers.utils.RLP;
var defaultAbiCoder = ethers.utils.defaultAbiCoder;

var {
  setMetaType,
  allowedMetaTransactionKeys
} = require('./utils');

var Provider = ethers.providers.Provider;

class MetaWallet extends ethers.Wallet {
  constructor(privateKey, provider) {
    super(privateKey, provider);

    this.isMetaSigner = function (value) {
      return isType(value, 'MetaSigner');
    };

    this.signMetaTransaction = function (transaction) {
      var _this = this;

      return populateMetaTransaction(transaction, this.provider, this.address).then(function (tx) {
        //hash it
        var hash = solidityKeccak256(['uint256', 'address', 'uint256', 'bytes'], [tx.nonce, tx.to, tx.expiration, tx.data]); //sign it

        return _this.signMessage(arrayify(hash)).then(function (signature) {
          var splitSig = splitSignature(signature);
          var mtxArray = [hexlify(tx.nonce), tx.to, tx.expiration, tx.data, hexlify(splitSig.v), splitSig.r, splitSig.s];
          return defaultAbiCoder.encode(["uint256", "address", "uint256", "bytes", "uint8", "bytes32", "bytes32"], mtxArray); //return RLP.encode(mtxArray)
        });
      });
    };

    setMetaType(this, 'MetaSigner');
  }

}

exports.MetaWallet = MetaWallet;