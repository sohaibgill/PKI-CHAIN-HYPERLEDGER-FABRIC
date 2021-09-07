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
// const bcrypt = require('bcrypt');
// const saltRounds = 10;

class PkiChain extends Contract {

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

    async writeData(ctx, key,value) {
        const carAsBytes = await ctx.stub.putState(key,value); 
        return "success";
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

    async queryAllCerts(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    async changeCertOwner(ctx, certId, newOwner) {
        console.info('============= START : changeCertOwner ===========');

        const certAsBytes = await ctx.stub.getState(certId); // get the car from chaincode state
        if (!certAsBytes || certAsBytes.length === 0) {
            throw new Error(`${certId} does not exist`);
        }
        const cert = JSON.parse(certAsBytes.toString());
        cert.owner = newOwner;

        await ctx.stub.putState(certId, Buffer.from(JSON.stringify(cert)));
        console.info('============= END : changeCertOwner ===========');
    }
    //code from the 1.4 version

    

    async createUser(ctx, args) {
        let response = {};

        try{
          args = JSON.parse(args);
          // let hash = await bcrypt.hash(args.password, saltRounds);
          let newUser = new User(args.userId, args.firstName, args.lastName, args.password);
          let users = [];
          const exists = await this.myAssetExists(ctx, "Users");
          if(exists){
            users = await this.readMyAsset(ctx, "Users");
          }
          else{
            response.error = "No user exists";
          }
          users.push(newUser);
          await ctx.stub.putState("Users", Buffer.from(JSON.stringify(users)));

          response = `A User with user id ${newUser.userId} is registered successfully`;
        }
        catch(ex){
          response.error = 'Error while registering user';
        }
        return response;
      }
    
    //   async validateUser(ctx, args) {
    //     let response = {};
    //     try{
    //       args = JSON.parse(args);
    //       let users = [];
    //       const exists = await this.myAssetExists(ctx, "Users");
    //       if(exists){
    //         users = await this.readMyAsset(ctx, "Users");
    //       }
    //       else{
    //         let response = {};
    //         response.error = `User does not exist`;
    //         return response;
    //       }
    //       for (var i = users.length - 1; i >= 0; i--) {
    //         let verified = await bcrypt.compare(args.password, users[i].password);
    //         if (users[i].userId == args.userId && verified){
    //           response.success = true;
    //           return response;
    //         } 
    //       }
    //       if(!response.success){
    //         response.error = 'We could not find any user with these credentials';
    //       }
    //     }
    //     catch(ex){
    //       response.error = 'Error while validating user ' + ex;
    //     }
    //     return response;
    //   }
    
      async readAllUsers(ctx) {
        const exists = await this.myAssetExists(ctx, "Users");
        if (!exists) {
          let response = {};
          response.error = `No user exists`;
          return response;
        }
        const buffer = await ctx.stub.getState("Users");
        const asset = JSON.parse(buffer.toString());
        return asset;
      }
    
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
  
      // ======================== solidity Chain Codes ===========================

      async getVerifiableDomainUID(ctx,CN){
        try{
          let resp= await this.readMyAsset(ctx,'verifiableDomains');
          return resp[CN.toString('ascii')].UID;
          }
          catch(err){
            return err.message;
          }
      }

      async getVerifiableDomainName(ctx,CN){
        try{
          let resp= await this.readMyAsset(ctx,'verifiableDomains');
          return resp[CN.toString('ascii')].commonName;
          }
          catch(err){
            return err.message;
          }
      }

      async  getVerifiableDomainCsrHash(ctx,CN){
        try{
          let resp= await this.readMyAsset(ctx,'verifiableDomains');
          return resp[CN.toString('ascii')].csrHash;
          }
          catch(err){
            return err.message;
          }

      }
      async  getVerifiableDomainToken(ctx,CN){
        try{
          let resp= await this.readMyAsset(ctx,'verifiableDomains');
          return resp[CN.toString('ascii')].verificationToken;
          }
          catch(err){
            return err.message;
          }
      }
      async getVerifiableDomainRequestor(ctx,CN){
        try{
        let resp= await this.readMyAsset(ctx,'verifiableDomains');
        return resp[CN.toString('ascii')].UID;
        }
        catch(err){
          return err.message;
        }
      }

      async getVerifiedDomainUID(ctx,CN){
        try{
        let resp = await this.readMyAsset(ctx,'verifiedDomains');
        return resp[CN.toString('ascii')].UID;
        }
        catch(err){
          return err.message;
        }
      }

      async getVerifiedDomainName(ctx,CN){
        try{
          let resp = await this.readMyAsset(ctx,'verifiedDomains');
        if(resp[CN.toString('ascii')].commonName){
          return resp[CN.toString('ascii')].commonName;}
          else{
            return false
          }
        }
        catch(err){
          return "domain doesnot exist "+err.message;
        }
      }

      async  getVerifiedDomainCrtHash(ctx,CN){
        try{
          let resp = await this.readMyAsset(ctx,'verifiedDomains');
          return resp[CN.toString('ascii')].crtHash;
          }
          catch(err){
            return err.message;
          }
        }
      async getVerifiedDomainOwner(ctx,CN){
        try{
          let resp = await this.readMyAsset(ctx,'verifiedDomains');
          return resp[CN.toString('ascii')].UID;
          }
          catch(err){
            return err.message;
          }

      }

      async getAllVerifiedDomain(ctx,CN){

        try{
        let resp= await this.readMyAsset(ctx,'allVerifiedDomains');
        return resp[CN]; 
      }
      catch(err){
        return err.message
      }
    }
 
      async domainExistsUnverified(ctx,CN){
        try{
        if(await this.getVerifiableDomainName(ctx,CN) == CN){
          return true;
        }
        else{
          return false;
        }
      }
       catch(err){
          return  err.message + "domain doesnot exist ";
        }
      }

      async domainExists(ctx,CN,UID){
        try{
        let resp = await this.getVerifiedDomainName(ctx,CN)
        if(resp == CN){
          if(await this.getVerifiedDomainUID(ctx,CN) != UID && this.getAllVerifiedDomain(ctx,CN)){
            return true
          }
          else{
            return false;
          } 
        }  
        else{
          return false;
        }
      }
      catch(err){
        return err.message + "domain doesnot exist";
      }

      }

      async  verifyDomainToken(ctx,CN,TK){
        let storedToken = await this.getVerifiableDomainToken(ctx,CN);
        if(storedToken == TK){
          let csrHash = await this.getVerifiableDomainCsrHash(ctx,CN)
          return csrHash;
        }
        else{
          return "Not authorised to revoke"
        }
      }

      async delUserUnverifiedDomain(ctx,CN,UID){
        try{
        let resp = await this.readMyAsset(ctx,'UserDomains');
        let unverifiedDomains=resp[UID.toString('asci')]['unverifiedDomains']
        let entityIndex = unverifiedDomains.indexOf(CN)
          if(entityIndex != -1){
             unverifiedDomains.splice(entityIndex,1);
            resp[UID.toString('asci')]['unverifiedDomains']=unverifiedDomains
            await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(resp)))
            return "deleted"
          }
          else{
            return "domain does not found"
        }
      }
      catch(err){
        return "Invalid Entry";
      }
      }

      async delVerifiableDomain(ctx,CN){
        try{
        let resp = await this.readMyAsset(ctx,'verifiableDomains');
        if(resp[CN.toString('ascii')]){
          delete resp[CN.toString('ascii')]
          await ctx.stub.putState('verifiableDomains', Buffer.from(JSON.stringify(resp)))
          return "deleted"
        }
          else{
            return "domain already not Exists"
        }
      }
        catch(err){
          return "Invalid Entry";
        }
          
      }
      async deleteUserVerifiedDomain(ctx,CN,UID){
        try{
        await this.delUserVerifiedDomain(ctx,CN,UID)
        return "Verified Domains are Removed"
        }
        catch(err){
          return err.message;
        }

      }

      async setAllVerifiedDomain(ctx,CN,val){
        let resp = await this.readMyAsset(ctx,"allVerifiedDomains");
        resp[CN.toString('asci')] = JSON.parse(val);
        await ctx.stub.putState('allVerifiedDomains', Buffer.from(JSON.stringify(resp)))
        return "success in setAllUserUnverifiedDomain"

      } 

      async setUserUnverifiedDomain(ctx, CN, UID){
        let resp = await this.readMyAsset(ctx,'UserDomains');
        let unverifiedDomains=resp[UID.toString('asci')]['unverifiedDomains']
        unverifiedDomains.push(CN.toString("ascii"))
        resp[UID.toString('asci')]['unverifiedDomains']=unverifiedDomains
        await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(resp)))
        return "success in setUserUnverifiedDomain"
      }

      async setUserVerifiedDomain(ctx, CN, UID){
        let resp = await this.readMyAsset(ctx,'UserDomains');
        let verifiedDomains=resp[UID.toString('asci')]['verifiedDomains']
        verifiedDomains.push(CN.toString("ascii"))
        resp[UID.toString('asci')]['verifiedDomains']=verifiedDomains
        await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(resp)))
        return "success in setUserVerifiedDomain"
      }

      async setUserVerifiedDomainANDdelUserUnverifiedDomain(ctx, CN, UID){
        try{
        let resp = await this.readMyAsset(ctx,'UserDomains');
        let verifiedDomains=resp[UID.toString('asci')]['verifiedDomains']
        verifiedDomains.push(CN.toString("ascii"))
        resp[UID.toString('asci')]['verifiedDomains']=verifiedDomains

        let unverifiedDomains=resp[UID.toString('asci')]['unverifiedDomains']
        let entityIndex =unverifiedDomains.indexOf(CN)
          if(entityIndex != -1){
             unverifiedDomains.splice(entityIndex,1);
            resp[UID.toString('asci')]['unverifiedDomains']=unverifiedDomains
          }
          else{
            return "domain doesnot exists in the pending pool"
          }

        await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(resp)))
        return "success"
      }
      catch(err){
        return "Invalid User";
      }
    }

      async setVerifiableDomain(ctx,CN,csrHash,verificationToken,UID){
        let resp = await this.readMyAsset(ctx,'verifiableDomains')
        resp[CN.toString("ascii")]={commonName:CN.toString('ascii'),
        csrHash:csrHash.toString('ascii'),
        verificationToken:verificationToken.toString('ascii'),
        UID:UID.toString('ascii')}
        await ctx.stub.putState('verifiableDomains', Buffer.from(JSON.stringify(resp)))
        return "success in setVerifiableDomain"

      }
      async setVerifiedDomain(ctx,CN,crtHash,UID){
        let resp = await this.readMyAsset(ctx,'verifiedDomains')
        resp[CN.toString("ascii")]={commonName:CN.toString('ascii'),
        crtHash:crtHash.toString('ascii'),
        UID:UID.toString('ascii')}
        await ctx.stub.putState('verifiedDomains', Buffer.from(JSON.stringify(resp)))
        return "success in setVerifiedDomain"

      }
// in solidty smart contracrs, this function name is registerCRTRequest
      async registerCSRRequest(ctx,domainName,csrHash,TK,UID){
        if(domainName && UID){
        if(await this.domainExists(ctx,domainName,UID) == true){
          return "Domain Already Exists"
        }
        else{
          if(await this.domainExistsUnverified(ctx,domainName) == true){
            await this.delUserUnverifiedDomain(ctx,domainName,UID)
            await this.delVerifiableDomain(ctx,domainName)
            console.log( "deleted")
          }
          await this.setUserUnverifiedDomain(ctx,domainName,UID)
          await this.setVerifiableDomain(ctx,domainName,csrHash,TK,UID)
          return "emit doctoken and return token and domainName"
        }
      }
      else{
        return "Invalid Domain Entered"
      }

    }

      async unregisterCRTRequest(ctx,domainName,UID){
        try{
        if(await this.delUserUnverifiedDomain(ctx,domainName,UID) == 'deleted'){
          if(await this.delVerifiableDomain(ctx,domainName) == 'deleted'){
            return "emit CSRRemoved"  }
            else {
              let resp = this.delVerifiableDomain(ctx,domainName)
              return resp;
            }
      }
          else {
         let resp = this.delUserUnverifiedDomain(ctx,domainName,UID)
          return resp;
          }
        }
      catch(err){
        return err.message;
      }
      }
       async registerCRTDetails(ctx,commonName,csrHash,UID){
         if(commonName){
         if(await this.setUserVerifiedDomainANDdelUserUnverifiedDomain(ctx,commonName,UID)=='success'){
         await this.setVerifiedDomain(ctx,commonName,csrHash,UID)
        //  await this.delUserUnverifiedDomain(ctx,commonName,UID)
         await this.setAllVerifiedDomain(ctx,commonName,true)
         return `${commonName} is successfully registered`
         }
         else if(await this.setUserVerifiedDomainANDdelUserUnverifiedDomain(ctx,commonName,UID) == "domain doesnot exists in the pending pool"){
           return "domain doesnot exists in the unverified domain's list of User"
         }
         else if(await this.setUserVerifiedDomainANDdelUserUnverifiedDomain(ctx,commonName,UID) == "Invalid User"){
           return "Invalid User"
         }
         }
         else{
            return "Invalid DomainName Entered"
         }
       }

       async isVerified(ctx,CN){
         if(await this.getAllVerifiedDomain(ctx,CN) == true){
           return true;
         }
         if(await this.getAllVerifiedDomain(ctx,CN) == false){
           return false;
         }
         else{
           return  "Domain doesn't exist"
         }
       }
       async getVerifiedDomainOwner(ctx,CN){
        let resp = await this.readMyAsset(ctx,'verifiedDomains');
        try{
        return resp[CN.toString('ascii')].UID;
        }
        catch(err){
          return err.message
        }

       }
       async getUserVerifiedDomainsList(ctx,UID){
         try{
          let resp = await this.readMyAsset(ctx,'userDomains');
          resp = resp[UID.toString('ascii')]['verifiedDomains']
          return resp;
         }
        catch(err){
          return err.message
        }
       }

       async getUserRevokedDomainsList(ctx,UID){
        try{
         let resp = await this.readMyAsset(ctx,'userDomains');
         let resp1= resp[UID.toString('ascii')]['revokedDomains']
         let resp2 = resp[UID.toString('ascii')]['revokedDomainsCRTHash']
         return (resp1,resp2);
        }
       catch(err){
         return err.message
       }
      }

      async getUserUnVerifiedDomainsList(ctx,UID){
        try{
         let resp = await this.readMyAsset(ctx,'userDomains');
         resp = resp[UID.toString('ascii')]['unverifiedDomains']
         return resp;
        }
       catch(err){
         return err.message
       }
      }

       async getVerifiedDomainCRTHash(ctx,CN){
        let resp = await this.readMyAsset(ctx,'verifiedDomains');
        return resp[CN.toString('ascii')].crtHash;
       }

       async setUserRevokedDomain(ctx,CN,crtHash,UID){
        let resp = await this.readMyAsset(ctx,'UserDomains');
        let revokedDomains = resp[UID.toString('ascii')]['revokedDomains']
        let revokedDomainsCRTHash = resp[UID.toString('ascii')]['revokedDomainsCRTHash']
        let verifiedDomains=resp[UID.toString('asci')]['verifiedDomains']
        let CNindex = verifiedDomains.indexOf(CN)
        if(CNindex != -1){
          verifiedDomains.splice(CNindex,1);}
        revokedDomains.push(CN.toString("ascii"))
        revokedDomainsCRTHash.push(crtHash.toString('ascii'))
        resp[UID.toString('ascii')]['revokedDomains']=revokedDomains;
        resp[UID.toString('ascii')]['revokedDomainsCRTHash']=revokedDomainsCRTHash;
        resp[UID.toString('asci')]['verifiedDomains']=verifiedDomains
        return await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(resp)))
         

       }
       async delUserVerifiedDomain(ctx,CN,UID){
         try{
        let resp = await this.readMyAsset(ctx,'UserDomains');
        let verifiedDomains=resp[UID.toString('asci')]['verifiedDomains']
        let CNindex = verifiedDomains.indexOf(CN)
        if(CNindex != -1){
            verifiedDomains.splice(CNindex,1);}
        resp[UID.toString('asci')]['verifiedDomains']=verifiedDomains
        return await ctx.stub.putState('UserDomains', Buffer.from(JSON.stringify(resp)))
         }
         catch(err){
           return err.message;
         }
          }
        async delVerifiedDomains(ctx,CN){
          try{
            let resp = await this.readMyAsset(ctx,'verifiedDomains')
            delete resp[CN.toString('ascii')]
            await ctx.stub.putState('verifiedDomains',Buffer.from(JSON.stringify(resp)))
            return "deleted"
          }
          catch(err){
              return err.message;
            }
          }

       async revoke(ctx,CN,UID){
         if(CN && UID){
         if(await this.getVerifiedDomainOwner(ctx,CN) != UID  ){
           if( await this.getVerifiedDomainOwner(ctx,CN) == "Cannot read property 'UID' of undefined"){
             return  "invalid domain entered"
           }
           else{
           return "Domain doesnot exists"
         }
        }
         else if(await this.getVerifiedDomainOwner(ctx,CN) == UID ){
           let crtHash = [];
           crtHash = await this.getVerifiedDomainCrtHash(ctx,CN);
          
          // await this.delUserVerifiedDomain(ctx,CN,UID)
          await this.setAllVerifiedDomain(ctx,CN,false)
          await this.setUserRevokedDomain(ctx,CN,crtHash,UID)
          await this.delVerifiedDomains(ctx,CN)
          return `${CN} is Revoked successfully`
           
           }
         else{
           return "not authorized to Revoke"
         }
        }
        else{
          return "Invalid DomainName/UID"
        }
       }

}

module.exports = PkiChain;
