'use strict';

var ethers = require('ethers');

var MetaSigner = require("./abstractMetaSigner").MetaSigner;

var allowedMetaTransactionKeys = require('./utils').allowedMetaTransactionKeys;

var Interface = ethers.utils.Interface;
var defineReadOnly = ethers.utils.defineReadOnly;
var shallowCopy = ethers.utils.shallowCopy;
var getAddress = ethers.utils.getAddress;
var errors = ethers.errors;

function resolveAddresses(provider, value, paramType) {
  if (Array.isArray(paramType)) {
    var promises_1 = [];
    paramType.forEach(function (paramType, index) {
      var v = null;

      if (Array.isArray(value)) {
        v = value[index];
      } else {
        v = value[paramType.name];
      }

      promises_1.push(resolveAddresses(provider, v, paramType));
    });
    return Promise.all(promises_1);
  }

  if (paramType.type === 'address') {
    return provider.resolveName(value);
  }

  if (paramType.type === 'tuple') {
    return resolveAddresses(provider, value, paramType.components);
  } // Strips one level of array indexing off the end to recuse into


  var isArrayMatch = paramType.type.match(/(.*)(\[[0-9]*\]$)/);

  if (isArrayMatch) {
    if (!Array.isArray(value)) {
      throw new Error('invalid value for array');
    }

    var promises = [];
    var subParamType = {
      components: paramType.components,
      type: isArrayMatch[1]
    };
    value.forEach(function (v) {
      promises.push(resolveAddresses(provider, v, subParamType));
    });
    return Promise.all(promises);
  }

  return Promise.resolve(value);
}

function runMetaMethod(contract, functionName) {
  var method = contract.interface.functions[functionName];
  return function () {
    var params = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      params[_i] = arguments[_i];
    }

    var tx = {};
    var blockTag = null; // If 1 extra parameter was passed in, it contains overrides

    if (params.length === method.inputs.length + 1 && typeof params[params.length - 1] === 'object') {
      tx = shallowCopy(params.pop());

      if (tx.blockTag != null) {
        blockTag = tx.blockTag;
      }

      delete tx.blockTag; // Check for unexpected keys (e.g. using "gas" instead of "gasLimit")

      for (var key in tx) {
        if (!allowedMetaTransactionKeys[key]) {
          throw new Error('unknown transaction override ' + key);
        }
      }
    }

    if (params.length != method.inputs.length) {
      throw new Error('incorrect number of arguments');
    } // Check overrides make sense


    ['data', 'to'].forEach(function (key) {
      if (tx[key] != null) {
        errors.throwError('cannot override ' + key, errors.UNSUPPORTED_OPERATION, {
          operation: key
        });
      }
    });
    tx.to = contract._deployed(blockTag).then(function () {
      return contract.addressPromise;
    });
    return resolveAddresses(contract.provider, params, method.inputs).then(function (params) {
      tx.data = method.encode(params);

      if (method.type === 'transaction') {
        if (!contract.signer) {
          errors.throwError('sending a meta transaction requires a signer', errors.UNSUPPORTED_OPERATION, {
            operation: 'sendMetaTransaction'
          });
        } // Make sure they aren't overriding something they shouldn't


        if (tx.from != null) {
          errors.throwError('cannot override from in a transaction', errors.UNSUPPORTED_OPERATION, {
            operation: 'sendMetaTransaction'
          });
        }

        return contract.signer.signMetaTransaction(tx);
      }

      throw new Error('invalid type - ' + method.type);
      return null;
    });
  };
}

class MetaContract {
  constructor(addressOrName, contractInterface, signer) {
    var _this = this;

    if (Interface.isInterface(contractInterface)) {
      defineReadOnly(this, 'interface', contractInterface);
    } else {
      defineReadOnly(this, 'interface', new Interface(contractInterface));
    }

    if (MetaSigner.isMetaSigner(signer)) {
      defineReadOnly(this, 'provider', signer.provider);
      defineReadOnly(this, 'signer', signer);
    } else {
      errors.throwError('invalid p meta signer', errors.INVALID_ARGUMENT, {
        arg: 'signer',
        value: signer
      });
    }

    defineReadOnly(this, 'functions', {});
    defineReadOnly(this, 'address', addressOrName);

    if (this.provider) {
      defineReadOnly(this, 'addressPromise', this.provider.resolveName(addressOrName).then(function (address) {
        if (address == null) {
          throw new Error('name not found');
        }

        return address;
      }).catch(function (error) {
        throw error;
      }));
    } else {
      try {
        defineReadOnly(this, 'addressPromise', Promise.resolve(getAddress(addressOrName)));
      } catch (error) {
        // Without a provider, we cannot use ENS names
        errors.throwError('provider is required to use non-address contract address', errors.INVALID_ARGUMENT, {
          argument: 'addressOrName',
          value: addressOrName
        });
      }
    }

    Object.keys(this.interface.functions).forEach(function (name) {
      var run = runMetaMethod(_this, name, false);

      if (_this[name] == null) {
        defineReadOnly(_this, name, run);
      } else {
        errors.warn('WARNING: Multiple definitions for ' + name);
      }

      if (_this.functions[name] == null) {
        defineReadOnly(_this.functions, name, run);
      }
    });
  }

  deployed() {
    return this._deployed();
  }

  _deployed(blockTag) {
    var _this = this;

    if (!this._deployedPromise) {
      // If we were just deployed, we know the transaction we should occur in
      if (this.deployTransaction) {
        this._deployedPromise = this.deployTransaction.wait().then(function () {
          return _this;
        });
      } else {
        // @TODO: Once we allow a timeout to be passed in, we will wait
        // up to that many blocks for getCode
        // Otherwise, poll for our code to be deployed
        this._deployedPromise = this.provider.getCode(this.address, blockTag).then(function (code) {
          if (code === '0x') {
            errors.throwError('contract not deployed', errors.UNSUPPORTED_OPERATION, {
              contractAddress: _this.address,
              operation: 'getDeployed'
            });
          }

          return _this;
        });
      }
    }

    return this._deployedPromise;
  }

}

exports.MetaContract = MetaContract;