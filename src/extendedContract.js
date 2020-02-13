var ethers = require('ethers')
const MetaContract = require('./metaContract').MetaContract
class ExtendedContract extends ethers.Contract {
    
    connectMeta = function (signer) {
        return new MetaContract(this.address, this.interface, signer);
    }
}

exports.ExtendedContract = ExtendedContract