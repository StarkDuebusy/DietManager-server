var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');
var redis = require('../manager/redisManager');
var crypto = require('crypto');
var ImgParser = require('../util/imgParser');


router.put('/', function(req, res, next){
  sqlManager(function(err, con) {
    var query = 'SELECT count(*) AS correct, PROFILE_IMG, USER_NM FROM DIET_MANAGER.USER where EMAIL = ? and PASSWORD = ?';
    var queryParams = [
                        req.body.email,
                        req.body.password
                      ];
    con.query(query, queryParams, function(err, result) {
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
        var currentDate = (new Date()).valueOf().toString();
        var random = Math.random().toString();
        var session = crypto.createHash('sha1').update(currentDate + random).digest('hex');
        
        redis.set(req.body.ID, session);

        resultParams.session = session;

        req.session.session = session;
        req.session.ID = req.body.ID;
        req.session.autoLogin = req.body.autoLogin;
        req.session.storeName = result.STORE_NM;
        req.session.ownerName = result.OWNER_NM;
        req.session.auth = result.AUTH;
        
        if(result.PROFILE_IMG == null) {
          req.sesssion.profileIMG = null;
        }else{
          var imgParser = new ImgParser();
          req.session.profileIMG = "data:image/jpeg;base64," + imgParser.convertToBuffer('user/', result.PROFILE_IMG);
        }
        
      }else{
        resultParams.isSuccess = false;
      }

      res.send(resultParams);
    });
  });
});


module.exports = router;