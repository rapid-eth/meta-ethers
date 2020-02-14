var ethers = require('ethers')
var populateMetaTransaction = require('./populateMetaTransaction')
const defineReadOnly = ethers.utils.defineReadOnly
const hexlify = ethers.utils.hexlify
const arrayify = ethers.utils.arrayify
const getAddress = ethers.utils.getAddress
const splitSignature = ethers.utils.splitSignature
const solidityKeccak256 = ethers.utils.solidityKeccak256
const defaultAbiCoder = ethers.utils.defaultAbiCoder
const { setMetaType } = require('./utils')
const toUtf8Bytes = ethers.utils.toUtf8Bytes


class MetaProvider extends ethers.providers.JsonRpcProvider {

    constructor(url, network) {
        super(url, network);
    }

    getMetaSigner = function (addressOrIndex) {
        return new MetaSigner(this, addressOrIndex);
    }
}

class MetaSigner {

    constructor(provider, addressOrIndex) {
        var _this = this
        defineReadOnly(_this, 'provider', provider);
        // Statically attach to a given address
        if (addressOrIndex) {
            if (typeof (addressOrIndex) === 'string') {
                defineReadOnly(_this, 'address', getAddress(addressOrIndex));
            }
            else if (typeof (addressOrIndex) === 'number') {
                defineReadOnly(_this, 'index', addressOrIndex);
            }
            else {
                errors.throwError('invalid address or index', errors.INVALID_ARGUMENT, { argument: 'addressOrIndex', value: addressOrIndex });
            }
        }
        else {
            defineReadOnly(_this, 'index', 0);
        }
        setMetaType(this, 'MetaSigner');

        return _this;
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

    signMessage = function (message) {
        var data = ((typeof (message) === 'string') ? toUtf8Bytes(message) : message);
        return this.provider.send('eth_sign', [this.address.toLowerCase(), hexlify(data)]);
    }
}

exports.MetaProvider = MetaProvider
exports.MetaSigner = MetaSigner