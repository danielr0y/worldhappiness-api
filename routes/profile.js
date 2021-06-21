var express = require('express');
var router = express.Router();

const sanitize = require('sanitize-html');

const authorise = require('../utils/authorise')


/* validators */
function catchAuthErrors(err, req, res, next){
  const message = err.message;

  if ( message === 'Forbidden' || message === 'MissingAuthHeader' ){
    // put a flag on the request object and continue the middleware chain as normal w/o errors
    // thus allowing the GET to be processed despite the error
    req.showPublicProfile = true;
    next(); // continue the normal middleware chain
    return;
  }

  // put any other errors back on the middleware chain 
  next(err);
}

function validateInput(req, res, next) {
  const {firstName, lastName, dob, address} = req.body;

  if ( ! firstName || ! lastName || ! dob || ! address )
    throw new Error('InvalidProfileBodyFormat');

  if ( typeof firstName !== 'string' || typeof lastName !== 'string' || typeof address !== 'string' )
    throw new Error('InvalidFirstNameLastNameAddressFormat');

  const dobDate = new Date(dob);
  const validDob = dobDate.toISOString().slice(0,10); // this throws errors. catch them in app.js
  if( dob !== validDob )
    throw new Error('InvalidProfileDateFormat');

  if( dobDate > Date.now() )
    throw new Error('InvalidProfileDate');

  if ( firstName !== sanitize(firstName) || lastName !== sanitize(lastName) || dob !== sanitize(dob) || address !== sanitize(address) )
    throw new Error('unsanitaryInput');

  next();
}


/* endpoints */
router.get('/', authorise, catchAuthErrors, function(req, res, next) {
  // everything is valid at this point and the profile can be retrieved
  const email = req.user.email;
  const columns = ( req.showPublicProfile ) ? ['email', 'firstName', 'lastName']
                                            : ['email', 'firstName', 'lastName', 'dob', 'address'];

  req.db.select( columns )
    .from('users')
    .leftJoin('profiles', {'users.id': 'profiles.user_id'})
    .where( {email} )
    .then( ([user]) => res.status(200).json(user) )
    .catch( err => next(err) );
});

router.put('/', authorise, validateInput, function(req, res, next) {
  // everything is valid at this point and the "upsert" can occur
  const email = req.user.email;
  const user_id = req.user.id;
  const {firstName, lastName, dob, address} = req.body;
  const insert = {firstName, lastName, dob, address};

  req.db.from('profiles')
    .insert( {user_id, ...insert} )
    .onConflict('user_id')
    .merge()
    .then( _ => res.status(200).json( {email, ...insert} ) )
    .catch( err => next(err) );
});


module.exports = router;