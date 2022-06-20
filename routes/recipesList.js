module.exports = (router, runQuery, checkDup, updateNext) => {

    // Adding to recipe list new recipe
    router.put('/', async (req, res) => {
        const {id, recipe} = req.body;

        recipe._head = "";

        recipe._next = "";

        let result;

        try{
            if(await checkDup(recipe.title, id)){
                return res.status(409).json({message: "Recipe with same name already exists."});
            }
        }catch(e){
            console.log(e);
            return res.status(404).json({message: e});
        }

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

        var newRecipeList = {};
        newRecipeList[recipe.title] = recipe;
        var defaultObj = {_head : recipe.title, _tail : recipe.title, recipelist : newRecipeList};
        var recipeString = JSON.stringify(defaultObj);
        query = `UPDATE recipes SET recipeList = JSON_SET(IFNULL(recipeList, '${recipeString}'),` + 
        `'$.recipelist."${recipe.title}"',CAST('${JSON.stringify(recipe)}' AS JSON),` + 
        `'$._tail' , '${recipe.title}') WHERE user_id = '${id}';`;

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

        
    }
    )

    router.get('/', async (req, res) => {
        const {id, current} = req.query;
        let result;
        let query;

        if(current){
            query = `CALL getrecipes("${filterCurrent}", ${id}); SELECT view_recipes FROM recipes WHERE user_id = '${id}'; UPDATE recipes SET view_recipes = NULL WHERE user_id = '${id}';`;
        }else{
            query = `CALL getrecipes(NULL, ${id}); SELECT view_recipes FROM recipes WHERE user_id = '${id}'; UPDATE recipes SET view_recipes = NULL WHERE user_id = '${id}';`;
        }

        try {
            result = await runQuery(query);
        }catch(e) {
            console.log(e);
            return res.status(404).json({message: e});
        }

        if(result){

            const recipeResult = JSON.parse(result);
            const recipes = JSON.parse(recipeResult[1][0].view_recipes);

            if(recipes){

                const ids = Object.keys(recipes);

                var list = [];

                for(var obj of ids){
                    if(obj != '_tail' && obj != '_end' && obj != current){
                        list.push({id: obj, image: (recipes[obj].hasOwnProperty('images') && recipes[obj]['images'].length > 0) ? recipes[obj]['images'][0] : ""});
                    }
                }
                return res.json({list : list, _tail: recipes._tail, _end: recipes._end});

            }else{
                return res.json({list : [], _tail: "", _end: 1});
            }

        }else{
            return res.status(404).json({message: "Error retrieving recipes."});
        }

    })

    router.get('/search', async (req, res) => {
        const {id, term, current} = req.query;
        let result;
        let query;


        if(current){
            query = `UPDATE recipes SET view_recipes = recipes.recipeList->"$.recipelist.*" WHERE user_id = ${id};` + 
                    `SELECT j.title FROM recipes, JSON_TABLE(recipes.view_recipes, '$[*]' ` + 
                    `COLUMNS ( ` +
                    `title TEXT PATH '$.title', ` +
                    ` cook JSON PATH '$.cook',` +
                    ` prep JSON PATH '$.prep',` +
                    ` steps JSON PATH '$.steps', `+
                    ` _head TEXT PATH '$._head',`+
                    ` _next TEXT PATH '$._next', `+
                    `ingredients JSON PATH '$.ingredients' `+
                    `)) AS j `+
                    `WHERE user_id = ${id} AND j.title REGEXP '${term}' AND j.title > '${current}' ORDER BY j.title ASC LIMIT 20;` +
                    `UPDATE recipes SET view_recipes = NULL WHERE user_id = '${id}';`;
        }else{
            query = `UPDATE recipes SET view_recipes = recipes.recipeList->"$.recipelist.*" WHERE user_id = ${id};` + 
                    `SELECT j.title FROM recipes, JSON_TABLE(recipes.view_recipes, '$[*]' ` + 
                    `COLUMNS ( ` +
                    `title TEXT PATH '$.title', ` +
                    ` cook JSON PATH '$.cook',` +
                    ` prep JSON PATH '$.prep',` +
                    ` steps JSON PATH '$.steps', `+
                    ` _head TEXT PATH '$._head',`+
                    ` _next TEXT PATH '$._next', `+
                    `ingredients JSON PATH '$.ingredients' `+
                    `)) AS j `+
                    `WHERE user_id = '${id}' AND j.title REGEXP '${term}' ORDER BY j.title ASC LIMIT 20;` +
                    `UPDATE recipes SET view_recipes = NULL WHERE user_id = '${id}';`;
        }

        try {
            result = await runQuery(query);
        }catch(e) {
            console.log(e);
            return res.status(404).json({message: e});
        }

        if(result){

            const recipeResult = JSON.parse(result);

            const recipes = recipeResult[1];

            if(recipes && recipes.length > 0){

                var list = [];

                let ind = 0;

                for(var obj of recipes){
                    if(obj.title != current){
                        list.push({id: obj.title});
                    }
                    ind++;
                    if(ind > 20){
                        break;
                    }
                }

                if(recipes.length > 20){
                    return res.json({list : list, _tail: recipes[19].title, _end: 0});
                }else{
                    return res.json({list : list, _tail: recipes[recipes.length-1].title, _end: 1});
                }

            }else{
                return res.json({list : [], _tail: "", _end: 1});
            }

        }else{
            return res.status(404).json({message: "Error retrieving recipes."});
        }

    })

    return router;
}