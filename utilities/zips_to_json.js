const csv = require('fast-csv');
const fs = require('fs');

const input_filename = "../data/US Zip Codes from 2013 Government Data.csv";
// const input_filename = "../data/zip_subset.csv";
const output_filename = "../data/zips.json";

checkDataFile(input_filename)
.then(writeJSONfile)
.then( (result) => {
    console.log(result);
})
.catch( (error) => {
    console.log("Oops", error);
});

function writeJSONfile(data) {
    return new Promise((resolve, reject) => {
        
        var output_data = JSON.stringify(data);
        fs.writeFile(output_filename, output_data, function (err){
        
            if(err) {
                reject(err);
                return;
            }
            
            resolve("The file was saved!");
            
        });
        
    });
}

function checkDataFile(file){
    return new Promise(function (resolve, reject) {
        
        var zips = {};
        var stream = fs.createReadStream(file);

        // set up listeners for every line in the CSV stream
        // assumes CSV header is "ZIP,LAT,LNG"
        csv
            .fromStream(stream, {
                delimiter: ',', 
                trim: true,
                headers: true
            })
            .on("data", function(data){
                
                // data is an array
                // build the "zips" library
                zips[data.ZIP] = {lat: data.LAT, lon: data.LNG};
                         
            })
            .on("end", function(){
                // console.log(file + " done");
                return resolve(zips);
            })
            .on("error", function(error){
                return reject(error);
            });
    });
}
