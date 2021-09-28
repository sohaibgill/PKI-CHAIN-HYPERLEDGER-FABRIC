/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
// let Certificate = require('./Certificate.js');
// let User = require('./User.js');
const path = require('path');
const fs = require('fs');
// var pem = require('pem');
// const saltRounds = 10;

class PKI extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const certs = [
            {
                domain: 'xyz1.com',
                OrgName: 'xyz1',
                location: 'Lahore',
                owner: 'abc1',
            },
            {
                domain: 'xyz2.com',
                OrgName: 'xyz2',
                location: 'Sahiwal',
                owner: 'abc2',
            },
            {
                domain: 'xyz3.com',
                OrgName: 'xyz3',
                location: 'Islamabad',
                owner: 'abc3',
            }

        ];
        for (let i = 0 ; i < certs.length; i++) {
            certs[i].docType = 'certificate';
            await ctx.stub.putState('Cert'+i, Buffer.from(JSON.stringify(certs[i])));
            console.info('Added <--> ', certs[i]); 
        }
        console.info('============= END : Initialize Ledger ===========');

    }
    async queryCerts(ctx,certId){
        const certAsBytes = await ctx.stub.getState(certId);
        if (!certAsBytes || certAsBytes.length == 0) {
            throw new Error(`${certId} does not exist`);
        }
        console.log(certAsBytes.toString());
        
        return certAsBytes.toString();

    }

    // async writeData(ctx, key,value) {
    //      await ctx.stub.putState(key,Buffer.from(JSON.stringify(value))); 
    //     console.log("Data is written")
    // }
    async createCert(ctx, certId, OrgName, location, owner) {
        console.info('============= START : Create Certificate ===========');

        const cert = {
            OrgName,
            docType: 'certificate',
            location,
            owner,
        };

        await ctx.stub.putState(certId, Buffer.from(JSON.stringify(cert)));
        console.info('============= END : Create Certificate ===========');
    }

    async changeCertOwner(ctx, certId, newOwner) {
        console.info('============= START : changeCertOwner ===========');

        const certAsBytes = await ctx.stub.getState(certId); 
        if (!certAsBytes || certAsBytes.length === 0) {
            throw new Error(`${certId} does not exist`);
        }
        const cert = JSON.parse(certAsBytes.toString());
        cert.owner = newOwner;

        await ctx.stub.putState(certId, Buffer.from(JSON.stringify(cert)));
        console.info('============= END : changeCertOwner ===========');

    }
    //code from the 1.4 version
    
      async readMyAsset(ctx, myAssetId) {
        const exists = await this.myAssetExists(ctx, myAssetId);
        if (!exists) {
          let response = {};
          response.error = `The asset ${myAssetId} does not exist`;
          return response;
        }
        const buffer = await ctx.stub.getState(myAssetId);
        const asset = JSON.parse(buffer.toString());
        return asset;
      }
    
      async myAssetExists(ctx, myAssetId) {
        const buffer = await ctx.stub.getState(myAssetId);
        return (!!buffer && buffer.length > 0);
      }
  
//       // ======================== solidity Chain Codes ===========================



//  ########################## Refactored Chain codes ##########################


    async getPendingRequest(ctx,domainName,userId){
      try{
        let UserDomains= await this.readMyAsset(ctx,'UserDomains');
        return UserDomains[userId].pendingRequest[domainName];
      }
      catch(err){
        return err.message;
      }
  }
    
    async getUserPendingRequestDomainsList(ctx,userId){
      try{
        let UserDomains = await this.readMyAsset(ctx,'UserDomains');
        return UserDomains[userId].pendingRequestDomains;
      }
      catch(err){
        return err.message;
      }
  }
    
    async getUserIssuedCertsHashIdsList(ctx,userId){
      try{
        let UserDomains = await this.readMyAsset(ctx,'UserDomains');
        return UserDomains[userId].issuedCertHashIds;
      }
      catch(err){
        return err.message;
      }
    }
    
    async getIssuedCert(ctx,certHashId, userId){
      try{
        let UserDomains = await this.readMyAsset(ctx,'UserDomains');
        return UserDomains[userId].issuedCertifiticates[certHashId];
      }
      catch(err){
        return err.message;
      } 
    }


    async getActiveCertsDomainsList(ctx){
      try{
        let activeCertDomainsList = await this.readMyAsset(ctx,'activeCertDomainsList');
        return activeCertDomainsList;;
      }
      catch(err){
        return err.message;
      }
    }
    
    
    async setPendingRequest(ctx,domainName, csrHashP1, csrHashP2, docToken, timeStamp, userId) {
      try{
        let userDomains = await this.readMyAsset(ctx,'UserDomains');
        userDomains[userId].pendingRequests[domainName].domainName  = domainName;
        userDomains[userId].pendingRequests[domainName].csrHashP1  = csrHashP1;
        userDomains[userId].pendingRequests[domainName].csrHashP2  = csrHashP2;
        userDomains[userId].pendingRequests[domainName].docToken  = docToken;
        userDomains[userId].pendingRequests[domainName].timeStamp  = timeStamp;
        userDomains[userId].pendingRequests[domainName].isTokenVerified = false;
        userDomains[userId].pendingRequestDomains.push(domainName);
        return await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(userDomains)))
      }
      catch(err){
        return err.message;
      } 
    }


    async updatePendingReqTokenVerificationStatus(ctx,domainName, isTokenVerified, userId) {
      try{
        let userDomains = await this.readMyAsset(ctx,'UserDomains');
        userDomains[userId].pendingRequests[domainName].isTokenVerified = isTokenVerified;
        return await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(userDomains)))
      }
      catch(err){
        return err.message;
      }
    }
    
    // async delPendingRequest(ctx,domainName,userId){
    //     delete userDomains[userId].pendingRequests[domainName];
        
    //     let len = userDomains[userId].pendingRequestDomains.length;
    //     for (let i = 0; i < len; i++) {
    //         if(userDomains[userId].pendingRequestDomains[i] == domainName){
    //             userDomains[userId].pendingRequestDomains[i] = userDomains[userId].pendingRequestDomains[len-1];
    //             userDomains[userId].pendingRequestDomains.pop();
    //             return;
    //         }
    //     }  
    // }
    
    // async setIssuedCert(ctx,domainName, crtHashP1,crtHashP2, timeStampIssue, expiryDate, certHashId, userId) {
    //   try{
    //     let userDomains = await this.readMyAsset(ctx,'UserDomains');
    //     let activeCertDomainsList = await this.readMyAsset(ctx,'activeCertDomainsList');
    //     userDomains[userId].issuedCertifiticates[certHashId].domainName  = domainName;
    //     userDomains[userId].issuedCertifiticates[certHashId].crtHashP1  = crtHashP1;
    //     userDomains[userId].issuedCertifiticates[certHashId].crtHashP2  = crtHashP2;
    //     userDomains[userId].issuedCertifiticates[certHashId].timeStampIssue = timeStampIssue;
    //     userDomains[userId].issuedCertifiticates[certHashId].isCertRevoked = false;
    //     userDomains[userId].issuedCertifiticates[certHashId].expiryDate = expiryDate;
    
    //     userDomains[userId].issuedCertHashIds.push(certHashId);
    //     activeCertDomainsList.push(domainName);
    //     await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(userDomains)))
    //     await ctx.stub.putState('activeCertDomainsList', Buffer.from(JSON.stringify(activeCertDomainsList)))
    //     return 'success'
    //   }
    //   catch(err){
    //     return err.message;
    //   } 
    // }
    
    // async updateIssuedCertRevocationInformation(ctx,isCertRevoked, timeStampRevoke, certHashId, userId ) {
    //     userDomains[userId].issuedCertifiticates[certHashId].isCertRevoked = isCertRevoked;
    //     userDomains[userId].issuedCertifiticates[certHashId].timeStampRevoke = timeStampRevoke;
    
    //     let len = activeCertDomainsList.length;
    //     for (let i = 0; i < len; i++) {
    //         if(activeCertDomainsList[i] == userDomains[userId].issuedCertifiticates[certHashId].domainName){
    //             activeCertDomainsList[i] = activeCertDomainsList[len-1];
    //             activeCertDomainsList.pop();
    //             return;
    //         }
    //     }  
    // }
    
    // // async function registerPendingRequest(ctx,domainName,csrHashP1, csrHashP2, timeStamp, userId)
    // // {
    // // let docToken = keccak256(abi.encode(msg.sender, domainName, timeStamp, block.timestamp));
    // // await this.setPendingRequest(ctx,domainName, csrHashP1, csrHashP2, docToken, timeStamp, userId);
    // // emit pendingRequestRegistered(docToken);
    // // }
    
    // async verifyDOCToken(ctx,domainName, docToken, userId)
    // {
    // var pendingRequest = await this.getPendingRequest(ctx,domainName,userId);
    
    // if(docToken == pendingRequest.docToken){
    //     await this.updatePendingReqTokenVerificationStatus(ctx,domainName, true, userId);
    //     // emit tokenVerified(true);
    //     console.log("Token Verified")
    // }else{
    //     // emit tokenVerified(false);
    //     console.log("Token not Verified")
    // }
    // }
    
    // async removePendingRequest(ctx,domainName, userId)
    // {
    //     await this.delPendingRequest(ctx,domainName, userId);
    // }
    
    // async registerIssuedCert(ctx,domainName, crtHashP1,crtHashP2,  timeStampIssue,  expiryDate,  userId) 
    // {
    //     let pendingRequest = await this.getPendingRequest(ctx,domainName,userId);
    
    //     if(pendingRequest.isTokenVerified){
    
    //         // let certHashId = keccak256(abi.encode(crtHashP1,crtHashP2));
    
    //         await this.setIssuedCert(ctx,domainName,crtHashP1,crtHashP2,timeStampIssue,expiryDate,certHashId,userId);
    //         await this.delPendingRequest(ctx,domainName, userId);
    //     }else{
    //         // emit docTokenVerificationFailed("check:doctvf");
    //         console.log("token Verification failed")
    //     }
       
    // }
    
    // async revokeIssuedCert(ctx,certHashId, timeStampRevoke, userId)
    // {
    // await this.updateIssuedCertRevocationInformation(ctx,true, timeStampRevoke, certHashId, userId);
     
    // }

}

module.exports = PKI;