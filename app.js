// core imports
const express = require('express');
const cookieParser = require('cookie-parser');

// security and logging imports
const cors = require('cors');
const options = require('./knexfile.js');
const knex = require('knex')(options);
const helmet = require('helmet');
const morgan = require('morgan');

// router imports
const docsRouter = require('./routes/docs'); // docs
const dataRouter = require('./routes/data');
const userRouter = require('./routes/user');



// create the app and start doing things
const app = express();

// for JWTs
app.set('secretKey', process.env.SECRET_KEY );

// request-body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());

// adds knex to the req object so it is available to all subsequent actions
app.use((req, res, next) => {
  req.db = knex;
  next();
})

// security and logging
app.use(morgan('common'));
app.use(helmet());
app.use(cors());

// use the routes
app.use('/user', userRouter);
app.use(dataRouter);
app.use(docsRouter);

// 404
app.use(function(req, res, next){
  throw new Error("404NotFound")
});

// catch my errors
app.use( function(err, req, res, next) {
  const myErrors = {
    "404NotFound": {
      code: 404,
      message: "Not Found"
    },
    unsanitaryInput: {
      code: 400,
      message: "Please don't include html in your input. We'll assume you're trying to hack us."
    },
    InvalidCountryFormat: {
      code: 400,
      message: "Invalid country format. Country query parameter cannot contain numbers."
    },
    InvalidYearFormat: {
      code: 400,
      message: "Invalid year format. Format must be yyyy."
    },
    InvalidLimitFormat: {
      code: 400,
      message: "Invalid limit query. Limit must be a positive number."
    },
    InvalidParametersRankings: {
      code: 400,
      message: "Invalid query parameters. Only year and country are permitted."
    },
    InvalidParametersFactors: {
      code: 400,
      message: "Invalid query parameters. Only limit and country are permitted."
    },
    InvalidParametersCountries: {
      code: 400,
      message: "Invalid query parameters. Query parameters are not permitted."
    },
    InvalidProfileBodyFormat: {
      code: 400,
      message: "Request body incomplete: firstName, lastName, dob and address are required."
    },
    InvalidFirstNameLastNameAddressFormat: {
      code: 400,
      message: "Request body invalid, firstName, lastName and address must be strings only."
    },
    InvalidProfileDateFormat: {
      code: 400,
      message: "Invalid input: dob must be a real date in format YYYY-MM-DD."
    },
    "Invalid time value": {
      code: 400,
      message: "Invalid input: dob must be a real date in format YYYY-MM-DD."
    },
    InvalidProfileDate: {
      code: 400,
      message: "Invalid input: dob must be a date in the past."
    },
    "Bad Request": {
      code: 400,
      message: "Request body incomplete, both email and password are required"
    },
    "User not found": {
      code: 404,
      message: "User not found"
    },
    "Invalid log in request": {
      code: 401,
      message: "Incorrect email or password"
    },
    "User already exists": {
      code: 409,
      message: "User already exists"
    },
    MissingAuthHeader: {
      code: 401,
      message: "Authorization header ('Bearer token') not found"
    },
    MalformedAuthHeader: {
      code: 401,
      message: "Authorization header is malformed"
    },
    Forbidden: {
      code: 403,
      message: "Forbidden"
    },
    "invalid token": {
      code: 401,
      message: "Invalid JWT token"
    },
    "jwt malformed": {
      code: 401,
      message: "Invalid JWT token"
    },
    "jwt expired": {
      code: 401,
      message: "JWT token has expired"
    }
  }

  // check if I know what to do with the error
  const error = myErrors[err.message];
  if ( error ){
    const {code, message} = error;
    
    res.status(code).json( {
      error: true,
      message
    } )
    return;
  }


  res.status(500).json( {
    error: true,
    message: "Internal server error"
  } )
  return;

} );

module.exports = app;