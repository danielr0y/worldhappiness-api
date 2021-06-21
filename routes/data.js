var express = require('express');
var router = express.Router();

const authorise = require('../utils/authorise')


/* validators */
function checkValidParameters(req, res, next){
  const {country, limit} = req.query;
  const year = req.params.year || req.query.year;

  if ( country && /\d/.test(country) )
    throw new Error('InvalidCountryFormat');

  if ( year && ! /^\d{4}$/.test(year) )
    throw new Error('InvalidYearFormat');

  if ( limit && ( limit%1 !== 0 || Math.sign(limit) !== 1 ) )
    throw new Error('InvalidLimitFormat');

  next();
}

function checkOtherParametersFactors(req, res, next){
  const {country, limit, ...remaining} = req.query;

  const otherParams = Object.keys(remaining);
  if ( otherParams.length )
    throw new Error('InvalidParametersFactors')

  next();
}

function checkOtherParametersRankings(req, res, next){
  const {year, country, ...remaining} = req.query;

  const otherParams = Object.keys(remaining);
  if ( otherParams.length )
    throw new Error('InvalidParametersRankings')

  next();
}

function checkParametersCountries(req, res, next){
  const params = Object.keys(req.query);
  if ( params.length )
    throw new Error('InvalidParametersCountries')

  next();
}


/* endpoints */
router.get('/factors/:year', authorise, checkValidParameters, checkOtherParametersFactors, function(req, res, next) {
  // everything has been validated at this point and the query can be performed
  const columns = ['rank', 'country', 'score', 'economy', 'family', 'health', 'freedom', 'generosity', 'trust'];
  const year = req.params.year;
  const {country, limit} = req.query;
  const params = country ? {year, country} : {year};

  req.db.select(columns)
    .from('rankings')
    .where(params)
    .orderBy('rank', 'ASC')
    .limit(limit)
    .then( rows => res.status(200).json(rows) )
    .catch( err => next(err) );
});

router.get('/rankings', checkValidParameters, checkOtherParametersRankings, function(req, res, next) {
  // everything has been validated at this point and the query can be performed
  const columns = ['rank', 'country', 'score', 'year'];
  const {year, country} = req.query;
  const params = country ? year ? {year, country} : {country} 
                         : year ? {year} : {};

  req.db.select(columns)
    .from('rankings')
    .where(params)
    .orderByRaw('year DESC, `rank` ASC')
    .then( rows => res.status(200).json(rows) )
    .catch( err => next(err) );
});

router.get('/countries', checkParametersCountries, function(req, res, next) {
  // everything has been validated at this point and the query can be performed

  req.db.select("country")
    .from('rankings')
    .groupBy('country')
    .orderBy('country', 'ASC')
    .then( rows => rows.map( ({country}) => country ) )
    .then( countries => res.status(200).json(countries) )
    .catch( err => next(err) );
});


module.exports = router;