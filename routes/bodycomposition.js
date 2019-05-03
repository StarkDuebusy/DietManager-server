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
      var checkQuery = 'SELECT BODY_WEIGHT, BODY_MUSCLE, BODY_FAT, date_format(RECORD_YMD, "%Y-%m-%d") as RECORD_YMD FROM DIET_MANAGER.BODYCOMPOSITION WHERE USER_ID = (SELECT USER_ID FROM USER WHERE EMAIL = ?);';
      con.query(checkQuery, req.session.email, function(err, result){
        con.release();
        if(err){
          con.release();
          next(new Error('ERR006|' + req.countryCode));
          return;
        }
        
        if(result.length != 0){
          for(var recordIndex = 0; recordIndex < result.length; recordIndex++){
            var bodyFatPercentage = (result[recordIndex].BODY_FAT/result[recordIndex].BODY_WEIGHT)*100;
            result[recordIndex].BODY_FAT_PERCENTAGE = Math.round((bodyFatPercentage*100))/100;
          }
          params.recordList = result;
        }

        res.render('bodycomposition', params);  
      });
    });
  }
});


module.exports = router;