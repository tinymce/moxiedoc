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
      // untested snipped, no class extends data
      if (hasValue(data.borrows)) {
        tmp += '<a class="anchor" id="extends"></a>' + '\n'
        tmp += '<h2><a class="anchorable" href="#extends">Extends</a></h2>' + '\n'

        data.borrows.forEach(item => {
          tmp += '<a href="' + baseurl + '/api/' + item + '">' + item + '</a>' + '\n'
        });
      }

      // examples
      if (hasValue(data.examples)) {
        tmp += '<h2>Examples</h2>' + '\n';
        data.examples.forEach(example => {
          tmp += '<pre class="prettyprint"><code class="js" data-lang="js">' + example.content + '</code></pre>';
        });
      }


      // settings
      // untested snippet, no settings data
      if (hasValue(data.settings)) {
        tmp += '<a class="anchor" id="settings"></a>';
        tmp += '<h2><a class="anchorable" href="#settings">Settings</a></h2>';
        tmp += '<table class="settings">';
        tmp += '<thead>';
        tmp += '<tr>';
        tmp += '<th>name</th>';
        tmp += '<th>type</th>';
        tmp += '<th>summary</th>';
        tmp += '<th class="defined-by">defined by</th>';
        tmp += '</tr>';
        tmp += '</thead>';
        tmp += '<tbody>';

        data.settings.forEach(item => {
          tmp += '<tr>';
          tmp += '<td>' + item.name + '</td>';
          tmp += '<td>';

          if (item.dataTypes[0].includes('tinymce', 0)) {
            tmp += '<a href="' + baseurl + '/apis/' + item.dataTypes[0] + '"><span class="param-type">' + item.dataTypes[0] + '</span></a>';
          } else {
            tmp += '<span class="param-type">' + item.dataTypes[0] + '</span>';    
          }

          tmp += '</td>';
          tmp += '<td>' + item.desc + '</td>';
          tmp += '<td class="defined-by">';
          tmp += '<a href="' + baseurl + '/apis/' + item.definedBy + '">' + item.definedBy + '</a>';
          tmp += '</td>';
          tmp += '</tr>';
        })

        tmp += '</tbody>';
        tmp += '</table>';
      }

      // properties
      if (hasValue(data.properties)) {
        tmp += '<a class="anchor" id="properties"></a>';
        tmp += '<h2><a class="anchorable" href="#properties">Properties</a></h2>';

        tmp += '<table class="properties">';
        tmp += '<thead>';
        tmp += '<tr>';
        tmp += '<th>name</th>';
        tmp += '<th>type</th>';
        tmp += '<th>summary</th>';
        tmp += '<th class="defined-by">defined by</th>';
        tmp += '</tr>';
        tmp += '</thead>';
        tmp += '<tbody>';
        data.properties.forEach(item => {
          tmp += '<tr>';
          tmp += '<td>{{ item.name }}</td>';
          tmp += '<td>';
          
          if (item.dataTypes[0].includes('tinymce', 0)) {
            tmp += '<a href="' + baseurl + '/apis/' + item.dataTypes[0] + '"><span class="param-type">' + item.dataTypes[0] + '</span></a>';
          } else {
            tmp += '<span class="param-type">' + item.dataTypes[0] + '</span>';
          }
        
          tmp += '</td>';
          tmp += '<td>' + item.desc + '</td>';
          tmp += '<td class="defined-by">';
          tmp += '<a href="' + baseurl + '/apis/' + item.definedBy + '">' + item.definedBy + '</a>';
          tmp += '</td>';
          tmp += '</tr>';
        })
        tmp += '</tbody>';
        tmp += '</table>';
      }

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