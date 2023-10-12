const express = require('express');
const router = express.Router();

const userController = require('../controller/userController')


router.post('/userAuth',userController.loginOrRegister)


module.exports = router;