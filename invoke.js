/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
/* eslint-disable */
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

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
//**************************END OF DATA STRUCTRES */
        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR12', 'Dave')
        // await contract.submitTransaction('createCert', 'Cert1', 'xyz5.com', 'Lahore', 'xyz5');
        // console.log('Transaction has been submitted');
        await contract.submitTransaction('writeData','verifiedDomains',JSON.stringify(verifiedDomains));
        console.log('verifiedDomains Pushed in blockchain');
        await contract.submitTransaction('writeData','UserDomains',JSON.stringify(UserDomains));
        console.log('UserDomains Pushed in blockchain');
        await contract.submitTransaction('writeData','allVerifiedDomains',JSON.stringify(allVerifiedDomains));
        console.log('allVerifiedDomains Pushed in blockchain');
        await contract.submitTransaction('writeData','verifiableDomains',JSON.stringify(verifiableDomains));
        console.log('verifiableDomains Pushed in blockchain');

        let response = await contract.submitTransaction('revoke','domain1','U2')
        console.log(response.toString('ascii'))

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();
