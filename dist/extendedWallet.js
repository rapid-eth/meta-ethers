"use strict";

var ethers = require('ethers');

var MetaWallet = require('./metaWallet').MetaWallet;

class ExtendedWallet extends ethers.Wallet {
  constructor() {
    super(...arguments);

    this.toMetaWallet = function () {
      return new MetaWallet(this.signingKey, this.provider);
    };
  }

}

exports.ExtendedWallet = ExtendedWallet;