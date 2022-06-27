const app = require('./index');
const {setTimeout} = require('timers/promises');
const supertest = require('supertest');     
const request = supertest(app);

let urlArr = [
    "https://www.allrecipes.com/recipe/20144/banana-banana-bread/",
    "https://www.recipetineats.com/bun-cha-vietnamese-meatballs/",
    "https://pinchofyum.com/crispy-chicken-tikka-bowls-with-mint-sauce",
    "https://www.foodnetwork.com/recipes/food-network-kitchen/sesame-pork-milanese-8585931",
    "https://www.adventuresofanurse.com/the-worlds-best-air-fryer-hot-ham-and-cheese-pinwheels/",
    "https://www.adventuresofanurse.com/red-velvet-cinnamon-rolls/",
    "https://www.epicurious.com/recipes/food/views/easy-brioche-crusted-salmon",
    "https://tasty.co/recipe/hotteok-korean-sweet-pancakes",
    "https://maplewoodroad.com/chestnuts-roasting-on-an-open-fire/",
    "https://www.delish.com/cooking/recipe-ideas/a38842769/white-chocolate-cake-recipe/",
    "https://food52.com/recipes/77204-garlic-butter-lobster-salad",
    "https://www.seriouseats.com/makheua-yao-pad-tao-jiao-stir-fried-eggplant-with-minced-pork-5235525",
    "https://www.myrecipes.com/recipe/oatmeal-pantry-cookies",
    "https://www.tasteofhome.com/recipes/bake-sale-lemon-bars/",
    "https://www.marthastewart.com/1545532/turmeric-mango-smoothie",
    "https://www.thepioneerwoman.com/food-cooking/recipes/a35889178/three-bean-salad/",
    "https://www.bonappetit.com/recipe/spanakopita-pie",
    "https://www.bhg.com/recipe/air-fried-meatballs-and-bell-peppers/",
    "https://www.simplyrecipes.com/recipes/crab_mango_and_avocado_salad/",
    "https://damndelicious.net/2022/04/23/homemade-crispy-hash-browns/",
    "https://www.pillsbury.com/recipes/easy-italian-crescent-roll-up-sandwiches/9ea8c513-1296-4190-9630-2eea9ac862bf",
    "https://www.bbcgoodfood.com/recipes/miso-mushroom-halloumi-burgers",
    "https://www.foodandwine.com/recipes/homemade-corn-tortillas",
    "https://www.halfbakedharvest.com/roasted-garlic-spaghetti-squash-lasagna-boats/",
    "https://www.bigoven.com/recipe/balsamic-pork-loin-roast/180996",
    "https://thewoksoflife.com/sesame-noodles/",
    "https://omnivorescookbook.com/chinese-beef-meat-pie/",
    "https://www.spicetheplate.com/pork/braised-pork-belly/",
    "http://www.food-india.com/recipe/R076_R100/R078.htm",
    "https://www.chinasichuanfood.com/how-to-make-chinese-red-oil/",
    "https://www.madewithlau.com/recipes/cantonese-sticky-rice",
    "https://www.bbc.co.uk/food/recipes/chicken_tandoori_74292",
    "https://claudia.abril.com.br/receitas/gratin-de-batata/",
    "https://www.acouplecooks.com/crustless-quiche-spinach/",
    "http://www.afghankitchenrecipes.com/recipe/potato-bolani-fried-afghan-flatbread/",
    "https://akispetretzikis.com/recipe/6572/sokolatakia-me-siko",
    "https://www.expressen.se/alltommat/recept/lattlagad-vegetarisk-lasagne-/",
    "https://www.bettycrocker.com/recipes/one-pot-lemon-basil-orzo-and-vegetables/598e8feb-e81d-4e4d-8bbe-ec8de47e2e09",
    "https://www.bowlofdelicious.com/salisbury-steak/",
    "https://www.budgetbytes.com/spicy-pickled-carrots/",
    "https://www.castironketo.net/blog/keto-oatmeal/",
    "https://www.chefkoch.de/rezepte/2091551337791224/Brokkoli-in-Pistazien-Ricotta-Sauce-mit-Kapern-auf-Pasta.html",
    "https://www.closetcooking.com/shrimp-fra-diavolo/",
    "https://www.cookinglight.com/recipes/peanut-butter-and-pretzel-truffles",
    "https://downshiftology.com/recipes/best-salsa-recipe/",
    "https://eatsmarter.de/rezepte/rindfleischspiesse-gruenem-spargel",
    "https://www.heb.com/recipe/recipe-item/pico-de-gallo-con-avocado/1392838671421",
    "https://recipes.timesofindia.com/recipes/chikoo-popsicle/rs90639083.cms",
    "https://www.vegrecipesofindia.com/upma-savoury-south-indian-breakfast-recipe-made-with-semolina/",
    "https://woop.co.nz/parmersan-pork-meatballs-346-2-f.html",
    "https://en.wikibooks.org/wiki/Cookbook:Au_Jus_Sandwich",
    "https://www.zenbelly.com/spring-chicken-soup/",
    "https://www.tudogostoso.com.br/receita/44579-almondega-cozida.html",
    "https://www.motherthyme.com/2017/01/one-pot-creamy-french-onion-pasta.html",
    "https://www.mybakingaddiction.com/easy-coleslaw/",
    "https://www.misya.info/ricetta/polpette-al-pistacchio.htm",
    "https://www.lekkerensimpel.com/frittata-met-spinazie-en-feta/",
    "https://littlespicejar.com/chicken-puff-pastry/",
    "https://www.kuchnia-domowa.pl/przepisy/przystawki-przekaski/594-paszteciki-drozdzowe-z-kapusta-grzybami",
    "https://www.justataste.com/raspberry-cream-cheese-danish-recipe/",
    "https://justbento.com/handbook/recipes-sides-and-fillers/spicy-miso-marinated-green-asparagus",
    "https://www.kwestiasmaku.com/przepis/mazurek-z-maslem-orzechowym",
    "https://mykitchen101en.com/baked-banana-walnut-egg-sponge-cakes-no-artificial-flavouring-baking-powder-baking-soda/",
    "https://healthyeating.nhlbi.nih.gov/recipedetail.aspx?linkId=11&cId=2&rId=20",
    "https://ohsheglows.com/2019/06/29/flourless-peanut-butter-cookies/",
    "https://cooking.nytimes.com/recipes/1023152-cheese-enchiladas?action=click&region=Sam%20Sifton%27s%20Suggestions&rank=1",
    "https://www.primaledgehealth.com/three-cheese-omelette/",
    "https://rachlmansfield.com/10-minute-greek-tortellini-salad-gluten-free/",
    "https://www.simplyquinoa.com/simple-banana-pancakes/",
    "https://www.skinnytaste.com/light-swiss-chard-frittata/",
    "https://bakingmischief.com/italian-roasted-potatoes/",
    "https://www.maangchi.com/recipe/sogogi-doenjang-jjigae",
    "https://hot-thai-kitchen.com/lemongrass-chicken/",
    "https://www.chinasichuanfood.com/dry-fried-cauliflower/",
    "https://www.davidlebovitz.com/apfel-marzipan-kuchen-german-apple-almond-cake-recipe/",
    "https://www.tienda.com/recipes/tomatoes-stuffed-with-potato-salad.html",
    "https://www.gutekueche.at/radieschenaufstrich-rezept-23255",
    "https://norecipes.com/shrimp-tempura-sushi-roll/",
    "http://userealbutter.com/2022/01/25/bakery-butter-cookies-recipe/#more-21929",
    "https://smittenkitchen.com/2022/04/snacky-asparagus/",
    "https://www.letseatcake.com/peanut-butter-bread/",
    "https://www.spendwithpennies.com/coconut-shrimp/",
    "https://www.gimmesomeoven.com/espinaca-con-queso-spinach-cheese-dip/",
    "https://www.dinneratthezoo.com/steak-kabobs/",
    "https://www.cookingclassy.com/kale-pesto/",
    "https://natashaskitchen.com/chicken-sandwich-recipe/",
    "https://www.twopeasandtheirpod.com/cabbage-soup/",
    "https://www.foodiecrush.com/strawberry-and-avocado-spinach-salad-with-chicken/",
    "https://www.browneyedbaker.com/pepper-steak-stir-fry/",
    "https://themodernproper.com/homemade-pico-de-gallo",
    "https://www.feastingathome.com/mole-black-beans/",
    "https://minimalistbaker.com/dark-chocolate-amaranth-bars-6-ingredients/",
    "https://tastesbetterfromscratch.com/super-sloppy-joes/",
    "https://therecipecritic.com/detox-smoothie/",
    "https://fitfoodiefinds.com/fajita-veggies/",

];

test.each(urlArr)(
    'url %s',   
    async (url) => {
            const keyArr = ["name", "recipeIngredient", "recipeInstructions"];
                await process.nextTick(() => { });
                var res = await request.get('/getRecipeURL').query({url: url});
                expect(res.status).toBe(200);
                keyArr.forEach(str => {
                    expect(res._body.recipe).toHaveProperty(str);
                });
    }

)