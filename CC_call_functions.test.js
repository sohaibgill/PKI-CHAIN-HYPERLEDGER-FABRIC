'use strict';
/* eslint-disable */
// Unit testing function for the UnregisterCRTRequests Chain Code
const test_UnregisterCRTRequest = require("./CC_call_functions").test_UnregisterCRTRequest;
describe('testing UnregisterCRTRequests',() => {
it("when invalid/Null domain is entered by the user, it should return domain does not found,", async () => {
    const data= await test_UnregisterCRTRequest(" ",'U1')
    expect(data).toBe("domain does not found");
});
it("when already existed domain is entered by the different user, it should return Invalid User", async () => {
    const data= await test_UnregisterCRTRequest("www",'U1')
    expect(data).toBe("domain does not found");
});
it("when already existed domain is entered by the different user, it should return Invalid User", async () => {
    const data= await test_UnregisterCRTRequest("PU",'U2')
    expect(data).toBe("domain does not found");
});
it("when invalid/Null domain/user is entered by the user, it should return domain does not found,", async () => {
    const data= await test_UnregisterCRTRequest("PU",'U3')
    expect(data).toBe("Invalid Entry");
});
it("return emit SCRRemoved for valid domain name and User ID", async () => {
    const data= await test_UnregisterCRTRequest("PU",'U1')
    expect(data).toBe("emit CSRRemoved");
});
})


// Unit testing function for the registerCSRRequest Chain Code
const test_registerCSRRequest = require("./CC_call_functions").test_registerCSRRequest;
describe('testing registerCSRRequest',() =>{
it(" when invalid/Null domain is entered by the user, it should return invalid Domain entered,", async () => {
    const output = await test_registerCSRRequest("",'UETcsr','UETToken','U1')
    expect(output).toBe("Invalid Domain Entered");
});
it(" when already existed domain is entered by the different user, it should return Domain Already Exists,", async () => {
    const output = await test_registerCSRRequest("UET",'UETcsr','UETToken','U1')
    expect(output).toBe("Domain Already Exists");
});
it(" when already existed domain is entered by the same user, it should return 'emit doctoken and return token and domainName' and update the already existing domain,", async () => {
    const output = await test_registerCSRRequest("UET",'UETcsr','UETToken','U2')
    expect(output).toBe("emit doctoken and return token and domainName");
});
it(" when new domain is entered by the same user, it should return 'emit doctoken and return token and domainName' of the new domain, and enter a new domain", async () => {
    const output = await test_registerCSRRequest("UCP",'UCPcsr','UCPToken','U1')
    expect(output).toBe("emit doctoken and return token and domainName");
});
});

// Unit testing function for the registerCRTDetails Chain Code
const test_registerCRTDetails = require('./CC_call_functions').test_registerCRTDetails
describe("testing registerCRTDetails",() =>{
    it("When entereed data is correct, then it should return domain is succesfully registered", async () => {
        let CN= 'ITU';
        const data = await test_registerCRTDetails(CN,'ITUcsr','U1')
        expect(data).toBe(`${CN} is successfully registered`)

    });
    it("When Null/Invalid domainName is entered, then it should return Invalid DomainName Entered", async () => {
        let CN= ''
        const data = await test_registerCRTDetails(CN,'','')
        expect(data).toBe("Invalid DomainName Entered")
    
});
it("When invalid user is entered, then it should return :invalid Entry", async () => {
    let CN= 'ITU';
    const data = await test_registerCRTDetails(CN,'ITUcsr','U3')
    expect(data).toBe("Invalid User")

});
it("if domain does not present at the pending pool, then it should return :invalid Entry", async () => {
    let CN= 'IT';
    const data = await test_registerCRTDetails(CN,'ITUcsr','U2')
    expect(data).toBe("domain doesnot exists in the unverified domain's list of User")

});
});

// Unit testing function for the Revoke Chain Code
const test_revocation = require('./CC_call_functions').test_revocation
describe("testing_revocation",() =>{
    it("if invalid user trying to revoke the domain, then it should return :domain doesnot exist", async () => {
        let CN= 'pki';
        const data = await test_revocation(CN,'U2')
        expect(data).toBe("Domain doesnot exists")
});
it("if invalid domain is entered to revoke the domain, then it should return :domain doesnot exist", async () => {
    let CN= 'IT';
    const data = await test_revocation(CN,'U7')
    expect(data).toBe("invalid domain entered")
});
it("if valid domain is entered to revoke the domain, then it should return :DomainName is succesfully revoked", async () => {
    let CN= 'pki';
    const data = await test_revocation(CN,'U1')
    expect(data).toBe(`${CN} is Revoked successfully`)
});

});