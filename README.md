# JavaScript REST API built on Express.js
interactive API documentation for this project can be found at: https://worldhappiness-api.herokuapp.com/

## Summary
This API exposes REST endpoints filtering a subset of data from [The World Happiness Report](https://worldhappiness.report/), an annual initiative of the United Nations, which ranks as many as 157 countries according to a self-reported ‘happiness score’. This API provides access to a subset of the survey data for the years 2015 to 2020 as well as endpoints for registration, login and user profile information.

## Technologies
*	JavaScript
*	Node.js
*	Express.js
*	JSON Web Tokens
*	Knex query builder

## Architecture 
Expanding on the basic architecture supplied by express-generator, my application is divided into three primary routers: data, users and docs.

These routers group related endpoints together in appropriately named files. routes>data.js, for example, contains the data endpoints.

Those endpoints which imply a hierarchical structure, such as /user/:email/profile, are equally structured within the code base. That is to say that /user/:email/profile can be found under userRouter>userFeaturesRouter>profileRouter where userFeaturesRouter is a sub-router of userRouter. This allows for the easy inclusion of additional user features in the future, for example billing.
 
Each routes>router.js file contains only the endpoint handlers and some validator methods. Removing the validator logic from the endpoint handlers facilitates code reusability and readability. It also means that each endpoint handler contains nothing more than a query to the database.
 
The last significant architectural design decision worth mentioning is how I have raised and handled errors. Rather than returning a response with an error status directly from the validation logic, each validator throws certain named errors under the various circumstances specified in the API documentation. These errors are then caught by an error handler in app.js which returns the appropriate response. This approach allowed me to catch certain errors before they reach the error handler and perform alternate logic if they occurred. The GET /user/:email/profile route, for example, catches Forbidden and missingAuthHeader errors, sets a usePublicProfile flag on the request object before putting it back in the middleware chain for normal processing.
 
## Security 
*	Use of knex query builder with no raw SQL
*	Use of helmet with the default settings enabled
*	Use of morgan logging with standard output
*	Use of bcrypt to compare passwords storing only hashed data in the database

### reflections on OWASP top 10 web application security risks
It seems to me that my use of input validators in combination with my implementation of the Knex SQL query builder make protection from SQL injection attacks a strength in the security of my application.

I believe my use of the established module, jsonwebtokens for authentication gives my application some immediate credibility avoiding broken Authentication. Detection for excessive login attempts could be implemented in the future to improve security. Moreover, if the application were to be extended to include billing information the token should definitely be made to expire sooner. Given the low sensitivity of the information currently stored by the application, however, I would say the authentication measures I have implemented are appropriate.

User passwords are encrypted during transit by https and then explicitly with bcrypt before they are stored in the database. Stored passwords are not decrypted when comparing against login attempts, instead, the (encrypted) submitted password is compared against the stored hash. The encryption key is stored as an environment variable for added protection.

When submitting data to a user profile for storage, my application checks not only that the target user profile exists and that a valid authorization token is present but also ensures that the owner of the token is indeed the owner of that profile. This seems to be the only place where some oversight in authentication logic could have potentially occurred in this relatively simple application and accordingly, I believe the application is free from broken access control. 

My application sanitizes user input to protect from stored and reflected XSS attacks. Between this and my use of [helmet](https://www.npmjs.com/package/helmet) which, amongst other things, sets CSP headers and disables the XSS Auditor of modern browsers, I would now consider my application to have at least the minimum requirements to protect against cross-site scripting attacks.
