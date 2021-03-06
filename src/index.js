var ethers = require('ethers')
var MetaContract = require('./metaContract').MetaContract
var MetaWallet = require('./metaWallet').MetaWallet
var ExtendedWallet = require('./extendedWallet').ExtendedWallet
var ExtendedContract = require('./extendedContract').ExtendedContract
var MetaProvider = require('./metaSigner').MetaProvider
var MetaSigner = require('./metaSigner').MetaSigner

ethers.MetaContract = MetaContract
ethers.MetaWallet = MetaWallet
ethers.Wallet = ExtendedWallet
ethers.Contract = ExtendedContract
ethers.providers.MetaProvider = MetaProvider
ethers.providers.MetaSigner = MetaSigner
module.exports = { ethers }