var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');
var crypto = require('crypto');
var ImgParser = require('../util/imgParser');


router.put('/login', function(req, res, next){
  if(req.body.registType == 'g'){
    req.body.password = req.body.token;
  }

  sqlManager(function(err, con) {
    var loginQuery = 'SELECT count(*) AS correct, PROFILE_IMG, USER_NM, USER_ID FROM DIET_MANAGER.USER where EMAIL = ? and PASSWORD = concat("*", sha1(unhex(sha1(?))))';
    var queryParams = [
                        req.body.email,
                        req.body.password
                      ];
    con.query(loginQuery, queryParams, function(err, result) {
      if (err) {
        con.release();
        next(new Error('ERR006|' + req.countryCode));
				return;
      }
      result = result[0];
      
      var resultParams = {
        isSuccess : true
      };

      if(result.correct == '1'){
        afterLoginSuccess(resultParams, result, con);
      }else{
        resultParams.isSuccess = false;
        res.send(resultParams);
      }      
    });
  });

  function afterLoginSuccess(resultParams, result, con){
    resultParams.userName = result.USER_NM;
    req.session.userName  = result.USER_NM;
    req.session.email = req.body.email;
    
    var currentDate = (new Date()).valueOf().toString();
    var random = Math.random().toString();
    var session = crypto.createHash('sha1').update(currentDate + random).digest('hex');
    resultParams.session = session;
    req.session.session = session;
    req.session.profileIMG = null;

    if(result.PROFILE_IMG != null) {
      var imgParser = new ImgParser();
      if(imgParser.convertToBuffer(result.PROFILE_IMG) != undefined){
        req.session.profileIMG = "data:image/jpeg;base64," + imgParser.convertToBuffer(result.PROFILE_IMG);
        resultParams.profileIMG = req.session.profileIMG;
      }
    }
    
    var query = 'SELECT TARGET_WEIGHT FROM DIET_MANAGER.DIET_SURVEY where USER_ID = ?';
    con.query(query, result.USER_ID, function(err, result) {
      
      if (err) {
        con.release();
        next(new Error('ERR006|' + req.countryCode));
        return;
      }
      con.release();

      if(result.length == 1){
        resultParams.targetWeight = result[0].TARGET_WEIGHT;
        req.session.targetWeight =  result[0].TARGET_WEIGHT;
      }

      res.send(resultParams);
    });
  }
});
router.put('/logout', function(req, res,next){
  var resultParams = {
    isSuccess : true
  };

  if(req.session.userName != undefined){
    req.session.destroy(function(err){
      if(err){
        console.log(err);
        next(new Error('ERR006|' + req.countryCode));
        return;
      }else{
        res.send(resultParams);
      }
    });
  }else{
    resultParams.isSuccess =false;
    res.send(resultParams);
  }
});

router.put('/checkwritedailyreport', function(req, res, next){
  sqlManager(function(err, con) {
    var resultParams = {
      isSuccess : false,
      isWrite : false
    };
  
    var date = new Date(); 
    var year = date.getFullYear(); 
    var month = new String(date.getMonth()+1); 
    var day = new String(date.getDate()); 
  
    if(month.length == 1){ 
     month = "0" + month; 
    } 
    if(day.length == 1){ 
      day = "0" + day; 
    }
  
    var currentDate = year + "-" + month + "-" + day;
  
    var params = [
      req.session.email,
      currentDate
    ];
  
    var query = 'SELECT count(*) AS correct FROM DAILY_SURVEY WHERE DAILY_SURVEY.USER_ID IN (SELECT USER_ID FROM USER WHERE EMAIL=?) and DAILY_SURVEY.RECORD_YMD = ?';
    con.query(query, params, function(err, result) {
  
      if (err) {
        con.release();
        next(new Error('ERR006|' + req.countryCode));
        return;
      }
      con.release();
      result = result[0];
  
      if(result.correct == 1) {
        resultParams.isWrite = true;
        res.send(resultParams);
      } else {
        resultParams.isWrite = false;
        res.send(resultParams);
      }
    });
  });
});

module.exports = router;