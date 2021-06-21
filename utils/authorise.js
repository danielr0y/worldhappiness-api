const {verify} = require('jsonwebtoken');


module.exports = function(req, res, next){
    const authorization = req.headers.authorization;
  
    if ( ! authorization )
        throw new Error('MissingAuthHeader');
  
    const match = authorization.match(/^Bearer\s(?<token>.+)$/);
    if ( ! match )
        throw new Error('MalformedAuthHeader');
  
    const secretKey = req.app.get('secretKey');
    const decoded = verify( match.groups.token, secretKey ); // this will throw errors too
    if ( req.user && req.user.email !== decoded.email )
        throw new Error('Forbidden');
  
    next();
}