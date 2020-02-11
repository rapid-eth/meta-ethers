var ethers = require('ethers')
var MetaContract = require('./metaContract').MetaContract
var MetaWallet = require('./metaWallet').MetaWallet
var ExtendedWallet = require('./extendedWallet').ExtendedWallet
var ExtendedContract = require('./extendedContract').ExtendedContract

ethers.MetaContract = MetaContract
ethers.MetaWallet = MetaWallet
ethers.Wallet = ExtendedWallet
ethers.Contract = ExtendedContract

module.exports = ethers