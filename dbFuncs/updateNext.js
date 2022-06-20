let runQuery;
let pool;

module.exports = (injectedQuery, injectedPool) => {
    runQuery = injectedQuery;
    pool = injectedPool;

    return updateNext;
};

async function updateNext(title, id){
    
    let result;
    var query = `SELECT JSON_UNQUOTE(JSON_EXTRACT(recipeList, '$._tail')) FROM recipes WHERE user_id = '${id}';`;
    try {
        result = await runQuery(query);
    }catch(e) {
        console.log(e);
        return new Error(e);
    }

    if(result){
        value = JSON.parse(result);
        key = Object.keys(value[0])[0];
        keyRecipe = value[0][key];
        if(keyRecipe){
            query = `UPDATE recipes SET recipeList = JSON_SET(recipeList, '$.recipelist."${keyRecipe}"._next', "${title}") WHERE user_id = '${id}';`;
            
            try {
                result = await runQuery(query);
            }catch(e) {
                console.log(e);
                return new Error(e);
            }

            return keyRecipe;
        }

        return null;

    }else{
        return new Error("Error retrieving list tail.");
    }

}