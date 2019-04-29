var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { userName: '손님', targetWeight: '0kg' });
});

module.exports = router;
