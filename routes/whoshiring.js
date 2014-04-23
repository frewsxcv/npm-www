module.exports = whoshiring

var whos_hiring = require('../static/whos_hiring.json')
  , td = {}

td.title = "Who's Hiring?"

function whoshiring (req, res) {
  req.model.load("profile", req)
  req.model.load("whoshiring")
  req.model.end(function(er, m) {
    if(er) return res.error(er)
    td.profile = m.profile
    td.companies = whos_hiring.companies
    td.hiring = m.whoshiring
    res.template('whoshiring.ejs', td)
  })
}