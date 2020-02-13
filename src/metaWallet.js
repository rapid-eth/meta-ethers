var ethers = require('ethers')
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

function populateMetaTransaction(transaction, provider, from) {
    if (!Provider.isProvider(provider)) {
        errors.throwError('missing provider', errors.INVALID_ARGUMENT, {
            argument: 'provider',
            value: provider
        });
    }
    checkProperties(transaction, allowedMetaTransactionKeys);
    var tx = shallowCopy(transaction);
    
    if (tx.to != null) {
        tx.to = provider.resolveName(tx.to).then(function(r) {return r});
    }
    if (tx.expiration == null) {
        tx.expiration = hexlify(9999999999)
    }
    
    if (tx.chainId == null) {
        tx.chainId = provider.getNetwork().then(function (network) { return network.chainId; });
    }
    // tx.from = from
    return resolveProperties(tx).then(function(t) {
        if (t.nonce == null) {
            //TODO
            //console.log("please pass nonce in manually for now")
            //first call `to` contract to get metaproxy address
            let data = ethers.utils.id('metaTxProxyContract()').substring(0,10)

            return provider.call({to: t.to, data}).then(function(proxyContractAddress) {
                let proxyAddress = defaultAbiCoder.decode(["address"], proxyContractAddress)
                let dataSig = ethers.utils.id('nonces(address)').substring(0,10)
                let dataParams = defaultAbiCoder.encode(["address"],[from]).substring(2)
                let data = dataSig + dataParams
                t.nonce = provider.call({to: proxyAddress[0], data})
                return resolveProperties(t)
            })
        }
        return t
    });
}

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