function findKeyValue(object, keyArr) { // function for querying specifically JSON-LD Data
            
    // Assumptions: if the type is script of the node then it contains 
    // All node objecst contain a type key.
    // a children key to a list of nodes.
    // if the type is text then the node contains a data key.
    returnObj = {};
    for (var key in object){
        try{
        var value = object[key];
        if(typeof value == 'object' && 'type' in value && value.type == 'script'){
            returnObj = Object.assign(returnObj, findKeyValue(value.children, keyArr)) ;
        }else if(typeof value == 'object' && 'type' in value && value.type == 'text'){
            try{ 
                var dataObj = JSON.parse(value.data.replace(/(\r\n|\n|\r|\t)/gm, ""));
                if(!Array.isArray(dataObj)){
                    var realData = dataObj;
                    dataObj = [];
                    dataObj.push(realData);
                }
                returnObj = Object.assign(returnObj, findKeyValue(dataObj, keyArr));
            }catch(err){
                console.log(err);
            }
        }else if(typeof value == 'object' && '@type' in value){   //Following Googgle's recipe schema for JSON LD data
            if((Array.isArray(value['@type']) && value['@type'].includes('Recipe')) || (value['@type'] == 'Recipe')){
            for( const arrKey of keyArr){
                if(value[arrKey]){
                    returnObj[arrKey] = value[arrKey];
                }
            }
            }
        }else if(typeof value == 'object' && '@graph' in value){ // Another possibility is the recipe key is inside a graph key
            returnObj = Object.assign(returnObj, findKeyValue(value['@graph'], keyArr));
        }
    }catch(err){
        console.log(err);
    }
    }
    return returnObj;
}

function manualSearch(object, $, keyArr){
    if(!object.hasOwnProperty("name")){ // search for title of recipe

        var title = $('meta[property="og:title"]').attr('content');
        if(title == undefined){
            title = $("title").text();
        }
        if(title != undefined){
            object['name'] = title.replaceAll(/(recipe|[\|].*)/gi, "").trim();
        }
    }
    var yieldRegex = /^(Servings?|Number of Servings|Yields?|Serves?):?.*[^.]$/i;
    var prepRegex = /^(Prep Time|Prep:):?/i;
    var cookRegex = /^(Cook Time|Cooking:|Total Time:|Total:|Time):?.*(mins?|hours?|minutes?)$/i;
    var ingredientRegex = /^(Ingredients[^.]*|Ingredients.*:):?$/gi;
    var directionRegex = /^(Directions|Procedure|Preparation|For.*:|Method|Instructions|How To[^.]*|Procedure\[.*\]):?$/gi;
    var timeRegex = /Time/gi;
    var stepRegex = /^(\d* ?\.? ?).+[.?!\(\)]$/i; //unicode chars for vulgar fractions
    var ingredientItemRegex = /^([\d]*|[\u00BC-\u00BE\u2150-\u215E]|[A-Za-z]*).*[^\.?!]$/i;
    
    var yieldResult = [];
    var prepResult = [];
    var cookResult = [];

    if(!object.hasOwnProperty("recipeYield")){ // if no servings then find a tag that contains the string 
                                                // Servings, Serving, Make, Yield, Serves, without/with : at end     
        yieldResult = $('*').filter(function() {
            return yieldRegex.test($(this).text().trim().replace(/\s+/gi, " ")) && !timeRegex.test($(this).text().trim());
        });
            if(yieldResult.length > 0 ){
                if(/[\d]+[^\.]*/.test($(yieldResult[0]).text().trim().replace(/\s+/gi, " ")) ){ 
                object['recipeYield'] = $(yieldResult[0]).text().trim().replace(/\s+/gi, " ");
            }
        }
    }
    if(!object.hasOwnProperty("prepTime")){

        prepResult = $('*').filter(function() {
            return prepRegex.test($(this).text().trim().replace(/\s+/gi, " "));
        });

        if(prepResult.length > 0){
            if(/[\d]+/.test($(prepResult[0]).text().trim().replace(/\s+/gi, " "))){
                if(/cook/gi.test($(prepResult[0]).text().trim().replace(/\s+/gi, " "))){ // sometimes the cooking time is also on the same text as the prep time
                // Assumptions: the prep time comes before cooking time
                object['prepTime'] = $(prepResult[0]).text().trim().replace(/\s+/gi, " ").split(/cook/gi)[0];
                object['cookTime'] = $(prepResult[0]).text().trim().replace(/\s+/gi, " ").split(/cook/gi)[1];
                }else{
                object['prepTime'] = $(prepResult[0]).text().trim().replace(/\s+/gi, " ");
                }
            }
        }
    }

    if(!object.hasOwnProperty("cookTime")){

        cookResult = $('*').filter(function() {
            return cookRegex.test($(this).text().trim().replace(/\s+/gi, " "));
        });

        if(cookResult.length > 0){
            if(/[\d]+/.test($(cookResult[0]).text())){
                object['cookTime'] = $(cookResult[0]).text().trim().replace(/\s+/gi, " ");
            }
        }   
    }
    if(!object.hasOwnProperty("recipeInstructions") || !object.hasOwnProperty("recipeIngredient")){
        var ingredientResult = $('*').filter(function() {
            return ingredientRegex.test($(this).text().trim().replace(/\s+/gi, " ")) && !$(this).is("a") 
            && !$(this).parent().is("ul") && !$(this).parent().is("a");
        });
        var directionResult = $('*').filter(function() {
            return directionRegex.test($(this).text().trim().replace(/\s+/gi, " ")) && !$(this).is("a")
            && !$(this).parent().is("ul") && !$(this).parent().is("a"); // these are checks to make sure we dont target menus 
        });
        //first we extract the ingredients
        if(ingredientResult.length > 0 && directionResult.length > 0){
            // Now we get the lowest common ancestor between the ingredient header and directions header
            // Assuming: the ingredients section appears before the directions header
            var directionIn = -1;
            var ingredientIndex = 0;
            var directionIndex = 0;
            var lca = null;
            var childNodes = [];
            do{
            directionIn += 1;
            lca = $(ingredientResult[0]).parents().has($(directionResult[directionIn])).first();
            childNodes = $(lca).children();
            ingredientIndex = 0;    
            while((ingredientIndex < $(childNodes).length) &&  
                !$(childNodes[ingredientIndex]).text().trim().replace(/\s+/, " ").includes($(ingredientResult[0]).text().trim().replace(/\s+/, " ")))
            {
                ingredientIndex++;
            }
            directionIndex = ingredientIndex;
            while((directionIndex < $(childNodes).length) && 
                !$(childNodes[directionIndex]).text().trim().replace(/\s+/, " ").includes($(directionResult[directionIn]).text().trim().replace(/\s+/, " ")))
            {
                directionIndex++;
            }
            }while(((directionIndex <= ingredientIndex)|| ( directionIndex >= childNodes.length) ) && (directionIn < directionResult.length) );

            if(directionIndex < childNodes.length && ingredientIndex < childNodes.length && directionIndex-ingredientIndex > 0){
                
                var childElems = [];
                var newChilds = [];
                var index = ingredientIndex;
                while(index < directionIndex){
                    newChilds.push(childNodes[index]);
                    index += 1;
                }
                $(newChilds).each(function(){
                    $(this).find('*').each(function() {
                        childElems.push($(this)[0]);
                    });
                    childElems.push($(this)[0]);
                })
                var ingredientList = [];
                for (ingredient of childElems){
                    if(
                       (ingredient.name == "p" && !ingredientRegex.test($(ingredient).text().trim().replace(/\s+/gi, " ")))
                        || (ingredient.name == "li" && !ingredientRegex.test($(ingredient).text().trim().replace(/\s+/gi, " ")))
                    ){
                        $(ingredient).text().trim().split(/[\t\n\r\f\v]+/).forEach(val => ingredientList.push(val.trim()));
                    }   
                }
                object['recipeIngredient'] = ingredientList;
                // now we extract the recipe steps
                // we filter out the leaf nodes that container the same header being used as the directions header
                // then match text content for regexes for ingredient steps
                newChilds = [];
                childElems = [];
                var headerType = $(directionResult[directionIn])[0].name;
                newChilds.push(childNodes[directionIndex]);
                index = directionIndex+1;
                while(index < childNodes.length && $(childNodes[index]).find(headerType).length == 0 ){
                    newChilds.push(childNodes[index]);
                    index += 1; 
                }
                $(newChilds).each(function(){
                    $(this).find('*').each(function() {
                        childElems.push($(this));
                    });
                    childElems.push($(this));
                })
                var recipeList = [];
                for(elem of childElems){
                    if(stepRegex.test($(elem[0]).text().trim().replace(/\s+/gi, " ")) && 
                    (/.*text.*/gi.test($(elem[0]).attr('class')) || $(elem[0])[0].name == 'p' || $(elem[0])[0].name == 'li')){
                        recipeList.push($(elem[0]).text().trim().replace(/\s+/gi, " "));
                    }
                }
                object['recipeInstructions'] = recipeList;
            }

        }else if(object.hasOwnProperty('name') || object.hasOwnProperty('cookTime') || object.hasOwnProperty('prepTime') || object.hasOwnProperty('recipeYield')){
            var index;
            var nameRegex = new RegExp("^(" + object['name'] + ")$","i");

            var findName = $('*').filter(function(){
                return nameRegex.test($(this).text().trim().replace(/\s+/gi, " ")) && !$(this).is('a') && !$(this).find('a').length;
              })
            
            $('*').each(function(i){
                if($(this).is(findName[0]) || $(this).is(prepResult[0]) || $(this).is(yieldResult[0]) || $(this).is(cookResult[0]) ){
                    index = i;
                }
            })

            var ingredientRemainders = $('*').slice(index + 1).filter(function(){
                return !$(this).closest('[class*="comment"]').length                        // sometimes there are comments 
                && ($(this).is('p') || $(this).is('li'))
                && ingredientItemRegex.test($(this).text().trim().replace(/\s+/gi, " "))
                && !/.*:.*/.test($(this).text().trim().replace(/\s+/gi, " "))              //make sure headers are not in the array
                && !$(this).find('a').length;                                               // assumption: ingredient is not a hyperlink
              })

            var ingredientList = [];
            for(ingredient of ingredientRemainders){
                $(ingredient).text().trim().split(/[\t\n\r\f\v]+/).forEach(val => ingredientList.push(val.trim()));
            }   

            object['recipeIngredient'] = ingredientList;

              //we extract the instructions

              var remainders = $('*').slice(index + 1).filter(function(){
                return !$(this).closest('[class*="comment"]').length                        // sometimes there are comments 
                && ($(this).is('p') || $(this).is('li'))
                && stepRegex.test($(this).text().trim().replace(/\s+/gi, " "))
                && !/.*:.*/.test($(this).text().trim().replace(/\s+/gi, " "))              //make sure headers are not in the array
                && !$(this).find('a').length;                                             // assumption: ingredient is not a hyperlink
              })

            var directionList = [];
            for(direction of remainders){
                $(direction).text().trim().split(/[\t\n\r\f\v]+/).forEach(val => {if(!ingredientList.includes(val)){directionList.push(val.trim())}});
            }   

  
            object['recipeInstructions'] = directionList;

        }
        
    }
}

module.exports = {findKeyValue, manualSearch};