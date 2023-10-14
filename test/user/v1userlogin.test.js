const chai = require('chai');
// const app = require('../../app'); // Replace with the actual path to your Express app
const expect = chai.expect;
const axios = require('axios');
const apiURL = "http://localhost:3200"


describe('/api/v1/user/login', () => {

    // before(function (done) {
    //     setTimeout(done, 3000); 
    // });
    it('should return an error response for invalid companyMailId', async () => {
        try {
            await axios.post(apiURL + "/api/v1/user/login", {
                companyMailId: 'invalidUsername',
                password: 'invalidPassword'
            });


        } catch (error) {
            expect(error.response.status).to.equal(422);
            expect(error.response.data).to.have.property('message', 'companyMailId must be a valid email');
        }
    });

    it('should return an error response for Incorrect password', async () => {
        try {
            await axios.post(apiURL + "/api/v1/user/login", {
                companyMailId: 'jasim@animeta.ai',
                password: 'wrongPassword'
            });


        } catch (error) {
            expect(error.response.status).to.equal(409);
            expect(error.response.data).to.have.property('message', 'Incorrect password');
        }
    });
    it('should return an error response for if companyMailId is empty', async () => {
        try {
            await axios.post(apiURL + "/api/v1/user/login", {
                companyMailId: '',
                password: 'wrongPassword'
            });


        } catch (error) {
            expect(error.response.status).to.equal(422);
            expect(error.response.data).to.have.property('message', 'companyMailId is not allowed to be empty');
        }
    });
    it('should return Success response when give valid credentials 200', async () => {
        try {
           const res =  await axios.post(apiURL + "/api/v1/user/login", {
                companyMailId: 'invalidUsername',
                password: 'invalidPassword'
            });

            expect(res.status).to.equal(200);
            expect(res.data).to.have.property('token');
            expect(res.data).to.have.property('message', 'User Login Success",');


        } catch (error) {
           console.log(error.response.status)
        }
    });
    
});