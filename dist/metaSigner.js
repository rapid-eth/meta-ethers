"use strict";

var ethers = require('ethers');

var populateMetaTransaction = require('./populateMetaTransaction');

var defineReadOnly = ethers.utils.defineReadOnly;
var hexlify = ethers.utils.hexlify;
var arrayify = ethers.utils.arrayify;
var getAddress = ethers.utils.getAddress;
var splitSignature = ethers.utils.splitSignature;
var solidityKeccak256 = ethers.utils.solidityKeccak256;
var defaultAbiCoder = ethers.utils.defaultAbiCoder;

var {
  setMetaType
} = require('./utils');

var toUtf8Bytes = ethers.utils.toUtf8Bytes;

class MetaProvider extends ethers.providers.JsonRpcProvider {
  constructor(url, network) {
    super(url, network);

    this.getMetaSigner = function (addressOrIndex) {
      return new MetaSigner(this, addressOrIndex);
    };
  }

}

class MetaSigner {
  constructor(provider, addressOrIndex) {
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

    this.signMessage = function (message) {
      var data = typeof message === 'string' ? toUtf8Bytes(message) : message;
      return this.provider.send('eth_sign', [this.address.toLowerCase(), hexlify(data)]);
    };

    var _this2 = this;

    defineReadOnly(_this2, 'provider', provider); // Statically attach to a given address

    if (addressOrIndex) {
      if (typeof addressOrIndex === 'string') {
        defineReadOnly(_this2, 'address', getAddress(addressOrIndex));
      } else if (typeof addressOrIndex === 'number') {
        defineReadOnly(_this2, 'index', addressOrIndex);
      } else {
        errors.throwError('invalid address or index', errors.INVALID_ARGUMENT, {
          argument: 'addressOrIndex',
          value: addressOrIndex
        });
      }
    } else {
      defineReadOnly(_this2, 'index', 0);
    }

    setMetaType(this, 'MetaSigner');
    return _this2;
  }

}

exports.MetaProvider = MetaProvider;
exports.MetaSigner = MetaSigner;