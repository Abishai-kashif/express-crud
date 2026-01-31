var express = require('express');
var router = express.Router();



/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/update', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/create', function(req, res, next) {
  res.send('respond with a resource');
});

router.delete('/delete', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;