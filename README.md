# moxiedoc

## Introduction

This project maintains Moxiedoc, a tool used to build API reference documentation. If you have any modifications you wish to contribute, fork this project, make the changes and submit a pull request. You will need to sign the contributors license agreement, which will be emailed to you upon creating the pull request.

## Using Moxiedoc

To create API reference documentation from a development version of moxiedoc, run:

```
yarn build
node ./dist/lib/cli.js PATH/TO/API_FILE_FOLDER
```

## Moxiedoc Options

Moxiedoc provides the following options to customise the format of the output documentation:

```
-o --out <path>: location of output files, default: 'tmp/out.zip'
-t --template <template>: documentation type: default: 'cli'; 'antora', 'github', 'moxiewiki', 'singlehtml', 'tinymcenext', 'xml'
-s --structure <type>: default: 'default'; 'legacy'
-v --verbose: verbose output
--debug: debug output
--dry: dry run only syntax check
--fail-on-warning: fail if warnings are produced
```

## Schema

The output JSON takes the form of the following schema:

```json
{
  "namespace.Class": {
    "type": "class|enum|struct|mixin|interface",
    "members": [
      {
        "type": "method|field|property|event|constant|callback",
        "static": true,
        "abstract": true,
        "name": "doStuff",
        "access": "private|protected|internal|public",
        "extends": "namespace.Class",
        "implements": ["namespace.Interface"],
        "deprecated": "Text about deprecation",
        "description": "Do stuff",
        "mixes": ["namespace.Class1", "namespace.Class2"],
        "examples": [
          {"text": "Some example"},
          {"caption": "Some example", "text": "Some example"}
        ],
        "params": [
          {"name": "mystuff", "type": "string", "description": "My stuff"}
        ],
        "returns": {
          {"type": "string", "description": "Returns string."}
        }
      }
    ]
  }
}
```
