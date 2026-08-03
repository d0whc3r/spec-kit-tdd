# Changelog

# [1.1.0](https://github.com/d0whc3r/spec-kit-tdd/compare/v1.0.0...v1.1.0) (2026-08-03)


### Bug Fixes

* **commands:** resolve the feature through spec-kit's own resolver ([a98ad7c](https://github.com/d0whc3r/spec-kit-tdd/commit/a98ad7c5122b7502cc11bc304ee1fc6c4f30ce51))


### Features

* offer the loop before /speckit.implement writes code ([004e07a](https://github.com/d0whc3r/spec-kit-tdd/commit/004e07a29b4a4e516294be4af1d1cc3b93b1d823))

# 1.0.0 (2026-08-03)


### Features

* add TDD extension commands and templates ([98963ef](https://github.com/d0whc3r/spec-kit-tdd/commit/98963ef576c86e4e045b3bac14da2990cec8b65e))
* **web:** add documentation site ([521059d](https://github.com/d0whc3r/spec-kit-tdd/commit/521059d54b6be9b4a2253b0e59bc356e22008923))

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases are cut by
semantic-release from Conventional Commits.

## [Unreleased]

### Added

- Initial extension surface: `/speckit.tdd.setup`, `/speckit.tdd.plan`,
  `/speckit.tdd.run`, and `/speckit.tdd.verify`, with `after_tasks` and
  `after_implement` hooks.
- Shipped references: the loop playbook, the test list and cycle log format, the
  language-agnostic stack profile guide, and the test quality rubric.
