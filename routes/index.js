module.exports = indexPage

var lastUpdated
var interval = 10000
var cache = {}
var browse = require('../models/browse.js')
var recentauthors = require('../models/recentauthors.js')
var commaIt = require('comma-it').commaIt
var didStartup = false
var loading = false
function load (startup) {
  if (loading) return
  loading = true

  var n = 4
  browse('star', null, 0, 10, next('starred'))

  // last two weeks
  recentauthors(1000*60*60*24*14, 0, 10, next('authors'))
  browse('depended', null, 0, 10, next('depended'))
  browse('updated', null, 0, 10, next('updated'))

  function next (which) { return function (er, data) {
    if (startup && er) throw er
    cache[which] = data
    if (--n === 0) {
      loading = false
      lastUpdated = Date.now()
    }
  }}
}

setTimeout(function () {
  require('npm').load(function() {
    load(true)
  })
}, 100)

function indexPage (req, res) {
  // hasn't ever been loaded, just hold of a tick.
  if (!lastUpdated) return setTimeout(function() {
    indexPage(req, res)
  }, 100)

  var name = req.params.name
  , version = req.params.version || 'latest'

  if (!loading && (Date.now() - lastUpdated > interval)) load()

  req.model.load('packagescreated')

  // Show download count for the last day, week, and month.
  req.model.loadAs('downloads', 'dlDay', 'last-day', 'point')
  req.model.loadAs('downloads', 'dlWeek', 'last-week', 'point')
  req.model.loadAs('downloads', 'dlMonth', 'last-month', 'point')

  req.model.load('profile', req)
  req.model.load('whoshiring', false)

  req.model.end(function (er, m) {
    var locals = {
      profile: m.profile,
      title: 'npm',
      updated: cache.updated || [],
      authors: cache.authors || [],
      starred: cache.starred || [],
      depended: cache.depended || [],
      dlDay: commaIt(m.dlDay || 0),
      dlMonth: commaIt(m.dlMonth || 0),
      dlWeek: commaIt(m.dlWeek || 0),
      hiring: m.whoshiring || {},
      totalPackages: commaIt(m.packagescreated || 0)
    }
    res.template("index.ejs", locals)
  })
}
