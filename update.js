exports.update = function(url,dest,cb){
    var path = require('path');
    var fs = require('fs');
    var http = require('http');
    var rmdirSync = getRmDirFunc();
    var downloadZip = getDownLoadZipFunc();
    var copyFile = getCopyFilesFunc();
    var outerCb = cb || function(bool){console.log('gengxin:'+bool)};
    //url = "http://10.10.61.115:8080/update.zip"

    rmdirSync(path.resolve(dest,'./updateFolder'),function(e){
        if(!e){
            downloadZip(url,dest,function(success){
                if(success){
                    copyFile(path.resolve(dest,'./updateFolder/output'),outerCb);
                } else {
                    outerCb(false);
                }
            });
        } else {
            outerCb(false);
        }
    });

    function getDownLoadZipFunc(){
        function getHttpReqCallback(url, dest,cb) {
            var callback = function(res) {
                console.log("request: " + url + " return status: " + res.statusCode);
                var contentLength = parseInt(res.headers['content-length']);
                var fileBuff = [];
                res.on('data', function (chunk) {
                    var buffer = new Buffer(chunk);
                    fileBuff.push(buffer);
                });
                res.on('end', function() {
                    console.log("end downloading " + url);
                    if (isNaN(contentLength)) {
                        cb(false);
                        return;
                    }
                    var totalBuff = Buffer.concat(fileBuff);
                    console.log("totalBuff.length = " + totalBuff.length + " " + "contentLength = " + contentLength);
                    if (totalBuff.length < contentLength) {
                        cb(false);
                        return;
                    }
                    var updateFolderResult = fs.existsSync(path.resolve(dest,'./updateFolder'));
                    if(!updateFolderResult){
                        fs.mkdirSync(path.resolve(dest,'./updateFolder'));
                    }
                    fs.appendFile(path.resolve(dest,'./updateFolder/package.zip'), totalBuff, function(err){
                        if(!err){
                            var extract = require('extract-zip')
                            extract(path.resolve(dest,'./updateFolder/package.zip'), {dir:path.resolve(dest,'./updateFolder/output')}, function (err) {
                                if(!err){
                                    cb(true);
                                } else {
                                    cb(false);
                                }
                            });
                        }
                    });
                });
            };
            return callback;
        }

        return function(url,dest,cb){
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest);
            }
            console.log("start downloading "+url);
            var req = http.request(url, getHttpReqCallback(url, dest,cb));
            req.on('error', function(e){
                console.log("request " + url + " error, try again");
                cb(false);
            });
            req.end();
        };
    }
    
    function getRmDirFunc(){
        function iterator(url,dirs){
            var stat = fs.statSync(url);
            if(stat.isDirectory()){
                dirs.unshift(url);//收集目录
                inner(url,dirs);
            }else if(stat.isFile()){
                fs.unlinkSync(url);//直接删除文件
            }
        }
        function inner(path,dirs){
            var arr = fs.readdirSync(path);
            for(var i = 0, el ; el = arr[i++];){
                iterator(path+"/"+el,dirs);
            }
        }
        return function(dir,cb){
            cb = cb || function(){};
            var result = fs.existsSync(dir);
            if(!result){
                cb();
                return;
            }
            var dirs = [];
     
            try{
                iterator(dir,dirs);
                for(var i = 0, el ; el = dirs[i++];){
                    fs.rmdirSync(el);//一次性删除所有收集到的目录
                }
                cb()
            }catch(e){//如果文件或目录本来就不存在，fs.statSync会报错，不过我们还是当成没有异常发生
                e.code === "ENOENT" ? cb() : cb(e);
            }
        }
    }

    function getCopyFilesFunc(){
        return function(dir,outerCb){
            var pathArr=[];
            function getPaths(dir){
                var stat = fs.statSync(dir);
                if(stat.isDirectory()){
                    pathArr.push([dir,'d']);
                    var files = fs.readdirSync(dir);
                    for(var i=0;i<files.length;i++){
                        getPaths(path.resolve(dir,'./'+files[i]));
                    }
                } else {
                    console.log(dir);
                    pathArr.push([dir,'f']);
                }
            }
            function copyFile(src,updateRootPath){
                console.log(dest);
                var result = true;
                var destpath = path.join(dest,src[0]);
                console.log(destpath,src[0]);
                var result = fs.existsSync(destpath);
                if(!result){
                    if(src[1] == 'd'){
                        try{
                            fs.mkdirSync(path.join(updateRootPath,src[0]));
                        } catch(e){
                            result =  false;
                        }
                    } else {
                        try{
                            fs.linkSync(path.join(updateRootPath,src[0]),destpath);
                        }catch(e){
                            result = false;
                        }
                    }
                } else {
                    var stat = fs.statSync(destpath);
                    if(!stat.isDirectory()){
                        try{
                           fs.unlinkSync(destpath);
                        } catch(e){
                            result = false;
                        }

                        try{
                           fs.linkSync(path.join(updateRootPath,src[0]),destpath);
                        } catch(e){
                            result = false;
                        }
                    }
                }
                return result;
            }
            getPaths(dir);

            var updateRootPath = pathArr[1][0];
            for(var i=2;i<pathArr.length;i++){ 
                pathArr[i][0] = path.relative(updateRootPath,pathArr[i][0]);
                var result = copyFile(pathArr[i],updateRootPath);
                if(!result){
                    outerCb(false);
                    return;    
                }
                
            }
            outerCb(true)
        }
    }
}