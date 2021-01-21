
/**
 * Constructs a new Writer instance.
 *
 * @constructor
 * @method Writer
 * @param {Object} settings Name/value settings object.
 */
function XmlWriter(settings) {
	var html = [], htmlOutput;

	settings = settings || {};
	htmlOutput = settings.element_format == 'html';

	function encode(text) {
		return (text || '').replace(/[&<>"]/g, function(match) {
			return '&#' + match.charCodeAt(0) + ';';
		});
	}

	return {
		/**
		 * Writes the a start element such as <p id="a">.
		 *
		 * @method start
		 * @param {String} name Name of the element.
		 * @param {Array} attrs Optional attribute array or undefined if it hasn't any.
		 * @param {Boolean} empty Optional empty state if the tag should end like <br />.
		 */
		start: function(name, attrs, empty) {
			var i, l, attr;

			html.push('<', name);

			if (attrs && attrs.length) {
				for (i = 0, l = attrs.length; i < l; i++) {
					attr = attrs[i];
					html.push(' ', attr.name, '="', encode(attr.value, true), '"');
				}
			} else if (attrs) {
				for (var attrName in attrs) {
					html.push(' ', attrName, '="', encode(attrs[attrName], true), '"');
				}
			}

			if (!empty || htmlOutput) {
				html[html.length] = '>';
			} else {
				html[html.length] = ' />';
			}
		},

		/**
		 * Writes the a end element such as </p>.
		 *
		 * @method end
		 * @param {String} name Name of the element.
		 */
		end: function(name) {
			html.push('</', name, '>');
		},

		/**
		 * Writes a text node.
		 *
		 * @method text
		 * @param {String} text String to write out.
		 * @param {Boolean} raw Optional raw state if true the contents wont get encoded.
		 */
		text: function(text, raw) {
			if (text.length > 0) {
				html[html.length] = raw ? text : encode(text);
			}
		},

		/**
		 * Writes a cdata node such as <![CDATA[data]]>.
		 *
		 * @method cdata
		 * @param {String} text String to write out inside the cdata.
		 */
		cdata: function(text) {
			html.push('<![CDATA[', text, ']]>');
		},

		/**
		 * Writes a comment node such as <!-- Comment -->.
		 *
		 * @method cdata
		 * @param {String} text String to write out inside the comment.
		 */
		comment: function(text) {
			html.push('<!--', text, '-->');
		},

		/**
		 * Writes a PI node such as <?xml attr="value" ?>.
		 *
		 * @method pi
		 * @param {String} name Name of the pi.
		 * @param {String} text String to write out inside the pi.
		 */
		pi: function(name, text) {
			if (text) {
				html.push('<?', name, ' ', text, '?>');
			} else {
				html.push('<?', name, '?>');
			}
		},

		/**
		 * Returns the contents that got serialized.
		 *
		 * @method getContent
		 * @return {String} HTML contents that got written down.
		 */
		getContent: function() {
			return html.join('').replace(/\n$/, '');
		}
	};
}

exports.XmlWriter = XmlWriter;
