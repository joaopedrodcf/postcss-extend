'use strict';

var test = require('tape');
var postcss = require('postcss');
var simpleExtend = require('..');

function checkForWarnings(css, cb) {
  postcss(simpleExtend).process(css).then(function(result) {
    cb(result.warnings(), result);
  }).catch(function(err) {
    console.log(err);
  });
}

test('registers location warning', function(t) {

  t.test('with non-root definition', function(st) {
    var nonrootDefine = '.foo { @define-placeholder bar { background: pink; } }';
    checkForWarnings(nonrootDefine, function(warnings, result) {
      st.equal(warnings.length, 1, 'registers a warning');
      st.ok(/must occur at the root level/.test(warnings[0].text),
        'registers the right warning');
      st.equal(result.css, '.foo { }', 'bad definition is removed');
      st.end();
    });
  });

  t.test('with definition inside media query', function(st) {
    var mediaDefine = (
      '@media (max-width: 700em) { @define-placeholder foo { background: pink; } }'
    );
    checkForWarnings(mediaDefine, function(warnings, result) {
      st.equal(warnings.length, 1, 'registers a warning');
      st.ok(/must occur at the root level/.test(warnings[0].text),
        'registers the right warning');
      st.equal(result.css, '@media (max-width: 700em) { }', 'bad definition is removed');
      st.end();
    });
  });

  t.test('with extension in the root node', function(st) {
    var rootExtend = '@extend bar;';
    checkForWarnings(rootExtend, function(warnings, result) {
      st.equal(warnings.length, 1, 'registers a warning');
      st.ok(/cannot occur at the root level/.test(warnings[0].text),
        'registers the right warning');
      st.equal(result.css, '', 'bad extension is removed');
      st.end();
    });
  });

  t.end();
});

test('register illegal nesting warning', function(t) {

  t.test('with a nested rule', function(st) {
    var defineWithRule = '@define-placeholder foo { .bar { background: pink; } }';
    checkForWarnings(defineWithRule, function(warnings, result) {
      st.equal(warnings.length, 1, 'registers a warning');
      st.ok(/cannot contain statements/.test(warnings[0].text),
        'registers the right warning');
      st.equal(result.css, '', 'bad definition is removed');
      st.end();
    });
  });

  t.test('with a nested media query', function(st) {
    var defineWithMedia = (
      '@define-placeholder foo { @media (max-width: 400px) {' +
      '.bar { background: pink; } } }'
    );
    checkForWarnings(defineWithMedia, function(warnings, result) {
      st.equal(warnings.length, 1, 'registers a warning');
      st.ok(/cannot contain statements/.test(warnings[0].text),
        'registers the right warning');
      st.equal(result.css, '', 'bad definition is removed');
      st.end();
    });
  });

  t.end();
});

test('registers extend-without-definition warning', function(t) {

  t.test('with an undefined placeholder', function(st) {
    var extendUndefined = '.bar { @extend foo; }';
    checkForWarnings(extendUndefined, function(warnings, result) {
      st.equal(warnings.length, 1, 'registers a warning');
      st.ok(/, has not been defined, so cannot be extended/.test(warnings[0].text),
        'registers the right warning');
      st.equal(result.css, '', 'bad extension is removed');
      st.end();
    });
  });

  t.end();
});

test('registers extend-without-target warning', function(t) {

  t.test('with whitespace as the target', function(st) {
    var extendUndefined = '.bar { @extend ; }';
    checkForWarnings(extendUndefined, function(warnings, result) {
      st.equal(warnings.length, 1, 'registers a warning');
      st.ok(/at-rules need a target/.test(warnings[0].text),
        'registers the right warning');
      st.equal(result.css, '', 'bad extension is removed');
      st.end();
    });
  });

  t.end();
});
