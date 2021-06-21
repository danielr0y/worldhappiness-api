var express = require('express');
var router = express.Router();

const sanitize = require('sanitize-html');
const bcrypt = require('bcrypt');
const {sign} = require('jsonwebtoken');

var userFeaturesRouter = require('./userFeatures');


/* validators */
function validateRequiredFields(req, res, next){
  const {email, password} = req.body;
  
  if (! email || ! password)
    throw new Error("Bad Request");

  next();
}

function getUser(req, res, next){
  // this validator is used in multiple contexts where the email is stored in different locations
  // the logic is not concerned with where it is stored. just get it
  const email = req.body.email || req.params.email;

  // sanitize input
  if ( email !== sanitize(email) )
    throw new Error('unsanitaryInput')

  // get the user
  req.db.select("*")
    .from('users')
    .where( {email} )
    .then( ([user]) => {
      // we are not concerned here whether a user exists or not
      // just put the result on the request and move on
      req.password = req.body.password;
      req.user = user;
      next();
    } )
    .catch( err => next(err) );
}

function ensureUserExists(req, res, next){
  const user = req.user;

  if ( user === undefined )
    throw new Error('User not found');

  next();
}

function ensureUserDoesNotExist(req, res, next){
  const user = req.user;

  if ( user !== undefined )
    throw new Error('User already exists');

  next(); 
}

function validateEmailAndPassword(req, res, next){
  const {user, password} = req;

  // if undefined the email was bad
  if ( user === undefined )
    throw new Error('Invalid log in request');

  // otherwise it was good and we can verify the password now
  bcrypt.compare(password, user.hash)
    .then( match => {
      // if no match the password was bad
      if ( ! match )
        throw new Error('Invalid log in request');

      next();
    } )
    .catch( err => next(err) );
}


/* endpoints */
router.post('/login', validateRequiredFields, getUser, validateEmailAndPassword, (req, res, next) => {
  // everything has been validated at this point, the password matches and login can occur
  const email = req.user.email;
  const secretKey = req.app.get('secretKey');
  const expires_in = 60 * 60 * 24; // 1 day
  const exp = Date.now() / 1000 + expires_in; // number of SECONDS since epoch as expected by sign
  const token = sign( {email, exp}, secretKey );

  res.status(200).json( {
    token, 
    token_type: 'Bearer', 
    expires_in
  } )
});

router.post('/register', validateRequiredFields, getUser, ensureUserDoesNotExist, (req, res, next) => {
  // everything has been validated and sanitized at this point, the email address hasnt been used before and registration can occur
  const {email, password} = req.body;

  // hash the password
  const saltRounds = 10;
  const hash = bcrypt.hashSync(password, saltRounds);

  // and create the user
  req.db.from('users')
    .insert( {email, hash} )
    .then( _ => res.status(201).json( {message: 'User created'} ) )
    .catch( err => next(err) );
});


/* subrouter */
router.use('/:email', getUser, ensureUserExists, userFeaturesRouter);


module.exports = router;