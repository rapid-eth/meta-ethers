"use strict";

var ethers = require('ethers');

var MetaContract = require('./metaContract').MetaContract;

class ExtendedContract extends ethers.Contract {
  constructor() {
    super(...arguments);

    this.connectMeta = function (signer) {
      return new MetaContract(this.address, this.interface, signer);
    };
  }

}

exports.ExtendedContract = ExtendedContract;