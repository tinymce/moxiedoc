module.exports = function () {

  function convert(data) {
    return data.map(function (page) {
      // page[0] is json
      // page[1] is adoc

      var json = JSON.parse(page[0].content);
      var tmp = page[1];

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
      // borrows
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

      return page;
    })
    

  }

  return {
    convert: convert
  }
}();