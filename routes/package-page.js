module.exports = packagePage

var commaIt = require('comma-it').commaIt

function packagePage (req, res) {
  var name = req.params.name
  , version = req.params.version || 'latest'

  // preload profile, since we load other stuff based on that
  req.model.load('profile', req)
  req.model.end(function(er,profileModel) {
    req.model.load('package', req.params)
    req.model.load('whoshiring')
    req.model.load('browse', 'depended', req.params.name, 0, 1000)

    // Show download count for the last day, week, and month
    var dlDetail = 'point'
    // logged-in users get graphs
    if(profileModel.profile) {
      dlDetail = 'range'
      req.model.loadAs('downloads', 'dlMonth', 'last-month', dlDetail, name)
    } else {
      req.model.loadAs('downloads', 'dlDay', 'last-day', dlDetail, name)
      req.model.loadAs('downloads', 'dlWeek', 'last-week', dlDetail, name)
      req.model.loadAs('downloads', 'dlMonth', 'last-month', dlDetail, name)
    }

    req.model.end(function (er, m) {
      if (er && er.code === 'E404') return res.error(404, er)
      if (er) return res.error(er)
      if (!m.package) return res.error(404)
      // We are catching this one very late in the application
      // as the npm-client will have cached this response as json
      // and we are not getting a valid http error code in that case
      if (m.package.error === 'not_found') return res.error(404)

      var p = m.package
      p.dependents = m.browse
      var l = p['dist-tags'] && p['dist-tags'].latest &&
        p.versions && p.versions[p['dist-tags'].latest]
      if (l) {
        Object.keys(l).forEach(function (k) {
          p[k] = p[k] || l[k]
        })
      } else if (!version) {
        // no latest version.  this is not valid.  treat as a 404
        res.log.error('Invalid package', req.params.name)
        return res.error(404)
      }

      if (p.time && p.time.unpublished) {
        var locals = {
          package: p,
          profile: profileModel.profile,
          hiring: m.whoshiring,
          title: m.package.name
        }

        return res.template('package-page-unpublished.ejs', locals, 404)
      }

      // should we print the maintainers list?
      p.showMaintainers = p.maintainers && (!p._npmUser || (p.publisherIsInMaintainersList && p.maintainers.length > 1))

      var locals = {
        package: p,
        profile: profileModel.profile,
        hiring: m.whoshiring,
        title: m.package.name,
        dlDetail: dlDetail
      }
      if (dlDetail == 'point') {
        locals.dlDay = commaIt(m.dlDay)
        locals.dlWeek = commaIt(m.dlWeek)
        locals.dlMonth = commaIt(m.dlMonth)
      } else {
        console.warn("downloads out of cache or whatever:")
        console.warn(m.dlMonth)
        locals.dlMonth = m.dlMonth
      }
      res.template("package-page.ejs", locals)
    })
  })

}
