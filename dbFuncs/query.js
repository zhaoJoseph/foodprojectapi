let sqlPool;

module.exports = (injectedPool) => {
    sqlPool = injectedPool;

    return runQuery;
};  

function runQuery(sqlQuery){
    return new Promise(function(resolve, reject) {
        sqlPool.query(sqlQuery, function(err, result){
                if(!err){
                    res = JSON.stringify(result);
                    resolve(res);
                }
                error = JSON.stringify(err);
                reject(new Error(error));
            }
        )
    })
}

