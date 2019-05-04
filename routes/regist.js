var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');
var fs = require('fs');
var crypto = require('crypto');


router.get('/', function(req, res, next) {
  var params = {
    registUserName : (req.query.userName == undefined)? null:req.query.userName,
    targetWeight : (req.session == undefined)? null:req.session.targetWeight,
		registProfileIMG : (req.query.profile == undefined)? null:req.query.profile,
		email : (req.query.email == undefined)? null:req.query.email,
		registType : (req.query.registType == undefined)? null:req.query.registType
  };
  res.render('regist', params);
});

router.get('/checkEmail', function(req, res, next) {
	sqlManager(function(err, con) {
		var IDCheckQuery = 'SELECT COUNT(*) AS isExist, REGIST_TYPE FROM DIET_MANAGER.USER WHERE EMAIL = ?';
		con.query(IDCheckQuery, req.query.email, function(err, result){
      con.release();
			if(err){
				con.release();
				next(new Error('ERR006|' + req.countryCode));
				return;
			}
			
			result = result[0];
			
			var resultParams = {
					isDuplicate : false
			};
			if(result.isExist != '0'){
				resultParams.isDuplicate = true;
				resultParams.registedType = result.REGIST_TYPE;
			}
			
			res.send(resultParams);
		});
	});
});

var multer  = require('multer');
var upload = multer();
router.post('/', upload.array('profileIMG',1),function(req, res, next) {
  sqlManager(function(err, con) {
    var query = 'SELECT COUNT(*) AS isExist FROM DIET_MANAGER.USER WHERE EMAIL = ?';
    con.query(query, req.body.email, function(err, result){
      if(err){
        next(new Error('ERR006'));
        return;
      }

      result = result[0];

			if(result.isExist == '0'){
				var imageFileName = req.body.email + '.jpg';
				var dirPath = __dirname + '/../resource/raw/image/profile/' + imageFileName;

				if(req.files.length != 0) {
					var profileIMG = req.files[0].buffer;
					
					fs.writeFile(dirPath, profileIMG, function(err) {
						if(err) {
							new Error(err.message);
							return;
						}
						
						regist(imageFileName);
					});					
				}else if(req.body.profileIMGvURL != undefined){
					req.body.profileIMGvURL = req.body.profileIMGvURL.replace(/^data:image\/\w+;base64,/, '');
					fs.writeFile(dirPath, req.body.profileIMGvURL, 'base64', function(err) {
						if(err) {
							new Error(err.message);
							return;
						}
						
						regist(imageFileName);
					});
				} else {
					regist(null);
				}
			        
				function regist(imageFileName) {
					if(req.body.registType != 'e'){
						var currentDate = (new Date()).valueOf().toString();
						var random = Math.random().toString();
						req.body.password = crypto.createHash('sha1').update(currentDate + random).digest('hex');
					}

					var insertUserProfileQuery = "INSERT INTO DIET_MANAGER.USER (PROFILE_IMG, USER_NM, EMAIL, PASSWORD, BIRTH_YMD, GENDER, WEIGHT, HEIGHT, COUNTRY_CD, REGIST_TYPE, REGIST_YMD)" +
							" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())";
					var queryParams = [imageFileName, req.body.name, req.body.email, 
					                   req.body.password, req.body.birthDay, req.body.gender, 
					                   req.body.weight, req.body.height, req.countryCode, 
					                   req.body.registType];
          con.query(insertUserProfileQuery, queryParams, function(err, result) {
            con.release();
						if(err) {
							con.release();
							next(new Error('ERR006|' + req.countryCode));
							return;
            }
            
						var resultParams = {
              'isSuccess' : false
            };
            if(result.affectedRows == '1'){
              resultParams.isSuccess = true;
            }
            
            res.send(resultParams);
					});
				}
			} else {
				con.release();
				var resultParams = {
					'isSuccess' : false,
					'alreadyRegist' : true
				}
				res.send(resultParams);
			}
    });
  });
});

module.exports = router;