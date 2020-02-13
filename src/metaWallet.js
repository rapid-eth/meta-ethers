var ethers = require('ethers')
var populateMetaTransaction = require('./populateMetaTransaction')

const checkProperties = ethers.utils.checkProperties
const shallowCopy = ethers.utils.shallowCopy
const resolveProperties = ethers.utils.resolveProperties
const hexlify = ethers.utils.hexlify
const arrayify = ethers.utils.arrayify
const id = ethers.utils.id
const splitSignature = ethers.utils.splitSignature
const solidityKeccak256 = ethers.utils.solidityKeccak256
const RLP = ethers.utils.RLP
const defaultAbiCoder = ethers.utils.defaultAbiCoder
const { setMetaType, allowedMetaTransactionKeys } = require('./utils')
const Provider = ethers.providers.Provider



class MetaWallet extends ethers.Wallet {

    constructor(privateKey, provider) {
        super(privateKey,provider);
        setMetaType(this, 'MetaSigner');
    }

    isMetaSigner = function (value) {
        return isType(value, 'MetaSigner');
    };

    signMetaTransaction = function (transaction) { 
        var _this = this;
        return populateMetaTransaction(transaction, this.provider, this.address).then(function (tx) {
            //hash it
            let hash = solidityKeccak256(['uint256', 'address', 'uint256', 'bytes'], [tx.nonce, tx.to, tx.expiration, tx.data]);
            //sign it
            return _this.signMessage(arrayify(hash)).then(function (signature) {
                let splitSig = splitSignature(signature)
                let mtxArray = [
                    hexlify(tx.nonce),
                    tx.to,
                    tx.expiration,
                    tx.data,
                    hexlify(splitSig.v),
                    splitSig.r,
                    splitSig.s
                ]

                return defaultAbiCoder.encode(["uint256","address","uint256","bytes","uint8","bytes32","bytes32"], mtxArray)
                //return RLP.encode(mtxArray)
            });
        })
    }

}

exports.MetaWallet = MetaWallet
