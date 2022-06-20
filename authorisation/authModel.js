module.exports = (router, runQuery) => {
    
    const cors = require('cors');
    const jwt = require('jsonwebtoken');
    const crypto = require("crypto");
    const login = require('../middleware/login')(runQuery);
    require('dotenv').config();

    function base64URLEncode(str) {
        return str
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=/g, "");

      }

    function sha256(buffer) {
    return crypto.createHash("sha256").update(buffer).digest();
    }

    router.get('/accesscode', cors(), login, async (req, res) => {

        const {client_id, id, redirect_uri, grant_type, code_challenge, code_challenge_method} = req.query;

        const URL_CALLBACK = `http://10.0.2.2:3000/oauth/token`;
 
        if(redirect_uri == URL_CALLBACK && client_id == process.env.CLIENT_ID && grant_type == "authorization_code" && id && code_challenge && code_challenge_method){

        const authCode = new Array(10).fill(null).map(() => Math.floor(Math.random() * 10)).join('');

        const storeCode = `INSERT INTO access_codes (code, challenge, time_creation) VALUES ("${authCode}", "${code_challenge}:${code_challenge_method}",CURRENT_TIMESTAMP()) ON DUPLICATE KEY UPDATE code = "${authCode}";`;
        
        try{    
            await runQuery(storeCode);
        }catch{(err => console.log(err))};

        const URL = URL_CALLBACK + `?code=${authCode}&grant_type='authorization_code'&redirect_uri='${URL_CALLBACK}'&client_id=${process.env.CLIENT_ID}`;

        return res.json({url: URL, redirect_uri: redirect_uri, code: authCode, grant_type: 'authorization_code', client_id: client_id, id: id});

        }else{
            var err = new Error("Invalid Credentials");
            err.status = 403;
            return res.status(403).send(err);

        }
    })

    
    router.post('/token', cors(), async (req, res) => {

        if(req.headers['content-type'] != 'application/x-www-form-urlencoded'){
            var err = new Error("Invalid Content Type");
            err.status = 403;
            res.status(403).send(err);
        }

        const {username, code, grant_type, redirect_uri, client_id, id, code_verifier} = req.body;

        //wipe out tokens that are > 30 min old

        const cleanDB = 'DELETE FROM access_codes WHERE `time_creation` < (NOW() - INTERVAL 5 MINUTE);';

        await runQuery(cleanDB);

        const selectCode = `SELECT * FROM access_codes WHERE code = ${code};`;
        const getCode = await runQuery(selectCode);
        const codeRes = (getCode != null) ? JSON.parse(getCode)[0] : null;

        if(!codeRes && codeRes.length != 1){
            res.status(400).json({message : 'Access Code Expired'});
        }

        const challenge = codeRes.challenge.split(":")[0];

        const method = codeRes.challenge.split(":")[1];

        const authCode = codeRes.code;

        const URL_CALLBACK = `http://10.0.2.2:3000/oauth/token`;

        let verified;

        if(method && code_verifier && method == 'SHA256'){
            verified = base64URLEncode(sha256(code_verifier));
        }else{
            res.status(403).json({message : 'Invalid challenge method provided or no verifier'});
        }

        if(authCode && authCode == code && verified == challenge && grant_type == 'authorization_code' && redirect_uri == URL_CALLBACK && client_id == process.env.CLIENT_ID){

            const token = jwt.sign({username: username}, process.env.TOKEN_SECRET, {expiresIn : '2h'});
            
            const refresh = jwt.sign({username: username}, process.env.TOKEN_SECRET, {expiresIn : '7d'});

            const removeCode = `DELETE FROM access_codes WHERE code = ${authCode};`;

            await runQuery(removeCode);
            
            const insertRefresh = `INSERT INTO auth_tokens (refresh_token, user_id) VALUES ('${refresh}', '${id}') ON DUPLICATE KEY UPDATE refresh_token = '${refresh}';`;

            await runQuery(insertRefresh);

            res.json({'access_token' : token, 'refresh_token' : refresh, 'id' : id});

        }else{
            res.status(400).json({message: 'Invalid token or token expired.'});
        }

    })

    router.post('/refresh', cors(), async (req, res) => {

        const {grant_type, refresh_token, client_id} = req.body;

        const getRefresh = `SELECT * FROM auth_tokens WHERE refresh_token = '${refresh_token}';`;

        const dbToken = await runQuery(getRefresh);

        const refresh = JSON.parse(dbToken);

        let token;

        if(refresh.length == 0){
            return res.status(401).json({ error: "Invalid token, please login again!" });
        }else{
            token = refresh[0]['refresh_token'];
        }

        if(token && grant_type == 'refresh' && client_id == process.env.CLIENT_ID){

            jwt.verify(token, process.env.TOKEN_SECRET, function(err, decoded){
                if(err){
                    if (err.name == "TokenExpiredError"){
                        return res.status(401).json({ error: "Session timed out,please login again" });
                    }else if (error.name === "JsonWebTokenError") {
                        return res.status(401).json({ error: "Invalid token, please login again!" });
                      } else {
                        //catch other unprecedented errors
                        console.error(error);
                        return res.status(400).json({ error });
                      }
                }   

                const accessToken = jwt.sign({user : token.user} , process.env.TOKEN_SECRET, {expiresIn : "1800s"});

                return res.status(200).json({access_token : accessToken});

            })

        }else{
            return res.status(401).json({error : "Token Expired"});
        }

    } )

    return router;
}