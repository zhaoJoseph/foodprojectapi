module.exports = (router, runQuery, app) => {
    const bcrypt = require('bcrypt');

    //register 
    router.post('/', async (req, res) => {
        try{
            const {email, password} = req.body.params;
            const saltRounds = 10;
            const encryptedPassword = await bcrypt.hash(password, saltRounds);
            var id;
            var query = `INSERT INTO users(email, password) VALUES ('${email}', '${encryptedPassword}');`;
            var result;
            await runQuery(query).then(data => result = data);
            query = `SELECT LAST_INSERT_ID();`;
            await runQuery(query).then(data => result = data);
            id = JSON.parse(result)[0]['LAST_INSERT_ID()'];
            query = `INSERT INTO recipes(user_id) VALUES ('${id}');`;
            await runQuery(query).then(data => result = data);
            return res.json({message: "Account Created!"});
        }catch( err ){
            res.json({message: "Error", error: err.message});
        }
    })
    
    return router;
}