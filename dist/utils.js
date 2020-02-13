"use strict";

function setMetaType(object, type) {
  Object.defineProperty(object, '_ethersMetaType', {
    configurable: false,
    value: type,
    writable: false
  });
}

exports.setMetaType = setMetaType;

function isMetaType(object, type) {
  return object && object._ethersMetaType === type;
}

exports.isMetaType = isMetaType;
var allowedMetaTransactionKeys = {
  chainId: true,
  data: true,
  from: true,
  expiration: true,
  nonce: true,
  to: true
};
exports.allowedMetaTransactionKeys = allowedMetaTransactionKeys;