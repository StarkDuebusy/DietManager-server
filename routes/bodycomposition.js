var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');


router.get('/', function(req, res, next) {
  var params = {
    userName : (req.session == undefined)? null:req.session.userName,
    targetWeight : (req.session == undefined)? null:req.session.targetWeight, 
    profileIMG : (req.session == undefined)? null:req.session.profileIMG,
    recordList : []  
  };
  
  if(req.session.session == undefined){
    res.render('bodycomposition', params);
  }else{
    sqlManager(function(err, con) {
      var checkQuery = 'SELECT BODY_WEIGHT, BODY_MUSCLE, BODY_FAT, date_format(RECORD_YMD, "%Y-%m-%d") as RECORD_YMD FROM DIET_MANAGER.BODYCOMPOSITION WHERE USER_ID = (SELECT USER_ID FROM USER WHERE EMAIL = ?) ORDER BY RECORD_YMD DESC ;';
      con.query(checkQuery, req.session.email, function(err, result){
        if(err){
          con.release();
          next(new Error('ERR006|' + req.countryCode));
          return;
        }
        con.release(); 
        
        if(result.length != 0){
          for(var recordIndex = 0; recordIndex < result.length; recordIndex++){
            var bodyFatPercentage = (result[recordIndex].BODY_FAT/result[recordIndex].BODY_WEIGHT)*100;
            result[recordIndex].BODY_FAT_PERCENTAGE = Math.round((bodyFatPercentage*100))/100;
          }
          params.recordList = result;
          params.defaultWeight = result[0].BODY_WEIGHT;
          params.defaultMuscle = result[0].BODY_MUSCLE;
          params.defaultFat = result[0].BODY_FAT;
        }else{
          params.defaultWeight = '',
          params.defaultMuscle = '',
          params.defaultFat = ''
        }
        res.render('bodycomposition', params);
      });
    });
  }
});

router.post('/', function(req, res, next) {
  if(req.session.session == undefined){
    var resultParams = {
      isSuccess : false,
      needLogin : true
    };
    res.send(resultParams);
    return;
  }

	sqlManager(function(err, con) {
    var checkQuery = 'SELECT count(*) as isExist FROM DIET_MANAGER.BODYCOMPOSITION WHERE USER_ID = (SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?) AND RECORD_YMD = ?;';
    var params = [
      req.session.email,
      req.body.recordDate
    ];
		con.query(checkQuery, params, function(err, result){
			if(err){
        con.release();
				next(new Error('ERR006|' + req.countryCode));
				return;
			}
			result = result[0];
			
			if(result.isExist == '0'){
        var query = 'INSERT INTO `DIET_MANAGER`.`BODYCOMPOSITION` (`USER_ID`, `BODY_MUSCLE`, `BODY_FAT`, `BODY_WEIGHT`, `RECORD_YMD`) VALUES ((SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?), ?, ?, ?, ?);';
        var params = [
          req.session.email,
          req.body.bodyMuscle,
          req.body.bodyFat,
          req.body.bodyWeight,
          req.body.recordDate
        ];
        con.query(query, params, function(err, result){
          if(err){
            con.release();
            next(new Error('ERR006|' + req.countryCode));
            return;
          }
          con.release(); 

          var resultParams = {
            'isSuccess' : false
          };
          if(result.affectedRows == '1'){
            resultParams.isSuccess = true;
          }
          
          res.send(resultParams);
        });
			}else{
        var query = 'UPDATE `DIET_MANAGER`.`BODYCOMPOSITION` SET `BODY_MUSCLE` = ?, `BODY_FAT` = ?, `BODY_WEIGHT` = ? WHERE `USER_ID` = (SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?) AND RECORD_YMD = ?;';
        var params = [
          req.body.bodyMuscle,
          req.body.bodyFat,
          req.body.bodyWeight,
          req.session.email,
          req.body.recordDate
        ];
        con.query(query, params, function(err, result){
          if(err){
            con.release();
            next(new Error('ERR006|' + req.countryCode));
            return;
          }
          con.release(); 

          var resultParams = {
            'isSuccess' : false
          };
          if(result.affectedRows == '1'){
            resultParams.isSuccess = true;
          }
          
          res.send(resultParams);
        });
      }
		});
	});
});



module.exports = router;