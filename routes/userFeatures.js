var express = require('express');
var router = express.Router();

const profileRouter = require('./profile')


/* subrouters */
router.use('/profile', profileRouter);


module.exports = router;