var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');
var fs = require('fs');
var ImgParser = require('../util/imgParser');


router.get('/', function(req, res, next) {
  var params = {
    userName : (req.session == undefined)? null:req.session.userName,
    targetWeight : (req.session == undefined)? null:req.session.targetWeight,
    profileIMG : (req.session == undefined)? null:req.session.profileIMG,
    email : (req.session == undefined)? null:req.session.email,
    birth : '',
    weight : '',
    height : '',
    gender : ''
  };

  if(req.session.session == undefined){
    res.render('profile', params);
    return;
  }

  sqlManager(function(err, con) {
    var queryUser = 'SELECT * FROM USER WHERE EMAIL = ?;';
    con.query(queryUser, req.session.email, function(err, result){
      con.release();
      if(err){
        con.release();
        next(new Error('ERR006|' + req.countryCode));
        return;
      }
      
      if(result.length != 0){
        params.gender = result[0].GENDER; 
        var birth = new Date(result[0].BIRTH_YMD);
        birth.setDate(birth.getDate() +1);
        params.birth = birth;
        params.weight = result[0].WEIGHT;
        params.height = result[0].HEIGHT;
      }

      res.render('profile', params);  
    });
  });
});

var multer  = require('multer');
var upload = multer();
router.put('/', upload.array('profileIMG',1), function(req, res, next){
  sqlManager(function(err, con) {
    var loginQuery = 'UPDATE `DIET_MANAGER`.`USER` SET `USER_NM` = ?, `BIRTH_YMD` = ?, `GENDER` = ?, `WEIGHT` = ?, `HEIGHT` = ? WHERE (`EMAIL` = ?);';
    var queryParams = [
                        req.body.name,
                        req.body.birthDay,
                        req.body.gender,
                        req.body.weight,
                        req.body.height,
                        req.session.email
                      ];
    con.query(loginQuery, queryParams, function(err, result) {
      con.release();
      if (err) {
        con.release();
        next(new Error('ERR006|' + req.countryCode));
				return;
      }

      var resultParams = {
        'isSuccess' : false
      };

      if(result.affectedRows == '1'){
        req.session.userName  = req.body.name;
        


        if(req.files.length != 0) {
					var profileIMG = req.files[0].buffer;
					var imageFileName = req.session.email + '.jpg';
					var dirPath = __dirname + '/../resource/raw/image/profile/' + imageFileName;
					
					fs.writeFile(dirPath, profileIMG, function(err) {
						if(err) {
							new Error(err.message);
							return;
            }
            
            var imgParser = new ImgParser();
            req.session.profileIMG = "data:image/jpeg;base64," + imgParser.convertToBuffer(imageFileName);
            resultParams.profileIMG = req.session.profileIMG;
          
						resultParams.isSuccess = true;
            res.send(resultParams);
					});					
        }else{
          resultParams.isSuccess = true;
          res.send(resultParams);
        }
      }else{
        res.send(resultParams);
      }
    });
  });
});


module.exports = router;