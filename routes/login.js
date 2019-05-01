var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');
var redis = require('../manager/redisManager');
var crypto = require('crypto');
var ImgParser = require('../util/imgParser');


router.put('/', function(req, res, next){
  sqlManager(function(err, con) {
    var loginQuery = 'SELECT count(*) AS correct, PROFILE_IMG, USER_NM, USER_ID FROM DIET_MANAGER.USER where EMAIL = ? and PASSWORD = ?';
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
        resultParams.userName = result.USER_NM;
        req.session.userName  = result.USER_NM;
        req.session.email = req.body.email;
        
        var currentDate = (new Date()).valueOf().toString();
        var random = Math.random().toString();
        var session = crypto.createHash('sha1').update(currentDate + random).digest('hex');
        redis.set(req.body.email, session);
        resultParams.session = session;
        req.session.session = session;

        req.session.email = req.body.email;
        
        if(result.PROFILE_IMG == null) {
          req.sesssion.profileIMG = null;
        }else{
          var imgParser = new ImgParser();
          req.session.profileIMG = "data:image/jpeg;base64," + imgParser.convertToBuffer(result.PROFILE_IMG);
          resultParams.profileIMG = req.session.profileIMG;
        }
        
        var query = 'SELECT TARGET_WEIGHT FROM DIET_MANAGER.DIET_SURVEY where USER_ID = 1';
        con.query(query, result.USER_ID, function(err, result) {
          con.release();
          if (err) {
            con.release();
            next(new Error('ERR006|' + req.countryCode));
            return;
          }

          if(result.length == 1){
            resultParams.targetWeight = result[0].TARGET_WEIGHT;
            req.session.targetWeight =  result[0].TARGET_WEIGHT;
          }

          res.send(resultParams);
        });
      }else{
        resultParams.isSuccess = false;
        res.send(resultParams);
      }      
    });
  });
});


module.exports = router;