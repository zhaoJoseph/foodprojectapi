module.exports = () => {
    const jwt = require('jsonwebtoken');

    const authenticate = async function(req, res, next){

            const authorization = req.headers['authorization'].split(" ")[1];

            jwt.verify(authorization, process.env.TOKEN_SECRET, (err, user) => {

                if(err){

                    console.log(err);

                    var unauthorized = new Error("Unauthorized");
        
                    unauthorized.status = 403;
                
                    next(unauthorized);
                }

                next();

            })
            
        }
    return authenticate;
}