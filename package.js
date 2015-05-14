Package.describe({
  name: 'nucleuside:eventsync',
  version: '0.1.0',
  summary: 'Sync events across meteor apps',
  git: 'https://github.com/nucleuside/meteor-eventsync',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom("METEOR@0.9.1");

  api.use(['jquery', 'deps', 'underscore', 'session', 'mongo',
           'reactive-var',
           'mrt:moment@2.8.1',
           'nucleuside:smart-models@0.0.6',]);

  api.addFiles(
    'both/nucleus_event_model.js',
    ['client', 'server']);

  api.addFiles([
    'server/permissions.js',
    'server/publisher.js'
  ], 'server');

  api.addFiles([
    'global_overrides.js',
    'client/subscriptions.js',
    'client/event_manager.js',
    'client/utils.js',
    'client/nucleus_file_changes.js',
    'client/clicks.js',
    'client/scroll.js',
    'client/forms.js',
    'client/form_inputs.js',
    'client/form_toggles.js',
    'client/form_submit.js',
    'client/location.js',
    'client/login.js',
  ], 'client');

  api.export(['EventSync'], ['client']);
});

Package.onTest(function(api) {});
