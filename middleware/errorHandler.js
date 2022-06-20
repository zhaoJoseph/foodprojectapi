function errorHandler(error, req, res, next) {
    console.log(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(error.status);
    res.send(JSON.stringify({message : error.message}));
}

module.exports = {errorHandler};