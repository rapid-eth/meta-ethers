var ethers = require('ethers')
const MetaWallet = require('./metaWallet').MetaWallet
class ExtendedWallet extends ethers.Wallet {
    
    toMetaWallet = function () { 
        return new MetaWallet(this.signingKey, this.provider)
    }
}

exports.ExtendedWallet = ExtendedWallet