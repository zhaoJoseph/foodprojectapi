module.exports = (router, runQuery, app) => {
    //register 
    router.post('/', async (req, res) => {
        try{
            const {email, password} = req.body.params;
            var id;
            var query = `INSERT INTO users(email, password) VALUES ('${email}', '${password}');`;
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