// a weighted randomizer for showing who's hiring in the npm nav

module.exports = hiring

var whos_hiring = require('../static/whos_hiring.json')

function hiring (showAll, cb) {
  if (typeof showAll === 'function') {
    cb = showAll
    showAll = false
  }

  if (showAll) {
    return cb(null, whos_hiring.companies)
  }

  var co = getRandomCompany(whos_hiring.companies)
  return cb(null, co)
}

// use a cumulative density function to calculate a weighted-random
function getRandomCompany (companies) {
  // assume all the weights add up to 100

  // pick a random number between 0-99
  var rand = Math.floor(Math.random() * 100)

  // loop through all the companies and find the one whose weight
  // covers the random number
  var runningTotal = 0
  for (var i = 0; i < companies.length; ++i) {
    if (rand >= runningTotal &&
        rand < (companies[i].show_percentage + runningTotal)) {
      companies[i].numCompanies = companies.length
      return companies[i]
    }

    runningTotal += companies[i].show_percentage
  }

  return {}
}