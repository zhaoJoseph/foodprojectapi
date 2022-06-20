module.exports = (router, runQuery, checkDup, updateNext) => {

    const {sanitize, unescape} = require('../helperFuncs/sanitize');

    router.get('/', async (req, res) => {
        const {id, name} = req.query;
        let result;
        var searchName = sanitize(name);
        var query = `SELECT JSON_EXTRACT(recipeList, '$.recipelist."${searchName}"') FROM recipes WHERE user_id='${id}'`;
        var recipe = {};
        try{
            result = await runQuery(query);
        }catch (e){
            return res.status(404).json({message: e});
        }
        if(result){
            result = JSON.parse(result);

            if(result.length > 0 && Object.keys(result[0]).length > 0){
                const key = Object.keys(result[0])[0];

                const recipe = JSON.parse(result[0][key]);

                recipe.title = unescape(recipe.title);

                recipe['steps'].forEach(function(e, index){
                    recipe['steps'][index] = unescape(e);
                });

                recipe['ingredients'].forEach(function(e){
                    e.ingredient = unescape(e.ingredient);
                    e.quantity = unescape(e.quantity);
                });    
                
                return res.json({recipe: recipe});
            }else{
                return res.status(404).json({message: "Recipe Not Found"});
            }

        }else{
            return res.status(404).json({message: "Error Occured During List Retrieval."})
        }

    })

    // editing an existing recipe
    router.put('/', async (req, res) => {
        const {id} = req.body;
        var {name, recipe} = req.body;
        recipe.title = sanitize(recipe.title);

        try{
            if(await checkDup(recipe.title, id)){
                return res.status(409).json({message: "Recipe with same name already exists."});
            }
        }catch(e){
            console.log(e);
            return res.status(404).json({message: e});
        }

        recipe._head = "";
        recipe._next = "";

        let tailRecipe;

        try{
            tailRecipe = await updateNext(recipe.title, id);
        }catch(e){
            console.log(e);
            return res.status(404).json({message: e});
        }

        if(tailRecipe != null){
            recipe._head = tailRecipe;
        }

        recipe['steps'].forEach(function(e, index){
               recipe['steps'][index] = sanitize(e).replace(/[\n\r]/g, " ");
        });
        recipe['ingredients'].forEach(function(e){
            e.ingredient = sanitize(e.ingredient);
            e.quantity = sanitize(e.quantity);
        });

        query = `SELECT JSON_EXTRACT(recipeList, '$.recipelist."${name}"') FROM recipes WHERE user_id = '${id}';`;
        try {
            result = await runQuery(query);
        }catch(e) {
            console.log(e);
            return res.status(404).json({message: e});
        }
        if(result){
            const recipeRes = JSON.parse(result);
            let key;
            let oldRecipe;
            if(recipeRes.length > 0 && Object.keys(recipeRes[0]).length > 0){
                key = Object.keys(recipeRes[0])[0];
                oldRecipe = JSON.parse(recipeRes[0][key]);
            }

            if(oldRecipe){ // if the recipe exists
                recipe._head = oldRecipe._head;
                recipe._next = oldRecipe._next;
                query = `UPDATE recipes SET recipeList = JSON_INSERT(JSON_REMOVE(recipeList, '$.recipelist."${oldRecipe.title}"'), '$.recipelist."${recipe.title}"',CAST('${JSON.stringify(recipe)}' AS JSON));`;

            }else{
                var newRecipeList = {};
                newRecipeList[recipe.title] = recipe;
                var defaultObj = {_head : recipe.title, _tail : recipe.title, recipelist : newRecipeList};
                var recipeString = JSON.stringify(defaultObj);
                query = `UPDATE recipes SET recipeList = JSON_SET(IFNULL(recipeList, '${recipeString}'),` + 
                `'$.recipelist."${recipe.title}"',CAST('${JSON.stringify(recipe)}' AS JSON),` + 
                `"$._tail" , '${recipe.title}') WHERE user_id = '${id}';`;
            }

            try {
                result = await runQuery(query);
            }catch(e) {
                console.log(e);
                return res.status(404).json({message: e});
            }

            if(result){
                return res.json({message: "Recipe added!"});
            }else{
                return res.status(404).json({message: "Error occured during list update."})
            }

        }else{
            return res.status(404).json({message: "Error Occured During List Retrieval."})
        }
    })

    router.delete('/', async (req, res) => {
        const {id, name} = req.body;
        let head, tail;
        let result;
        var query = `SELECT JSON_UNQUOTE(JSON_EXTRACT(recipeList, '$.recipelist."${name}"._head')) FROM recipes WHERE user_id = '${id}'; ` +
                    `SELECT JSON_UNQUOTE(JSON_EXTRACT(recipeList, '$.recipelist."${name}"._next')) FROM recipes WHERE user_id = '${id}';`;
        try {
            result = await runQuery(query);
        }catch(e) {
            console.log(e);
            return res.status(404).json({message: e});
        }   

        if(result){
            const resultRecipes = JSON.parse(result);
            const headKey = Object.keys(resultRecipes[0][0])[0];
            const tailKey = Object.keys(resultRecipes[1][0])[0];
            head = resultRecipes[0][0][headKey];
            tail = resultRecipes[1][0][tailKey];
            let headQuery;
            let tailQuery;
            if(tail == "" && head == ""){
                query = `UPDATE recipes SET recipeList = NULL WHERE user_id = '${id}';`;
            }else{
                if(head == ""){
                    headQuery = `UPDATE recipes SET recipeList = JSON_SET(recipeList, "$._head", '${tail}') WHERE user_id = '${id}';`;
                }else{
                    headQuery = `UPDATE recipes SET recipeList = JSON_SET(recipeList, '$.recipelist."${head}"._next', '${tail}') WHERE user_id = '${id}';`;
                }
    
                if(tail == ""){
                    tailQuery = `UPDATE recipes SET recipeList = JSON_SET(recipeList, "$._tail", '${head}') WHERE user_id = '${id}';`;
                }else{
                    tailQuery = `UPDATE recipes SET recipeList = JSON_SET(recipeList, '$.recipelist."${tail}"._head', '${head}') WHERE user_id = '${id}';`;
                }
                query = headQuery + tailQuery;

            }

            try {
                result = await runQuery(query);
            }catch(e) {
                console.log(e);
                return res.status(404).json({message: e});
            }               

            if(tail == "" && head == ""){
                return res.json({message: "Recipe Removed!"});
            }

        }

        query = `UPDATE recipes SET recipeList = JSON_REMOVE(recipeList, '$.recipelist."${name}"') WHERE user_id = '${id}';`;
        try {
            result = await runQuery(query);
        }catch(e) {
            console.log(e);
            return res.status(404).json({message: e});
        }
        if(result){
        return res.json({message: "Recipe Removed!", head: head});
        }else{
            return res.status(404).json({message: "Error Occured During List Retrieval."})
        }
    })

    return router;
}