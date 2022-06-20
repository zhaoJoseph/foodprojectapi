require('dotenv').config();

const port = process.env.PORT || 3000;

const app = require('../config/index');

app.listen(port, (err) => {
    if(!err){
        console.log(`listening on port ${port}`);
    }else{
        console.log(err);
    }
}); 

