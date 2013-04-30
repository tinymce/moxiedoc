moxiedoc
========

{
	"namespace.Class": {
		"type": "class|enum|struct|mixin|interface",
		"members": [
			{
				"type": "method|field|property|event|constant|callback",
				"static": true,
				"abstract": true,
				"name": "doStuff",
				"access": "private|protected|internal|public,
				"extends": "namespace.Class",
				"implements": ["namespace.Interface"],
				"deprecated": "Text about deprecation",
				"description": "Do stuff",
				"mixes": ["namespace.Class1", "namespace.Class2"],
				"examples": [
					{text: "Some example"},
					{caption: "Some example", text: "Some example"}
				],
				"params": [
					{"name": "mystuff", type": "string", "description": "My stuff"}
				],
				"returns": {
					{type: "string", "description": "Returns string."}
				}
			}
		]
	}
}