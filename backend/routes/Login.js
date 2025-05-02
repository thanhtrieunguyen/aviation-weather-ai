const express = require('express');
const router = express.Router();
const { login } = require('../../backend/Controller/authController'); 

//route đăng nhập
router.post('/', login); 

module.exports = router;
