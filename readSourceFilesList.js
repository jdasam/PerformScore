
var fs = require('fs');
var path = require('path');
var diretoryTreeToObj = function(dir, done) {
    var results = [];

    fs.readdir(dir, function(err, list) {
        if (err)
            return done(err);

        var pending = list.length;

        if (!pending)
            return done(null, {name: path.basename(dir), type: 'folder', children: results});

        list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    diretoryTreeToObj(file, function(err, res) {
                        results.push({
                            name: path.basename(file),
                            type: 'folder',
                            children: res
                        });
                        if (!--pending)
                            done(null, results);
                    });
                }
                else {
                    if (path.extname(file) == '.csv' && path.basename(file).split("_vel").length == 1){;
                        results.push({
                            type: 'file',
                            name: path.basename(file)
                        });
                    }
                    if (!--pending)
                        done(null, results);
                }
            });
        });
    });
};

var dirTree = ('sourceFiles');
var jsonfile = require('jsonfile')

diretoryTreeToObj(dirTree, function(err, res){
    if(err) console.error(err);

    console.log(JSON.stringify(res));
    var file = 'dataWithFile.json'
 
    jsonfile.writeFile(file, res, function (err) {
    console.error(err)
})
});

 

