var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');


router.get('/', function(req, res, next) {
  sqlManager(function(err, con) {
		var checkQuery = 'SELECT * FROM DIET_MANAGER.NUTRITION;';
		con.query(checkQuery, null, function(err, result){
			if(err){
				con.release();
				next(new Error('ERR006|' + req.countryCode));
				return;
      }
      
      var params = {
        userName : (req.session == undefined)? null:req.session.userName,
        targetWeight : (req.session == undefined)? null:req.session.targetWeight,
        profileIMG : (req.session == undefined)? null:req.session.profileIMG,
        recordList : []
      };
      
      params.proteinList = [];
      params.carboList = [];
      for(var index = 0; index < result.length; index++){
        if(result[index].TARGET == 'c'){
          params.carboList.push(result[index].NAME);
        }else if(result[index].TARGET == 'p'){
          params.proteinList.push(result[index].NAME);
        }
      }

      if(req.session.session == undefined){
        con.release();
        res.render('bodyrecord', params);  
      }else{
          var checkQuery = 'SELECT CARBO_RATE, PROTEIN_RATE, CURRENT_WEIGHT, TARGET_WEIGHT, MEAL_FREQUENCY, date_format(RECORD_YMD, "%Y-%m-%d") as RECORD_YMD FROM DIET_MANAGER.DAILY_SURVEY WHERE USER_ID = (SELECT USER_ID FROM USER WHERE EMAIL = ?);';
          con.query(checkQuery, req.session.email, function(err, result){
            if(err){
              con.release();
              next(new Error('ERR006|' + req.countryCode));
              return;
            }
            con.release();
            
            if(result.length != 0){
              for(var recordIndex = 0; recordIndex < result.length; recordIndex++){
                var targetWeight = result[recordIndex].TARGET_WEIGHT;
                var proteinRate = result[recordIndex].PROTEIN_RATE;
                var proteinTotalWeight = targetWeight * proteinRate;
                var mealFrequency = result[recordIndex].MEAL_FREQUENCY;
                result[recordIndex].PROTEIN = Math.round((proteinTotalWeight/0.2955)/mealFrequency);
  
                var carboRate = result[recordIndex].CARBO_RATE;
                var carboTotalWeight =  targetWeight * carboRate;
                result[recordIndex].CARBO = Math.round((carboTotalWeight/0.4585)/mealFrequency);
              }
              params.recordList = result;
            }
  
            res.render('bodyrecord', params);  
          });
       }
     });		
   });
 });


module.exports = router;