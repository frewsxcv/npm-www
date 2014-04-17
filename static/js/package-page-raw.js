/*
    All the stuff we need on the package-page:
    - stars
    - edits

    *** browserify compiles this into package-page.js ***
*/
var marked = require('marked') // this is why we need browserify

$(document).ready(function () {

  // ======= stars =======
  var packageName = $('.star').data('name'),
      starType = getPackages(packageName)

  if (starType) {
    if (starType === 'star') {
      $('.star').addClass('star-starred')
    } else {
      $('.star').removeClass('star-starred')
    }
  }

  // user clicks on the star
  $('.star').click(function (e) {
    // let's turn this into a checkbox eventually...
    e.preventDefault()
    var packages = getPackages()

    var data = {}
    data.name = $(this).data('name')
    data.isStarred = $(this).hasClass('star-starred')

    $.ajax({
      url: '/star'
    , data: JSON.stringify(data)
    , type: 'POST'
    })
    .done(function (resp) {

      if (data.isStarred) {
        $('.star').removeClass('star-starred')
        document.cookie = data.name + '=nostar' + addExpiration()
      } else {
        $('.star').addClass('star-starred')
        document.cookie = data.name + '=star' + addExpiration()
      }

    })
    .error(function (resp) {
      // we're probably not logged in
      window.location = '/login?done=/package/' + data.name
    })
  })

  // ======= edits =======
  var edit = $('.edit'),
      val, valKey, valText, editBtn

  if (edit) {
    $('.edit-readme').click(function (e) {
      e.stopPropagation()
      cancelMetadata()

      val = $('#readme')
      editBtn = $(this)
      editBtn.detach()
      valKey = 'readme'
      valText = $('.readme-source').text()

      var textarea = '<div class="editing-readme"><textarea class="edit-area" ' +
                     'name="' + valKey + '" rows="50" cols="55">' + valText +
                     '</textarea><button class="ok">ok</button> ' +
                     '<button class="no">no</button></div>'

      val.after(textarea)
      val.hide()
      $('.edit-area').focus()
    })

    $('.editable').dblclick(function (e) {
      e.stopPropagation()
      cancelMetadata()
      valKey = $(this).attr('class').split(' ')[0]
      editBtn = $('.edit[data-key="' + valKey + '"]')
      enableEditing(val, valKey, editBtn)
    })

    $('#package').on('click', '.edit', function (e) {
      e.stopPropagation()
      cancelMetadata()
      editBtn = $(this)
      valKey = $(this).data('key')
      enableEditing(val, valKey, editBtn)
    })

    $('#package').on('click', '.editing, .editing-readme', function (e) {
      e.stopPropagation()
    })

    $('#package').on('keydown', '.edit-area', function (e) {
      if (e.which == 13 && $(this).parent().hasClass('editing')) {
        updateMetadata()
      } else if (e.which == 27) {
        e.preventDefault();
        cancelMetadata()
      }
    })

    $('#package').on('click', '.ok', function (e) {
      e.preventDefault()
      e.stopPropagation()
      updateMetadata()
    })

    $('#package').on('click', '.no', function (e) {
      e.preventDefault()
      e.stopPropagation()
      cancelMetadata()
    })

    $('html').click(function (e) {
      cancelMetadata()
    })

    function enableEditing (key, btn) {
      editBtn.detach()
      val = $('.' + valKey)
      valText = val.text().trim()

      var textarea = '<div class="editing"><textarea class="edit-area" name="' + valKey +
                     '" rows="3" cols="55">' + valText +
                     '</textarea><button class="ok">ok</button> ' +
                     '<button class="no">no</button></div>'

       , input = '<td class="editing"><input class="edit-area" name="' + valKey +
                 '" value="' + valText + '"/> ' +
                 '<button class="ok">ok</button> ' +
                 '<button class="no">no</button></td>'


      val.after(valKey === 'description' ? textarea : input)
      val.hide()
      $('.edit-area').focus()
    }

    function cancelMetadata () {
      $('.editing, .editing-readme').remove()
      if (val) {
        val.append(editBtn)
        val.show()
        val = undefined
      }
    }

    function updateMetadata () {
      var text = $('.edit-area').val(),
          pkgName = $('.star').data('name')

      // send the update over via ajax
      $.ajax({
        url: '/package/' + pkgName
      , data: prepData(valKey, text)
      , type: 'POST'
      })
      .done(function (resp) {
        val.html(formatData(valKey, text))
        $('.editing, .editing-readme').remove()
        val.append(editBtn)
        val.show()
        val = undefined
      })
      .error(function (resp) {
        // we're probably not logged in
        window.location = '/login?done=/package/' + pkgName
      })
    }

  }

})

function prepData (key, text) {
  var data = {}

  switch (key) {
    case 'keywords':
      data.keywords = text.split(/,\s+/)
      break;
    default:
      data[key] = text
      break;
  }

  return JSON.stringify(data)
}

function formatData (key, text) {
  switch (key) {
    case 'keywords':
      var arr = typeof text === 'string' ? text.split(',') : text
      text = arr.map(function (kw) {
        kw = kw.replace(/</g, '&lt;').replace(/"/g, '&quot;')
        return '<a href="/browse/keyword/' + kw + '">' + kw + '</a>'
      }).join(', ')
      break;
    case 'repository':
      var gh = text.match(/^(?:https?:\/\/|git(?::\/\/|@))(gist.github.com|github.com)[:\/](.*?)(?:.git)?$/)
      if (gh) {
        gh = 'https://' + gh[1] + '/' + gh[2]
        text = '<a href="' + gh + '">' + text + '</a>'
      }
    case 'homepage':
      text = '<a href="' + encodeURI(text) + '">' + text.replace(/</g, '&lt;') + '</a>'
      break;
    case 'bugs':
      text = '<a href="' + text + '">' + text + '</a>'
      break;
    case 'readme':
      text = marked.parse(text)
    default:
      break;
  }
  return text
}

function addExpiration () {
  var NUM_SECONDS = 60
  var d = new Date()
  d.setTime(d.getTime() + NUM_SECONDS*1000)
  return '; expires='+d.toGMTString()
}

function getPackages (name) {
  var packages = document.cookie.split(";")
                  .map(function(k) {
                    return k.trim().split("=")
                  })
                  .reduce(function (set, kv) {
                    set[kv.shift()] = kv.join("=");
                    return set
                  },{})

  return name ? packages[name] : packages
}
