module.exports = (router, runQuery, app) => {

    const fetch = require('node-fetch');
    const cheerio = require('cheerio'); 
    const {findKeyValue, manualSearch} = require('../helperFuncs/search');
    const authenticate = require('../middleware/authenticate');

    router.get('/', async (req, res) => {
        const id = req.query.id;
        const url = req.query.url;
        try{
            const result = await fetch(url);
            if (result.status >= 400) {
                return res.status(result.status).json({message: "Bad response from server"});
            }
            const header = result.headers.get('content-type');
            if(!header || !header.includes('text/html')){
                return res.status(404).json({message: "TypeError: Content cannot be parsed for text."});
            }else{
                const html = await result.text();
                const $ =  cheerio.load(html);
                var info = $("script[type='application/ld+json']");
                var keyWords = ["name", "prepTime", "cookTime", "recipeYield", "recipeIngredient", "recipeInstructions", "image"];
                var obj = findKeyValue(info, keyWords);

                //if keys are missing we search manually in html for missing info
                let missingKeys = [];
                for(var str of keyWords){
                    if(!obj.hasOwnProperty(str) && str != "image"){
                        missingKeys.push(str);
                    }
                }

                if(missingKeys.length > 0){
                    obj = Object.assign(obj, manualSearch(obj, $, keyWords));
                }

                if(!obj.hasOwnProperty("prepTime")){
                    obj.prepTime = 'P0DT0H0M';
                }

                if(!obj.hasOwnProperty("cookTime")){
                    obj.cookTime = 'P0DT0H0M';
                }


            }

        }catch (e){
            console.log(e);
            return res.status(404).json({message: e});
        }
        
        return res.status(200).json({message: "Recipe Found.", recipe: returnObj})

    })

    return router;   
}