# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.3.0 - 2022-07-12

### Added
- New `structure` option for specifying `legacy` nested structure for antora docs, or `default` file structure.

## 0.2.1 - 2022-04-29

### Fixed
- The `antora` template used the incorrect data for page introductions.

## 0.2.0 - 2022-04-05

### Added
- New `antora` template for generating AsciiDoc API documentation for use in Antora.

## 0.1.0 - 2021-10-12

### Improved
- The CLI will now return a non-zero exit code if an error occurs. Warnings can also be configured to fail via the `--fail-on-warnings` option.
