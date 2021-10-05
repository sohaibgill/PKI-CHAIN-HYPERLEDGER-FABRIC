/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
var crypto = require('crypto');
// const { createHmac } = await import('crypto');
// const { newCryptoSuite } = require('fabric-ca-client')
// const {Utils: utils} = require('fabric-common');
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
          }]

        let UserDomains = {
          'userId': {
          issuedCertHashIds : ['u'],
          pendingRequestDomains : ['l'],
          issuedCertificates:{
              'certHashId' : {
                  domainName :'y',
                  crtHashP1 : 'yu',
                  crtHashP2 : 'u',
                  expiryDate : 'i',
                  timeStampIssue : 'o',
                  timeStampRevoke : 'p',
                  isCertRevoked : 's'
                  }
          },
          pendingRequests : {
              'domainName' : {
                  domainName :'a',
                  csrHashP1 : 'b',
                  csrHashP2 : 'b',
                  docToken : 'b',
                  isTokenVerified : 'b',
                  timeStamp : 'b',
              }
          }
      }
      }
      let activeCertDomainsList = {activeCertDomainsList:["pki"]}


        await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(UserDomains)));
        await ctx.stub.putState('Cert1', Buffer.from(JSON.stringify(certs[0])));
        await ctx.stub.putState('activeCertDomainsList', Buffer.from(JSON.stringify(activeCertDomainsList)));
        console.info('Added <-->'); 
        
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

    async writeData(ctx, key,value) {
         await ctx.stub.putState(key,Buffer.from(JSON.stringify(value))); 
        console.log("Data is written")
        return "succesS"
    }
    
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
        let userDomains= await this.readMyAsset(ctx,'UserDomains');
        if(userDomains[userId]){
          if (userDomains[userId].pendingRequestDomains.indexOf(domainName)!=-1){
        return userDomains[userId].pendingRequests[domainName];
          }
          else{
            return "Domain does not Exists in pending pool"
          }
      }
      else{
        return "UserId doesnot Exists"
      }
    }
      catch(err){
        return err.message;
      }
  }
    
    async getUserPendingRequestDomainsList(ctx,userId){
      try{
        let userDomains = await this.readMyAsset(ctx,'UserDomains');
        return userDomains[userId].pendingRequestDomains;
      }
      catch(err){
        return err.message;
      }
  }
    
    async getUserIssuedCertsHashIdsList(ctx,userId){
      try{
        let userDomains = await this.readMyAsset(ctx,'UserDomains');
        return userDomains[userId].issuedCertHashIds;
      }
      catch(err){
        return err.message;
      }
    }
    
    async getIssuedCert(ctx,certHashId, userId){
      try{
        let userDomains = await this.readMyAsset(ctx,'UserDomains');
        return userDomains[userId].issuedCertifiticates[certHashId];
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
        if (userDomains[userId]){
          userDomains[userId].pendingRequests[domainName]={
            domainName  : domainName.toString("ascii"),
            csrHashP1  : csrHashP1.toString("ascii"),
            csrHashP2  : csrHashP2.toString("ascii"),
            docToken  : docToken.toString("ascii"),
            timeStamp  : timeStamp.toString("ascii"),
            isTokenVerified : false}
        userDomains[userId].pendingRequestDomains.push(domainName);
         await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(userDomains)))
         return "added"
      }
      else{
        userDomains[userId] = {
          pendingRequests : {[domainName]:{
            domainName  : domainName.toString("ascii"),
            csrHashP1  : csrHashP1.toString("ascii"),
            csrHashP2  : csrHashP2.toString("ascii"),
            docToken   : docToken.toString('ascii'),
            timeStamp : timeStamp.toString("ascii"),
            isTokenVerified : false}
          },
          pendingRequestDomains : [],
          issuedCertifiticates :{},
          issuedCertHashIds :[]
          }
            userDomains[userId].pendingRequestDomains.push(domainName);
            await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(userDomains)))
            return "newly added"      
          }
        }
      catch(err){
        return err.message;
      } 
    }


    async updatePendingReqTokenVerificationStatus(ctx,domainName, isTokenVerified, userId) {
      try{
        let userDomains = await this.readMyAsset(ctx,'UserDomains');
        if(userDomains[userId]){
        userDomains[userId.toString('ascii')].pendingRequests[domainName.toString('ascii')].isTokenVerified = isTokenVerified;
        await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(userDomains)))
        return "Updated"
        }
        else{
          return "UserId doesnot Exists"
        }
      }
      catch(err){
        return err.message;
      }
    }

    async setIssuedCertAndDelpendingRequest(ctx,domainName, crtHashP1,crtHashP2, timeStampIssue,timeStampRevoke, expiryDate,isCertRevoked, certHashId, userId) {
      try{
        let userDomains = await this.readMyAsset(ctx,'UserDomains');
        let activeCertDomainsList = await this.readMyAsset(ctx,'activeCertDomainsList');
        if (userDomains[userId]){
                userDomains[userId].issuedCertifiticates[certHashId]=
                { 
              domainName  : domainName,
              crtHashP1  : crtHashP1,
              crtHashP2  : crtHashP2,
              timeStampIssue : timeStampIssue,
              isCertRevoked : isCertRevoked,
              expiryDate : expiryDate,
              timeStampRevoke:timeStampRevoke
                }
            
                userDomains[userId].issuedCertHashIds.push(certHashId);
                activeCertDomainsList['activeCertDomainsList'].push(domainName);

                delete userDomains[userId].pendingRequests[domainName];
        
                let entityIndex = userDomains[userId].pendingRequestDomains.indexOf(domainName);

                if(entityIndex != -1){
                 userDomains[userId].pendingRequestDomains.splice(entityIndex,1)}
                else{
                    return "domain doesnot exists in the pending list"
                  }

                await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(userDomains)))
                await ctx.stub.putState('activeCertDomainsList', Buffer.from(JSON.stringify(activeCertDomainsList)))
                return 'success'
              }
         else{
                userDomains[userId] ={ 
                issuedCertifiticates : {[certHashId] : 
              { 
              domainName  : domainName,
              crtHashP1  : crtHashP1,
              crtHashP2  : crtHashP2,
              timeStampIssue : timeStampIssue,
              isCertRevoked : isCertRevoked,
              expiryDate : expiryDate,
              timeStampRevoke:timeStampRevoke
            }
            },
            issuedCertHashIds:[],
            pendingRequests :{},
            pendingRequestDomains : []
          }
       
           userDomains[userId].issuedCertHashIds.push(certHashId);
           
           activeCertDomainsList['activeCertDomainsList'].push(domainName);
           await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(userDomains)))
           await ctx.stub.putState('activeCertDomainsList', Buffer.from(JSON.stringify(activeCertDomainsList)))
           return userDomains
     }
        }
      catch(err){
        return err.message;
      } 
    }

    
    async delPendingRequest(ctx,domainName,userId){
      try{
        let userDomains = await this.readMyAsset(ctx,'UserDomains');
        if(userDomains[userId]){
        delete userDomains[userId].pendingRequests[domainName];
        
        let entityIndex = userDomains[userId].pendingRequestDomains.indexOf(domainName);

        if(entityIndex != -1){
          userDomains[userId].pendingRequestDomains.splice(entityIndex,1)}
          else{
            return "domain doesnot exists in the pending list"
          }
         await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(userDomains)))
        return "deleted"
          }
          else{
          return "UserId does not Exists"
           }
        } 
          catch(err){
            return err.message; 
          }
        }
    async setIssuedCert(ctx,domainName, crtHashP1,crtHashP2, timeStampIssue,timeStampRevoke, expiryDate,isCertRevoked, certHashId, userId) {
      try{
        let userDomains = await this.readMyAsset(ctx,'UserDomains');
        let activeCertDomainsList = await this.readMyAsset(ctx,'activeCertDomainsList');
        if (userDomains[userId]){
                userDomains[userId].issuedCertifiticates[certHashId]=
                { 
              domainName  : domainName,
              crtHashP1  : crtHashP1,
              crtHashP2  : crtHashP2,
              timeStampIssue : timeStampIssue,
              isCertRevoked : isCertRevoked,
              expiryDate : expiryDate,
              timeStampRevoke:timeStampRevoke
                }
            
                userDomains[userId].issuedCertHashIds.push(certHashId);
                activeCertDomainsList['activeCertDomainsList'].push(domainName);
                await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(userDomains)))
                await ctx.stub.putState('activeCertDomainsList', Buffer.from(JSON.stringify(activeCertDomainsList)))
                return 'success'
              }
         else{
                userDomains[userId] ={ 
                issuedCertifiticates : {[certHashId] : 
              { 
              domainName  : domainName,
              crtHashP1  : crtHashP1,
              crtHashP2  : crtHashP2,
              timeStampIssue : timeStampIssue,
              isCertRevoked : isCertRevoked,
              expiryDate : expiryDate,
              timeStampRevoke:timeStampRevoke
            }
            },
            issuedCertHashIds:[],
            pendingRequests :{},
            pendingRequestDomains : []
          }
       
           userDomains[userId].issuedCertHashIds.push(certHashId);
           
           activeCertDomainsList['activeCertDomainsList'].push(domainName);
           await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(userDomains)))
           await ctx.stub.putState('activeCertDomainsList', Buffer.from(JSON.stringify(activeCertDomainsList)))
           return userDomains
     }
        }
      catch(err){
        return err.message;
      } 
    }
    
    async updateIssuedCertRevocationInformation(ctx,isCertRevoked, timeStampRevoke, certHashId, userId ) {
      try{
        let userDomains = await this.readMyAsset(ctx,'UserDomains');
        let activeCertDomainsList = await this.readMyAsset(ctx,'activeCertDomainsList');
        if(userDomains[userId]){
        userDomains[userId].issuedCertifiticates[certHashId].isCertRevoked = isCertRevoked;
        userDomains[userId].issuedCertifiticates[certHashId].timeStampRevoke = timeStampRevoke;
        let domainName = userDomains[userId].issuedCertifiticates[certHashId].domainName
        
        let entityIndex = activeCertDomainsList.activeCertDomainsList.indexOf(domainName);
        if(entityIndex != -1){
          activeCertDomainsList['activeCertDomainsList'].splice(entityIndex,1)
        }
        else{
          return "certHashID does not Exists"
        }
        await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(userDomains)))
        await ctx.stub.putState('activeCertDomainsList', Buffer.from(JSON.stringify(activeCertDomainsList)))
        return 'updated'
    }
    else{
      return "UserID doesnot Exists"
    }
  }
    catch(err){
      return err.message;
    }
  }
    
    async registerPendingRequest(ctx,domainName,csrHashP1, csrHashP2, timeStamp, userId){
    try {
    let docToken = crypto.createHash('md5').update(domainName,timeStamp).digest('hex')
    await this.setPendingRequest(ctx,domainName, csrHashP1, csrHashP2, docToken, timeStamp, userId);
    // emit pendingRequestRegistered(docToken);
    console.info("Pending Request is added")
    return docToken
    }
    catch(err){
      return err.message;
    }
  }
    async verifyDOCToken(ctx,domainName, docToken, userId)
      {
      try{
        let pendingRequest = await this.getPendingRequest(ctx,domainName,userId);
        if(pendingRequest =="UserId doesnot Exists"){
          return pendingRequest}
        else{
        if(docToken == pendingRequest.docToken){
            let resp = await this.updatePendingReqTokenVerificationStatus(ctx,domainName, true, userId);
           // emit tokenVerified(true);
            return `Token Verified ${resp}`
         }
        else{
          // emit tokenVerified(false);
          return "Token not Verified"
          }
        }
        }
      catch(err){
         return err.message;
       }
    }
    
    async removePendingRequest(ctx,domainName, userId)
    {
      try{
        await this.delPendingRequest(ctx,domainName, userId);
        return "removed"
    }
      catch(err){
        return err.message;
    }
    }
    
    async registerIssuedCert(ctx,domainName, crtHashP1,crtHashP2,  timeStampIssue,timeStampRevoke,  expiryDate,  userId) 
    {
      try{
        let pendingRequest = await this.getPendingRequest(ctx,domainName,userId);
        if (pendingRequest!= 'Domain does not Exists in pending pool'){
    
        if(pendingRequest.isTokenVerified){
    
            let certHashId = crypto.createHash('md5').update(crtHashP1,crtHashP2).digest('hex')
    
            let resp = await this.setIssuedCertAndDelpendingRequest(ctx,domainName,crtHashP1,crtHashP2,timeStampIssue,timeStampRevoke,expiryDate,true,certHashId,userId);
            // await this.delPendingRequest(ctx,domainName, userId);
            return resp
        }else{
            // emit docTokenVerificationFailed("check:doctvf");
            console.log("token Verification failed")
            return " not registered"
        }
      }
      else{
        return pendingRequest;
      }
        }
        catch(err){
          return err.message;
      }
    }
    async revokeIssuedCert(ctx,certHashId, timeStampRevoke, userId)
    {
      try{
        let response=  await this.updateIssuedCertRevocationInformation(ctx,true, timeStampRevoke, certHashId, userId);
        return response;
      }
      catch(err){
        return err.message;
      }
    }

    async hashh(ctx,secret){
      return  crypto.createHash('md5').update(secret).digest('hex')
    }
  }
 

module.exports = PKI;