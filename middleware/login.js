module.exports = (runQuery) => {

    const bcrypt = require('bcrypt');

    const login = async function(req, res, next) {
                const {username, password} = req.query;
                var query = `SELECT id, password FROM users WHERE email='${username}';`;
                let result;
                try{
                    result = await runQuery(query);
                }catch(e) {
                    var err = new Error(e);
                    err.status = 404;
                    next(err);
                }

                result = JSON.parse(result);
                if(result.length > 0){

                    const compare = await bcrypt.compare(password, result[0].password);
                    if(compare){
                        req.query.id = result[0].id;
                        return next();
                    }
                    var err = new Error("Invalid Password.");
                    err.status = 401;
                    next(err);

                }else{
                    var err = new Error("Invalid Credentials.");
                    err.status = 401;
                    next(err);
                }
            }

        return login;

}