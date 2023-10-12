const express = require('express');
const router = express.Router();

const businessController = require('../controller/bussinesController');
const authorizeBusiness = require('../middleware/businessAuth')

router.post("/register",businessController.register);
router.post("/login",businessController.login);
router.post("/addLostItem",authorizeBusiness.authorizeBusiness,businessController.addLostItem);



module.exports = router;