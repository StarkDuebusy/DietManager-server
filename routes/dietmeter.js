var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');

router.get('/', function(req, res, next) {
  if(req.session.session == undefined){
    var resultParams = {
      isSuccess : false,
      needLogin : true
    };
    res.send(resultParams);
    return;
  }

  sqlManager(function(err, con) {
		var query = 'SELECT s.PROTEIN_RATE, s.CARBO_RATE, p.MEAL_FREQUENCY, p.TARGET_WEIGHT '+
                        'FROM DIET_MANAGER.DAILY_SURVEY as s, DIET_MANAGER.DIET_SURVEY as p '+
                      'WHERE '+
                        's.USER_ID = (select USER_ID from USER where email = ?) AND '+
                          's.USER_ID = p.USER_ID '+
                      'ORDER BY s.RECORD_YMD DESC LIMIT 1;';
		con.query(query, req.session.email, function(err, result){
			if(err){
				con.release();
				next(new Error('ERR006|' + req.countryCode));
				return;
      }
      con.release();

      var resultParams = {
        isSuccess : false
      };
      
      if(result.length != 0 ){
        resultParams.isSuccess = true;
        
        result = result[0];

        resultParams.targetWeight = result.TARGET_WEIGHT;
        resultParams.mealFreq = result.MEAL_FREQUENCY;
        resultParams.carboRate = result.CARBO_RATE;
        resultParams.proteinRate = result.PROTEIN_RATE;
      }

      res.send(resultParams);
    });
  });
});

module.exports = router;