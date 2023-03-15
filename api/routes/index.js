var express = require('express');
var router = express.Router();
const user = require('./user')

router.use('/user', user);

module.exports = router;