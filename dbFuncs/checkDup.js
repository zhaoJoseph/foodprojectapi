let runQuery;
let pool;

module.exports = (injectedQuery, injectedPool) => {
    runQuery = injectedQuery;
    pool = injectedPool;

    return checkDup;
};

async function checkDup(title, id){

    var query = `SELECT JSON_UNQUOTE(JSON_EXTRACT(recipeList, '$.recipelist."${title}"')) FROM recipes WHERE user_id = '${id}';`;

    try {
        result = await runQuery(query);
    }catch(e) {
        console.log(e);
        return new Error(e);
    }

    const dup = JSON.parse(result);
    
    let dupKey;

    if(dup && dup.length > 0){
        dupKey = Object.keys(dup[0])[0];
    }

    if(result && dupKey && dup[0][dupKey] != null){
        return true;
    }

    return false;
}   