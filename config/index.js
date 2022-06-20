const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const mysql  = require('mysql');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

let pool = null;

if(process.env.NODE_ENV == "development"){

    const dbSocketPath = process.env.DB_SOCKET_PATH || '/cloudsql';

    pool = mysql.createConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        socketPath: `${dbSocketPath}/${process.env.INSTANCE_CONNECTION_NAME}`,
        multipleStatements: true,
    })  
    pool.connect();
}   

if(process.env.NODE_ENV == "production"){

    const dbSocketPath = process.env.DB_SOCKET_PATH || '/cloudsql';

    pool = mysql.createPool({
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        socketPath: `${dbSocketPath}/${process.env.INSTANCE_CONNECTION_NAME}`,
        multipleStatements: true,
    })  
}   

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

app.use(limiter);

const {errorHandler} = require('../middleware/errorHandler');
const runQuery = require('../dbFuncs/query')(pool);
const updateNext = require('../dbFuncs/updateNext')(runQuery, pool);
const checkDup = require('../dbFuncs/checkDup')(runQuery, pool);
const authenticate = require('../middleware/authenticate')();
const authModel = require('../authorisation/authModel')(express.Router(), runQuery);
const userRoutes = require('../routes/user')(express.Router(), runQuery);
const recipeListRoutes = require('../routes/recipesList')(express.Router(), runQuery, checkDup, updateNext);
const recipeRoutes = require('../routes/recipe')(express.Router(), runQuery, checkDup, updateNext);
const urlRoutes = require('../routes/url')(express.Router(), runQuery);

app.use('/oauth', authModel);
app.use('/user', userRoutes);
//authorize endpoints via token
app.use(authenticate);
app.use('/recipesList', recipeListRoutes);
app.use('/recipe', recipeRoutes);
app.use('/url', urlRoutes);

app.get('/' , async (req, res) => {
        res.json({status: "Connection Successful."});
    }
)

app.use(errorHandler);

module.exports = app;