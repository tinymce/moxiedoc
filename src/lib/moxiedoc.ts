import * as fs from 'fs';
import * as matcher from 'matcher';
import * as path from 'path';

import { Builder } from './builder';
import { Exporter } from './exporter';
import * as Reporter from './reporter';

exports.Builder = Builder;
exports.Exporter = Exporter;

export interface MoxiedocSettings {
  out?: string;
  template?: string;
  verbose?: boolean;
  debug?: boolean;
  paths: string[];
  dry?: boolean;
  failOnWarning?: boolean;
}

export interface MoxiedocResult {
  readonly errors: number;
  readonly warnings: number;
}

/**
 * Process the specified files and generate documentation.
 *
 * @method process
 * @example
 * moxiedoc.process({
 *     template: 'cli',
 *     verbose: true,
 *     debug: false,
 *     paths: [
 *         'js/classes'
 *     ],
 *     out: 'output'
 * });
 * @param  {[type]} settings [description]
 * @return {[type]}          [description]
 */
const process = (settings: MoxiedocSettings): MoxiedocResult => {
  settings.out = settings.out || 'tmp/out.zip';
  settings.template = settings.template || 'cli';

  if (settings.verbose) {
    Reporter.setLevel(Reporter.Level.INFO);
  }

  if (settings.debug) {
    Reporter.setLevel(Reporter.Level.DEBUG);
  }

  const result = { errors: 0, warnings: 0 };
  const builder = new Builder();

  // Setup a hook to listen for errors/warnings
  Reporter.addHook((level) => {
    if (level === Reporter.Level.ERROR) {
      result.errors++;
    } else if (level === Reporter.Level.WARN) {
      result.warnings++;
    }
  });

  const listFiles = (dirPath: string, patterns: string[]) => {
    let output: string[] = [];

    const matches = (filePath: string) => {
      return patterns.filter((pattern: string) => matcher.isMatch(path.basename(filePath), pattern)).length > 0;
    };

    fs.readdirSync(dirPath).forEach((filePath: string) => {
      filePath = path.join(dirPath, filePath);

      if (fs.statSync(filePath).isDirectory()) {
        output = output.concat(listFiles(filePath, patterns));
      } else if (matches(filePath)) {
        output.push(filePath);
      }
    });

    return output;
  };

  settings.paths.forEach((filePath: string) => {
    if (fs.statSync(filePath).isDirectory()) {
      listFiles(filePath, [ '*.js', '*.ts' ]).forEach((dirFilePath) => {
        builder.parser.parseFile(dirFilePath);
      });
    } else {
      builder.parser.parseFile(filePath);
    }
  });

  builder.api.removePrivates();

  if (!settings.dry) {
    const exporter = new Exporter({
      template: settings.template
    });

    exporter.exportTo(builder.api, settings.out);
  }

  return result;
};

export {
  process
};