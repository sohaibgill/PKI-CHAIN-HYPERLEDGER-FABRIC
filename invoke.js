/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
/* eslint-disable */
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path')
const {Client, User,ProposalResponse,Proposal,Commit} = require('fabric-common');
const sendProposal = require('./lib/index.js').sendProposal
// const {User} = require('User')

async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('pki');
        // console.log(contract)
        // const userIdentity = await wallet.get('appUser');
        // if (userIdentity) {
        //     console.log(userIdentity);
        // }




//=======================STAR OF OFFLINE SIGNING========================================
let channel = network.getChannel('mychannel')
// let user = network.getUser('appUser')
let client = gateway.client
// console.log(client)

// console.log(channel)
function getUser(){
    let user;
    const certpath = path.resolve('..', '..', 'pki', 'javascript', 'wallet', 'appUser.id')
    let pemCert = JSON.parse(fs.readFileSync(certpath,"utf8")).credentials.certificate
    // const certpath = path.resolve('..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com','users','Admin@org1.example.com','msp','signcerts','cert.pem')
    // let pemCert = fs.readFileSync(certpath,"utf8")
    // const privKeypath = path.resolve('..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com','users','Admin@org1.example.com','msp','keystore','c76e381734df2320b10b363a127cf283e90ae8c10307e759ae3f1c16aa628ce1_sk')
    // let privateKeyPEM = fs.readFileSync(privKeypath,"utf8")
    let privateKeyPEM = JSON.parse(fs.readFileSync(certpath,"utf8")).credentials.privateKey
    user = User.createUser('appUser','','Org1MSP',pemCert,privateKeyPEM)
    return {user,privateKeyPEM}
}
// const handler = discovery.newHandler();
let user = getUser();
    // console.log(user.user)
    let proposal ={
            client : client,
                user : user.user,
                privateKeyPEM : user.privateKeyPEM,
                channel : channel,
                chaincode : 'pki',
                fcn : 'queryCerts',
                args : ["Cert0"]
    }
// console.log(channel.getEndorsers())
let  ProposalResponse = await sendProposal(proposal)
// console.log(ProposalResponse.responses)
console.log("separater")
let endorsement = ProposalResponse.responses[1].endorsement
// endorsement = Buffer.from(endorsement).toString('ascii')
let payload1 = ProposalResponse.responses[0].response.payload
let payload2 = ProposalResponse.responses[1].response.payload
let payload = ProposalResponse.responses[1].payload
console.log(`payload1 : ${Buffer.from(payload1).toString('utf-8')}`)
console.log(`payload2 : ${Buffer.from(payload2).toString('ascii')}`)
console.log( `Payload : ${Buffer.from(payload).toString('ascii')}`)
console.log(`Endorsement `)
console.log(endorsement)
let commitment = channel.newCommit('pki')
let idx = client.newIdentityContext(user.user);
// let commiter = new Commit('pki','mychannel')
// // console.log(commiter)
// // console.log(commitment)
let commit = commitment.build(idx,{endorsement:endorsement.signature})
// console.log(channel.getCommitters())


// commitment._endorsement = ProposalResponse
// console.log(commitment)
// var proposalDigest = user.user.getCryptoSuite().hash(commit.toString(), { algorithm: 'SHA2' })
// let ordererResponse = await commitment.send({ targets: channel.getCommitters() })

// let responses  =  commitment.send({ targets: channel.getCommitters() })
// const p1 = new Proposal('pki','mychannel')
// console.log(p1.verifyProposalResponse({ProposalResponse}))

// let commitProposal = {
//     proposalResponses,
//     proposal
// }
// console.log(channel.getCommitter())


//***************************END OF OFFLINE SIGNING ********************************** */




//======================== DATA STRUCTURES =======================
const UserDomains = {
    U1:{
        revokedDomains:['LSE','UOL'],
        revokedDomainsCRTHash:['LSEcrt','UOLcrt'],
        verifiedDomains:['pki','ssl'],
        unverifiedDomains:['GIKI','UMT']
    },
    U2:{
        revokedDomains:['FAST','LUMS'],
        revokedDomainsCRTHash:['FASTcrt','LUMScrt'],
        verifiedDomains:['google','domain1'],
        unverifiedDomains:['NUST','domain2']
    }
}
const verifiedDomains = {
    pki:{
        commonName : 'pki',
        crtHash : 'pkicrt',
        UID : 'U1'
    },
    ssl:{
        commonName : 'ssl',
        crtHash : 'sslcrt',
        UID : 'U1'
    },
    google:{
        commonName : 'google',
        crtHash : 'googlecrt',
        UID : 'U2'
    },
    domain1:{
        commonName : 'domain1',
        crtHash : 'domain1crt',
        UID : 'U2'
    }
}
const allVerifiedDomains ={
    pki : true,
    google : true,
    UET : false,
    GIKI : false
};
const verifiableDomains ={
        GIKI :{
            commonName : 'GIKI',
            csrHash : 'GIKIcsr',
            verificationToken : 'GIKI_token',
            UID : 'U1'
        },
        NUST :{
            commonName : 'NUST',
            csrHash : 'NUSTcsr',
            verificationToken : 'NUST_token',
            UID : 'U2'
        }
}
//**************************END OF DATA STRUCTRES **************************************/

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR12', 'Dave')
        // await contract.submitTransaction('createCert', 'Cert1', 'xyz5.com', 'Lahore', 'xyz5');
        // console.log('Transaction has been submitted');
        // await contract.submitTransaction('writeData','verifiedDomains',JSON.stringify(verifiedDomains));
        // console.log('verifiedDomains Pushed in blockchain');
        // await contract.submitTransaction('writeData','UserDomains',JSON.stringify(UserDomains));
        // console.log('UserDomains Pushed in blockchain');
        // await contract.submitTransaction('writeData','allVerifiedDomains',JSON.stringify(allVerifiedDomains));
        // console.log('allVerifiedDomains Pushed in blockchain');
        // await contract.submitTransaction('writeData','verifiableDomains',JSON.stringify(verifiableDomains));
        // console.log('verifiableDomains Pushed in blockchain');
        // await sendProposal(proposal, async (response)=>{
        //     // await gateway.disconnect();
        //     console.log("proposal sent")
        // })

        // let response = await contract.submitTransaction('revoke','domain1','U2')
        // console.log(response.toString('ascii'))

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();
