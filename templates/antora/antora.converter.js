const { passThroughOptions } = require("commander");

module.exports = function () {

  // Todo we can pass this through later
  var baseurl = '';

  function hasValue (x) {
    // empty helper for strings, objects, arrays
    if (typeof(x) === 'string' || typeof(x) === 'array') {
      return x.length > 0
    } else if (typeof(x) === 'object') {
      return Object.keys(x).length > 0
    } else {
      return false;
    }
  };


  function convert(memberData) {
    return memberData.map(function (page) {
      // page[0] is json
      // page[1] is adoc

      var data = JSON.parse(page[0].content);
      var tmp = page[1].content;

      // data.datapath = data.type + '_' + data.fullName.replace(/\./g, '_').toLowerCase();
      // data.desc = data.desc.replace(/\n/g, ' ');
    
      // data.constructors = []
      // data.methods = []
      // data.properties = []
      // data.settings = []
      // data.events = []
      // data.keywords = []
      // data.borrows = data.borrows || []
      // data.examples = data.examples || []


      // summary
      if (hasValue(data.summary)) {
        tmp += '<p>' + data.summary + '</p>' + '\n'
      }

      // borrows
      if (hasValue(data.borrows)) {
        // has not been tested (no borrows/extends data)
        tmp += '<a class="anchor" id="extends"></a>' + '\n'
        tmp += '<h2><a class="anchorable" href="#extends">Extends</a></h2>' + '\n'

        data.borrows.forEach(item => {
          tmp += '<a href="' + baseurl + '/api/' + item + '">' + item + '</a>' + '\n'
        });
      }




      // examples
      // settings
      // properties
      // constructors
      // methods
      // events
      // constructors 2
      // methods 2
      // events 2





      // console.log('****************', page[0].content);

      page[0].content = JSON.stringify(data);
      page[1].content = tmp

      return page;
    })
    

  }

  return {
    convert: convert
  }
}();