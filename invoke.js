/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');
// const tape = require('tape');
// const _test = require('tape-promise').default;
// const test = _test(tape);
const FabricCAService = require('fabric-ca-client');
const Client = require('fabric-client');
const hash = require('fabric-client/lib/hash');

const jsrsa = require('jsrsasign');
const {KEYUTIL} = jsrsa;
const elliptic = require('elliptic');
const { newCryptoSuite } = require('fabric-ca-client');
const EC = elliptic.ec;

const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');

async function main() {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('PKI');

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        let response = await contract.submitTransaction('hashChecking');
        console.log(response);

//############################### Transaction Offline Signing starts ############################## 

        const crypto = newCryptoSuite()
        let name ="Sohaib Ali gill"
        console.log(crypto.hash(name))
        // const privateKeyPath = path.resolve(__dirname, '../javascript/wallet/user1/e3d408a90f37e5aa1d2fc40ab7e41ff77b3a710a9a7b1ba471cf39b5960e424d-priv');
        // const privateKeyPem = fs.readFileSync(privateKeyPath, 'utf8');
        // const certPath = path.resolve(__dirname, '../javascript/wallet/user1/user1');
        // const certPem =JSON.parse( fs.readFileSync(certPath, 'utf8')).enrollment.identity.certificate;

        // console.log(privateKeyPem);
        const mspId = 'Org1MSP';
        let channel = network.getChannel('mychannel')
        // let user = network.getUser('appUser')
        let client = gateway.client

        const ordersForCurve = {
            'secp256r1': {
                'halfOrder': elliptic.curves.p256.n.shrn(1),
                'order': elliptic.curves.p256.n
            },
            'secp384r1': {
                'halfOrder': elliptic.curves.p384.n.shrn(1),
                'order': elliptic.curves.p384.n
            }
        };

        function _preventMalleability(sig, curveParams) {
            const halfOrder = ordersForCurve[curveParams.name].halfOrder;
            if (!halfOrder) {
                throw new Error('Can not find the half order needed to calculate "s" value for immalleable signatures. Unsupported curve name: ' + curveParams.name);
            }
        
            // in order to guarantee 's' falls in the lower range of the order, as explained in the above link,
            // first see if 's' is larger than half of the order, if so, it needs to be specially treated
            if (sig.s.cmp(halfOrder) === 1) { // module 'bn.js', file lib/bn.js, method cmp()
                // convert from BigInteger used by jsrsasign Key objects and bn.js used by elliptic Signature objects
                const bigNum = ordersForCurve[curveParams.name].order;
                sig.s = bigNum.sub(sig.s);
            }
        
            return sig;
        }
        function sign(privateKey, proposalBytes, algorithm, keySize) {
            const hashAlgorithm = algorithm.toUpperCase();
            const hashFunction = hash[`${hashAlgorithm}_${keySize}`];
            const ecdsaCurve = elliptic.curves[`p${keySize}`];
            const ecdsa = new EC(ecdsaCurve);
            const key = KEYUTIL.getKey(privateKey);
        
            const signKey = ecdsa.keyFromPrivate(key.prvKeyHex, 'hex');
            const digest = hashFunction(proposalBytes);
        
            let sig = ecdsa.sign(Buffer.from(digest, 'hex'), signKey);
            sig = _preventMalleability(sig, key.ecparams);
        
            return Buffer.from(sig.toDER());
        }

        function signProposal(proposalBytes) {
            const signature = sign(privateKeyPem, proposalBytes, 'sha2', 256);
            const signedProposal = {signature, proposal_bytes: proposalBytes};
            return signedProposal;
        }
        async function transactionMonitor(txId, eh, t) {
            return new Promise((resolve, reject) => {
                const handle = setTimeout(() => {
                    t.fail('Timeout - Failed to receive event for txId ' + txId);
                    eh.disconnect(); // shutdown
                    throw new Error('TIMEOUT - no event received');
                }, 60000);
        
                eh.registerTxEvent(txId, (txnid, code, block_num) => {
                    clearTimeout(handle);
                    t.pass('Event has been seen with transaction code:' + code + ' for transaction id:' + txnid + ' for block_num:' + block_num);
                    resolve('Got the replayed transaction');
                }, (error) => {
                    clearTimeout(handle);
                    t.fail('Failed to receive event replay for Event for transaction id ::' + txId);
                    reject(error);
                }, {disconnect: true}
                    // Setting the disconnect to true as we do not want to use this
                    // ChannelEventHub after the event we are looking for comes in
                );
                t.pass('Successfully registered event for ' + txId);
                const unsignedEvent = eh.generateUnsignedRegistration({
                    certificate: certPem,
                    mspId,
                });
                const signedProposal = signProposal(unsignedEvent);
                const signedEvent = {
                    signature: signedProposal.signature,
                    payload: signedProposal.proposal_bytes,
                };
                eh.connect({signedEvent});
                t.pass('Successfully called connect on ' + eh.getPeerAddr());
            });
        }

        const transactionProposalReq = {
			fcn: 'createCert',
			args: ['Cert5','xyz5','afghanistan','xyz5.com'],
			chaincodeId: 'PKI',
			channelId: 'mychannel',
		};
        // const {proposal, txId} = channel.generateUnsignedProposal(transactionProposalReq, mspId, certPem);
		// const signedProposal = signProposal(proposal.toBuffer());
        
        // // console.log(channel.getPeers())
        // const peer = channel.getPeer('peer0.org1.example.com:7051');
		// const targets = [peer];
        // // console.log(targets)
		// const sendSignedProposalReq = {signedProposal, targets};
		// const proposalResponses = await channel.sendSignedProposal(sendSignedProposalReq);
        // // console.log(`proposalResponse : ${proposalResponses}`)
        // console.log(proposalResponses)
        // let readpayload = proposalResponses[0].response.payload
        // console.log( `readPayload : ${Buffer.from(readpayload).toString('ascii')}`)
        // let writepayload = proposalResponses[0].payload
        // console.log( `writePayload : ${Buffer.from(writepayload).toString('ascii')}`)

        // const commitReq = {
		// 	proposalResponses,
		// 	proposal,
		// };
        // const commitProposal = channel.generateUnsignedTransaction(commitReq);

        // const signedCommitProposal = signProposal(commitProposal.toBuffer());

		// const response = await channel.sendSignedTransaction({
		// 	signedProposal: signedCommitProposal,
		// 	request: commitReq,
		// });
        // console.log(response)


		// const eh = channel.newChannelEventHub(peer);
		// // await transactionMonitor(txId.getTransactionID(), eh);


//############################### Transaction Offline Signing end ############################      

//****************************** Chain Code Data structures ******************************** */

let IssuedCertificates = {
    'certHashId' : {
    domainName :'',
    crtHashP1 : '',
    crtHashP2 : '',
    expiryDate : '',
    timeStampIssue : '',
    timeStampRevoke : '',
    isCertRevoked : ''
    }
}

let PendingRequest = {
    'domainName' : {
    domainName :'',
    csrHashP1 : '',
    csrHashP2 : '',
    docToken : '',
    isTokenVerified : '',
    timeStamp : '',
}
}
let UserDomains = {
    'userId': {
    issuedCertHashIds : [],
    pendingRequestDomains : [],
    issuedCertificates:{
        'certHashId' : {
            domainName :'',
            crtHashP1 : '',
            crtHashP2 : '',
            expiryDate : '',
            timeStampIssue : '',
            timeStampRevoke : '',
            isCertRevoked : ''
            }
    },
    pendingRequest : {
        'domainName' : {
            domainName :'',
            csrHashP1 : '',
            csrHashP2 : '',
            docToken : '',
            isTokenVerified : '',
            timeStamp : '',
        }
    }
}
}
let activeCertDomainsList =[]

async function getPendingRequest(domainName,userId){
    return UserDomains[userId].pendingRequest[domainName];
} 

async function getUserPendingRequestDomainsList(userId){
    return UserDomains[userId].pendingRequestDomains;
} 

async function getUserIssuedCertsHashIdsList(userId){
    return userDomains[userId].issuedCertHashIds;
}

async function getIssuedCert(certHashId, userId){
    return userDomains[userId].issuedCertifiticates[certHashId];
}
async function getActiveCertsDomainsList(){
    return activeCertDomainsList;
}


async function setPendingRequest(domainName, csrHashP1, csrHashP2, docToken, timeStamp, userId) {
        
    userDomains[userId].pendingRequests[domainName].domainName  = domainName;
    userDomains[userId].pendingRequests[domainName].csrHashP1  = csrHashP1;
    userDomains[userId].pendingRequests[domainName].csrHashP2  = csrHashP2;
    userDomains[userId].pendingRequests[domainName].docToken  = docToken;
    userDomains[userId].pendingRequests[domainName].timeStamp  = timeStamp;
    userDomains[userId].pendingRequests[domainName].isTokenVerified = false;
    userDomains[userId].pendingRequestDomains.push(domainName);
}
async function updatePendingReqTokenVerificationStatus(domainName, isTokenVerified, userId) {
    userDomains[userId].pendingRequests[domainName].isTokenVerified = isTokenVerified;
}

async function delPendingRequest(domainName,userId){
    delete userDomains[userId].pendingRequests[domainName];
    
    let len = userDomains[userId].pendingRequestDomains.length;
    for (let i = 0; i < len; i++) {
        if(userDomains[userId].pendingRequestDomains[i] == domainName){
            userDomains[userId].pendingRequestDomains[i] = userDomains[userId].pendingRequestDomains[len-1];
            userDomains[userId].pendingRequestDomains.pop();
            return;
        }
    }  
}

async function setIssuedCert(domainName, crtHashP1,crtHashP2, timeStampIssue, expiryDate, certHashId, userId) {

    userDomains[userId].issuedCertifiticates[certHashId].domainName  = domainName;
    userDomains[userId].issuedCertifiticates[certHashId].crtHashP1  = crtHashP1;
    userDomains[userId].issuedCertifiticates[certHashId].crtHashP2  = crtHashP2;
    userDomains[userId].issuedCertifiticates[certHashId].timeStampIssue = timeStampIssue;
    userDomains[userId].issuedCertifiticates[certHashId].isCertRevoked = false;
    userDomains[userId].issuedCertifiticates[certHashId].expiryDate = expiryDate;

    userDomains[userId].issuedCertHashIds.push(certHashId);
    activeCertDomainsList.push(domainName);

}

async function updateIssuedCertRevocationInformation(isCertRevoked, timeStampRevoke, certHashId, userId ) {
    userDomains[userId].issuedCertifiticates[certHashId].isCertRevoked = isCertRevoked;
    userDomains[userId].issuedCertifiticates[certHashId].timeStampRevoke = timeStampRevoke;

    let len = activeCertDomainsList.length;
    for (let i = 0; i < len; i++) {
        if(activeCertDomainsList[i] == userDomains[userId].issuedCertifiticates[certHashId].domainName){
            activeCertDomainsList[i] = activeCertDomainsList[len-1];
            activeCertDomainsList.pop();
            return;
        }
    }  
}

// async function registerPendingRequest(domainName,csrHashP1, csrHashP2, timeStamp, userId)
// {
// let docToken = keccak256(abi.encode(msg.sender, domainName, timeStamp, block.timestamp));
// setPendingRequest(domainName, csrHashP1, csrHashP2, docToken, timeStamp, userId);
// emit pendingRequestRegistered(docToken);
// }

async function verifyDOCToken(domainName, docToken, userId)
{
var pendingRequest = getPendingRequest(domainName,userId);

if(docToken == pendingRequest.docToken){
    updatePendingReqTokenVerificationStatus(domainName, true, userId);
    // emit tokenVerified(true);
    console.log("Token Verified")
}else{
    // emit tokenVerified(false);
    console.log("Token not Verified")
}
}
//****************************** Chain Code Data structures End ******************************** */



        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();
