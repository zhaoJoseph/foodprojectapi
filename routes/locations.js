module.exports = (router, runQuery, app) => {
    const fetch = require('cross-fetch');
    const {Client} = require("@googlemaps/google-maps-services-js");
    require('dotenv').config();

    function haversine_distance(mk1, mk2) { //Distance between two points on earth, https://cloud.google.com/blog/products/maps-platform/how-calculate-distances-map-maps-javascript-api
        var R = 6371.0710; // Radius of the Earth in kilometers
        var rlat1 = mk1.lat * (Math.PI/180); // Convert degrees to radians
        var rlat2 = mk2.lat * (Math.PI/180); // Convert degrees to radians
        var difflat = rlat2-rlat1; // Radian difference (latitudes)
        var difflon = (mk2.lng-mk1.lng) * (Math.PI/180); // Radian difference (longitudes)

        var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat/2)*Math.sin(difflat/2)+Math.cos(rlat1)*Math.cos(rlat2)*Math.sin(difflon/2)*Math.sin(difflon/2)));
        return d;
    }

    router.get('/', async (req, res) => {
        const client = new Client({});
        let reqList = JSON.parse(req.query.requests);
        let reqLocation = JSON.parse(req.query.location);
        reqList.shift();
        var places = [];
        for(var reqStr of reqList){
            await client
            .textSearch({
                params: {
                    query: reqStr.item,
                    location: reqLocation,
                    key: process.env.PLACES_API_KEY,
                    radius: 5000,
                },
                timeout: 3000,
            }).then(re => {
                if(re.statusText == "OK"){
                    var placeResult = re.data.results.filter(placeObj => {return placeObj.types.some(str => str == "food")});
                    for(obj of placeResult){
                        if(!places.some(placeObj => placeObj.formatted_address == obj.formatted_address)){
                            obj['distance'] = haversine_distance(reqLocation, obj.geometry.location).toFixed(2);
                            if(!obj.hasOwnProperty('tags')){
                                obj['tags'] = [];
                            }
                            obj['tags'].push(reqStr.item);
                            places.push(obj);
                        }else{
                            var index = places.findIndex(x => x.formatted_address == obj.formatted_address);
                            if(!places[index].hasOwnProperty('tags')){
                                places[index]['tags'] = [];
                            }else{
                                places[index]['tags'].push(reqStr.item);
                            }
                        }

                    }
                }else{
                    console.log(re);
                    return res.status(404).json({message: re.status});
                }
            }).catch(err => {
                console.log("error", err);
                return res.status(404).json({message: err});
            })

        }
        return res.status(200).json({results: JSON.stringify(places)});

    } )

    return router;
}
