"use strict";

var ethers = require('ethers');

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

function populateMetaTransaction(transaction, provider, from) {
  if (!Provider.isProvider(provider)) {
    errors.throwError('missing provider', errors.INVALID_ARGUMENT, {
      argument: 'provider',
      value: provider
    });
  }

  checkProperties(transaction, allowedMetaTransactionKeys);
  var tx = shallowCopy(transaction);

  if (tx.to != null) {
    tx.to = provider.resolveName(tx.to).then(function (r) {
      return r;
    });
  }

  if (tx.expiration == null) {
    tx.expiration = hexlify(9999999999);
  }

  if (tx.chainId == null) {
    tx.chainId = provider.getNetwork().then(function (network) {
      return network.chainId;
    });
  } // tx.from = from


  return resolveProperties(tx).then(function (t) {
    if (t.nonce == null) {
      //TODO
      //console.log("please pass nonce in manually for now")
      //first call `to` contract to get metaproxy address
      var data = ethers.utils.id('metaTxProxyContract()').substring(0, 10);
      return provider.call({
        to: t.to,
        data
      }).then(function (proxyContractAddress) {
        var proxyAddress = defaultAbiCoder.decode(["address"], proxyContractAddress);
        var dataSig = ethers.utils.id('nonces(address)').substring(0, 10);
        var dataParams = defaultAbiCoder.encode(["address"], [from]).substring(2);
        var data = dataSig + dataParams;
        t.nonce = provider.call({
          to: proxyAddress[0],
          data
        });
        return resolveProperties(t);
      });
    }

    return t;
  });
}

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