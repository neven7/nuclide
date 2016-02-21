var createRemoteConnection = _asyncToGenerator(function* (remoteProjectConfig) {
  var host = remoteProjectConfig.host;
  var cwd = remoteProjectConfig.cwd;

  var connection = _remoteConnection.RemoteConnection.getByHostnameAndPath(host, cwd);
  if (connection != null) {
    return connection;
  }

  connection = yield _remoteConnection.RemoteConnection.createConnectionBySavedConfig(host, cwd);
  if (connection != null) {
    return connection;
  }

  // If connection fails using saved config, open connect dialog.

  var _require = require('../../ssh-dialog');

  var openConnectionDialog = _require.openConnectionDialog;

  return openConnectionDialog({
    initialServer: remoteProjectConfig.host,
    initialCwd: remoteProjectConfig.cwd
  });
});

/**
 * The same TextEditor must be returned to prevent Atom from creating multiple tabs
 * for the same file, because Atom doesn't cache pending opener promises.
 */

var createEditorForNuclide = _asyncToGenerator(function* (connection, uri) {
  try {
    var buffer = yield (0, _atomHelpers.loadBufferForUri)(uri);
    return (0, _atomHelpers.createTextEditor)({ buffer: buffer });
  } catch (err) {
    logger.warn('buffer load issue:', err);
    atom.notifications.addError('Failed to open ' + uri + ': ' + err.message);
    throw err;
  }
}

/**
 * Check if the remote buffer has already been initialized in editor.
 * This checks if the buffer is instance of NuclideTextBuffer.
 */
);

var reloadRemoteProjects = _asyncToGenerator(function* (remoteProjects) {
  // This is intentionally serial.
  // The 90% use case is to have multiple remote projects for a single connection;
  // after the first one succeeds the rest should require no user action.
  for (var config of remoteProjects) {
    /* eslint-disable babel/no-await-in-loop */
    var connection = yield createRemoteConnection(config);
    if (!connection) {
      logger.info('No RemoteConnection returned on restore state trial:', config.host, config.cwd);
    } else {
      // It's fine the user connected to a different project on the same host:
      // we should still be able to restore this using the new connection.
      var _cwd = config.cwd;
      var _host = config.host;

      if (connection.getPathForInitialWorkingDirectory() !== _cwd && connection.getRemoteHostname() === _host) {
        yield _remoteConnection.RemoteConnection.createConnectionBySavedConfig(_host, _cwd);
      }
    }
    /* eslint-enable babel/no-await-in-loop */
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _atomHelpers = require('../../atom-helpers');

var _logging = require('../../logging');

var _utils = require('./utils');

var _featureConfig = require('../../feature-config');

var _featureConfig2 = _interopRequireDefault(_featureConfig);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _atom = require('atom');

var _remoteConnection = require('../../remote-connection');

var logger = (0, _logging.getLogger)();

/**
 * Stores the host and cwd of a remote connection.
 */

var packageSubscriptions = null;
var controller = null;

var CLOSE_PROJECT_DELAY_MS = 100;
var pendingFiles = {};

function createSerializableRemoteConnectionConfiguration(config) {
  return {
    host: config.host,
    cwd: config.cwd
  };
}

function addRemoteFolderToProject(connection) {
  var workingDirectoryUri = connection.getUriForInitialWorkingDirectory();
  // If restoring state, then the project already exists with local directory and wrong repo
  // instances. Hence, we remove it here, if existing, and add the new path for which we added a
  // workspace opener handler.
  atom.project.removePath(workingDirectoryUri);

  atom.project.addPath(workingDirectoryUri);

  var subscription = atom.project.onDidChangePaths(function () {
    // Delay closing the underlying socket connection until registered subscriptions have closed.
    // We should never depend on the order of registration of the `onDidChangePaths` event,
    // which also dispose consumed service's resources.
    setTimeout(checkClosedProject, CLOSE_PROJECT_DELAY_MS);
  });

  function checkClosedProject() {
    // The project paths may have changed during the delay time.
    // Hence, the latest project paths are fetched here.
    var paths = atom.project.getPaths();
    if (paths.indexOf(workingDirectoryUri) !== -1) {
      return;
    }
    // The project was removed from the tree.
    subscription.dispose();

    closeOpenFilesForRemoteProject(connection.getConfig());

    var hostname = connection.getRemoteHostname();
    if (_remoteConnection.RemoteConnection.getByHostname(hostname).length > 1) {
      logger.info('Remaining remote projects using Nuclide Server - no prompt to shutdown');
      connection.close();
      return;
    }

    var buttons = ['Keep It', 'Shutdown'];
    var buttonToActions = new Map();

    buttonToActions.set(buttons[0], function () {
      return connection.close();
    });
    buttonToActions.set(buttons[1], _asyncToGenerator(function* () {
      yield connection.getService('InfoService').shutdownServer();
      connection.close();
      return;
    }));

    if (_featureConfig2['default'].get('nuclide-remote-projects.shutdownServerAfterDisconnection')) {
      // Atom takes the first button in the list as default option.
      buttons.reverse();
    }

    var choice = global.atom.confirm({
      message: 'No more remote projects on the host: \'' + hostname + '\'. Would you like to shutdown Nuclide server there?',
      buttons: buttons
    });

    var action = buttonToActions.get(buttons[choice]);
    (0, _assert2['default'])(action);
    action();
  }
}

function closeOpenFilesForRemoteProject(remoteProjectConfig) {
  var openInstances = (0, _utils.getOpenFileEditorForRemoteProject)(remoteProjectConfig);
  for (var openInstance of openInstances) {
    var editor = openInstance.editor;
    var pane = openInstance.pane;

    pane.removeItem(editor);
    editor.destroy();
  }
}

function getRemoteRootDirectories() {
  // TODO: Use nuclide-remote-uri instead.
  return atom.project.getDirectories().filter(function (directory) {
    return directory.getPath().startsWith('nuclide:');
  });
}

/**
 * Removes any Directory (not RemoteDirectory) objects that have Nuclide
 * remote URIs.
 */
function deleteDummyRemoteRootDirectories() {
  var _require2 = require('../../remote-connection');

  var RemoteDirectory = _require2.RemoteDirectory;

  var _require3 = require('../../remote-uri');

  var isRemote = _require3.isRemote;

  for (var directory of atom.project.getDirectories()) {
    if (isRemote(directory.getPath()) && !RemoteDirectory.isRemoteDirectory(directory)) {
      atom.project.removePath(directory.getPath());
    }
  }
}function isRemoteBufferInitialized(editor) {
  var buffer = editor.getBuffer();
  // $FlowIssue: https://github.com/facebook/flow/issues/1375
  if (buffer && buffer.constructor.name === 'NuclideTextBuffer') {
    return true;
  }
  return false;
}

module.exports = {
  activate: function activate(state) {
    var subscriptions = new _atom.CompositeDisposable();

    var RemoteProjectsController = require('./RemoteProjectsController');
    controller = new RemoteProjectsController();

    subscriptions.add(_remoteConnection.RemoteConnection.onDidAddRemoteConnection(function (connection) {
      addRemoteFolderToProject(connection);

      // On Atom restart, it tries to open uri paths as local `TextEditor` pane items.
      // Here, Nuclide reloads the remote project files that have empty text editors open.
      var config = connection.getConfig();
      var openInstances = (0, _utils.getOpenFileEditorForRemoteProject)(config);

      var _loop = function (openInstance) {
        // Keep the original open editor item with a unique name until the remote buffer is loaded,
        // Then, we are ready to replace it with the remote tab in the same pane.
        var pane = openInstance.pane;
        var editor = openInstance.editor;
        var uri = openInstance.uri;
        var filePath = openInstance.filePath;

        // Skip restoring the editer who has remote content loaded.
        if (isRemoteBufferInitialized(editor)) {
          return 'continue';
        }

        // Here, a unique uri is picked to the pending open pane item to maintain the pane layout.
        // Otherwise, the open won't be completed because there exists a pane item with the same
        // uri.
        /* $FlowFixMe */
        editor.getBuffer().file.path = uri + '.to-close';
        // Cleanup the old pane item on successful opening or when no connection could be
        // established.
        var cleanupBuffer = function cleanupBuffer() {
          pane.removeItem(editor);
          editor.destroy();
        };
        if (filePath === config.cwd) {
          cleanupBuffer();
        } else {
          // If we clean up the buffer before the `openUriInPane` finishes,
          // the pane will be closed, because it could have no other items.
          // So we must clean up after.
          atom.workspace.openURIInPane(uri, pane).then(cleanupBuffer, cleanupBuffer);
        }
      };

      for (var openInstance of openInstances) {
        var _ret = _loop(openInstance);

        if (_ret === 'continue') continue;
      }
    }));

    subscriptions.add(atom.commands.add('atom-workspace', 'nuclide-remote-projects:connect', function () {
      return require('../../ssh-dialog').openConnectionDialog();
    }));

    // Subscribe opener before restoring the remote projects.
    subscriptions.add(atom.workspace.addOpener(function () {
      var uri = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      if (uri.startsWith('nuclide:')) {
        var connection = _remoteConnection.RemoteConnection.getForUri(uri);
        // On Atom restart, it tries to open the uri path as a file tab because it's not a local
        // directory. We can't let that create a file with the initial working directory path.
        if (connection && uri !== connection.getUriForInitialWorkingDirectory()) {
          if (pendingFiles[uri]) {
            return pendingFiles[uri];
          }
          var textEditorPromise = pendingFiles[uri] = createEditorForNuclide(connection, uri);
          var removeFromCache = function removeFromCache() {
            return delete pendingFiles[uri];
          };
          textEditorPromise.then(removeFromCache, removeFromCache);
          return textEditorPromise;
        }
      }
    }));

    // If RemoteDirectoryProvider is called before this, and it failed
    // to provide a RemoteDirectory for a
    // given URI, Atom will create a generic Directory to wrap that. We want
    // to delete these instead, because those directories aren't valid/useful
    // if they are not true RemoteDirectory objects (connected to a real
    // real remote folder).
    deleteDummyRemoteRootDirectories();

    // Attempt to reload previously open projects.
    var remoteProjectsConfig = state && state.remoteProjectsConfig;
    if (remoteProjectsConfig != null) {
      reloadRemoteProjects(remoteProjectsConfig);
    }
    packageSubscriptions = subscriptions;
  },

  consumeStatusBar: function consumeStatusBar(statusBar) {
    if (controller) {
      controller.consumeStatusBar(statusBar);
    }
  },

  // TODO: All of the elements of the array are non-null, but it does not seem possible to convince
  // Flow of that.
  serialize: function serialize() {
    var remoteProjectsConfig = getRemoteRootDirectories().map(function (directory) {
      var connection = _remoteConnection.RemoteConnection.getForUri(directory.getPath());
      return connection ? createSerializableRemoteConnectionConfiguration(connection.getConfig()) : null;
    }).filter(function (config) {
      return config != null;
    });
    return {
      remoteProjectsConfig: remoteProjectsConfig
    };
  },

  deactivate: function deactivate() {
    if (packageSubscriptions) {
      packageSubscriptions.dispose();
      packageSubscriptions = null;
    }

    if (controller != null) {
      controller.destroy();
      controller = null;
    }
  },

  createRemoteDirectoryProvider: function createRemoteDirectoryProvider() {
    var RemoteDirectoryProvider = require('./RemoteDirectoryProvider');
    return new RemoteDirectoryProvider();
  },

  createRemoteDirectorySearcher: function createRemoteDirectorySearcher() {
    var _require4 = require('../../client');

    var getServiceByNuclideUri = _require4.getServiceByNuclideUri;

    var _require5 = require('../../remote-connection');

    var RemoteDirectory = _require5.RemoteDirectory;

    var RemoteDirectorySearcher = require('./RemoteDirectorySearcher');
    return new RemoteDirectorySearcher(function (dir) {
      var service = getServiceByNuclideUri('FindInProjectService', dir.getPath());
      (0, _assert2['default'])(service);
      return service;
    });
  },

  getHomeFragments: function getHomeFragments() {
    return {
      feature: {
        title: 'Remote Connection',
        icon: 'cloud-upload',
        description: 'Connect to a remote server to edit files.',
        command: 'nuclide-remote-projects:connect'
      },
      priority: 8
    };
  }

};
//# sourceMappingURL=data:application/json;base64,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QUM7QUFDckUsV0FBTyxJQUFJLHVCQUF1QixDQUFDLFVBQUMsR0FBRyxFQUFzQjtBQUMzRCxVQUFNLE9BQU8sR0FBRyxzQkFBc0IsQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztBQUM5RSwrQkFBVSxPQUFPLENBQUMsQ0FBQztBQUNuQixhQUFRLE9BQU8sQ0FBd0I7S0FDeEMsQ0FBQyxDQUFDO0dBQ0o7O0FBRUQsa0JBQWdCLEVBQUEsNEJBQWtCO0FBQ2hDLFdBQU87QUFDTCxhQUFPLEVBQUU7QUFDUCxhQUFLLEVBQUUsbUJBQW1CO0FBQzFCLFlBQUksRUFBRSxjQUFjO0FBQ3BCLG1CQUFXLEVBQUUsMkNBQTJDO0FBQ3hELGVBQU8sRUFBRSxpQ0FBaUM7T0FDM0M7QUFDRCxjQUFRLEVBQUUsQ0FBQztLQUNaLENBQUM7R0FDSDs7Q0FFRixDQUFDIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7SG9tZUZyYWdtZW50c30gZnJvbSAnLi4vLi4vaG9tZS1pbnRlcmZhY2VzJztcbmltcG9ydCB0eXBlIHtcbiAgUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24sXG59IGZyb20gJy4uLy4uL3JlbW90ZS1jb25uZWN0aW9uL2xpYi9SZW1vdGVDb25uZWN0aW9uJztcbmltcG9ydCB0eXBlIHtOdWNsaWRlVXJpfSBmcm9tICcuLi8uLi9yZW1vdGUtdXJpJztcbmltcG9ydCB0eXBlIFJlbW90ZURpcmVjdG9yeVByb3ZpZGVyVCBmcm9tICcuL1JlbW90ZURpcmVjdG9yeVByb3ZpZGVyJztcbmltcG9ydCB0eXBlIFJlbW90ZURpcmVjdG9yeVNlYXJjaGVyVCBmcm9tICcuL1JlbW90ZURpcmVjdG9yeVNlYXJjaGVyJztcbmltcG9ydCB0eXBlIFJlbW90ZVByb2plY3RzQ29udHJvbGxlclQgZnJvbSAnLi9SZW1vdGVQcm9qZWN0c0NvbnRyb2xsZXInO1xuaW1wb3J0IHR5cGVvZiAqIGFzIEZpbmRJblByb2plY3RTZXJ2aWNlIGZyb20gJy4uLy4uL3JlbW90ZS1zZWFyY2gnO1xuXG5pbXBvcnQge2NyZWF0ZVRleHRFZGl0b3IsIGxvYWRCdWZmZXJGb3JVcml9IGZyb20gJy4uLy4uL2F0b20taGVscGVycyc7XG5pbXBvcnQge2dldExvZ2dlcn0gZnJvbSAnLi4vLi4vbG9nZ2luZyc7XG5pbXBvcnQge2dldE9wZW5GaWxlRWRpdG9yRm9yUmVtb3RlUHJvamVjdH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgZmVhdHVyZUNvbmZpZyBmcm9tICcuLi8uLi9mZWF0dXJlLWNvbmZpZyc7XG5pbXBvcnQgaW52YXJpYW50IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gJ2F0b20nO1xuaW1wb3J0IHtSZW1vdGVDb25uZWN0aW9ufSBmcm9tICcuLi8uLi9yZW1vdGUtY29ubmVjdGlvbic7XG5cbmNvbnN0IGxvZ2dlciA9IGdldExvZ2dlcigpO1xuXG4vKipcbiAqIFN0b3JlcyB0aGUgaG9zdCBhbmQgY3dkIG9mIGEgcmVtb3RlIGNvbm5lY3Rpb24uXG4gKi9cbnR5cGUgU2VyaWFsaXphYmxlUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24gPSB7XG4gIGhvc3Q6IHN0cmluZztcbiAgY3dkOiBzdHJpbmc7XG59XG5cbmxldCBwYWNrYWdlU3Vic2NyaXB0aW9uczogP0NvbXBvc2l0ZURpc3Bvc2FibGUgPSBudWxsO1xubGV0IGNvbnRyb2xsZXI6ID9SZW1vdGVQcm9qZWN0c0NvbnRyb2xsZXJUID0gbnVsbDtcblxuY29uc3QgQ0xPU0VfUFJPSkVDVF9ERUxBWV9NUyA9IDEwMDtcbmNvbnN0IHBlbmRpbmdGaWxlcyA9IHt9O1xuXG5mdW5jdGlvbiBjcmVhdGVTZXJpYWxpemFibGVSZW1vdGVDb25uZWN0aW9uQ29uZmlndXJhdGlvbihcbiAgY29uZmlnOiBSZW1vdGVDb25uZWN0aW9uQ29uZmlndXJhdGlvbixcbik6IFNlcmlhbGl6YWJsZVJlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9uIHtcbiAgcmV0dXJuIHtcbiAgICBob3N0OiBjb25maWcuaG9zdCxcbiAgICBjd2Q6IGNvbmZpZy5jd2QsXG4gIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVJlbW90ZUNvbm5lY3Rpb24oXG4gIHJlbW90ZVByb2plY3RDb25maWc6IFNlcmlhbGl6YWJsZVJlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9uLFxuKTogUHJvbWlzZTw/UmVtb3RlQ29ubmVjdGlvbj4ge1xuICBjb25zdCB7aG9zdCwgY3dkfSA9IHJlbW90ZVByb2plY3RDb25maWc7XG4gIGxldCBjb25uZWN0aW9uID0gUmVtb3RlQ29ubmVjdGlvbi5nZXRCeUhvc3RuYW1lQW5kUGF0aChob3N0LCBjd2QpO1xuICBpZiAoY29ubmVjdGlvbiAhPSBudWxsKSB7XG4gICAgcmV0dXJuIGNvbm5lY3Rpb247XG4gIH1cblxuICBjb25uZWN0aW9uID0gYXdhaXQgUmVtb3RlQ29ubmVjdGlvbi5jcmVhdGVDb25uZWN0aW9uQnlTYXZlZENvbmZpZyhob3N0LCBjd2QpO1xuICBpZiAoY29ubmVjdGlvbiAhPSBudWxsKSB7XG4gICAgcmV0dXJuIGNvbm5lY3Rpb247XG4gIH1cblxuICAvLyBJZiBjb25uZWN0aW9uIGZhaWxzIHVzaW5nIHNhdmVkIGNvbmZpZywgb3BlbiBjb25uZWN0IGRpYWxvZy5cbiAgY29uc3Qge29wZW5Db25uZWN0aW9uRGlhbG9nfSA9IHJlcXVpcmUoJy4uLy4uL3NzaC1kaWFsb2cnKTtcbiAgcmV0dXJuIG9wZW5Db25uZWN0aW9uRGlhbG9nKHtcbiAgICBpbml0aWFsU2VydmVyOiByZW1vdGVQcm9qZWN0Q29uZmlnLmhvc3QsXG4gICAgaW5pdGlhbEN3ZDogcmVtb3RlUHJvamVjdENvbmZpZy5jd2QsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBhZGRSZW1vdGVGb2xkZXJUb1Byb2plY3QoY29ubmVjdGlvbjogUmVtb3RlQ29ubmVjdGlvbikge1xuICBjb25zdCB3b3JraW5nRGlyZWN0b3J5VXJpID0gY29ubmVjdGlvbi5nZXRVcmlGb3JJbml0aWFsV29ya2luZ0RpcmVjdG9yeSgpO1xuICAvLyBJZiByZXN0b3Jpbmcgc3RhdGUsIHRoZW4gdGhlIHByb2plY3QgYWxyZWFkeSBleGlzdHMgd2l0aCBsb2NhbCBkaXJlY3RvcnkgYW5kIHdyb25nIHJlcG9cbiAgLy8gaW5zdGFuY2VzLiBIZW5jZSwgd2UgcmVtb3ZlIGl0IGhlcmUsIGlmIGV4aXN0aW5nLCBhbmQgYWRkIHRoZSBuZXcgcGF0aCBmb3Igd2hpY2ggd2UgYWRkZWQgYVxuICAvLyB3b3Jrc3BhY2Ugb3BlbmVyIGhhbmRsZXIuXG4gIGF0b20ucHJvamVjdC5yZW1vdmVQYXRoKHdvcmtpbmdEaXJlY3RvcnlVcmkpO1xuXG4gIGF0b20ucHJvamVjdC5hZGRQYXRoKHdvcmtpbmdEaXJlY3RvcnlVcmkpO1xuXG4gIGNvbnN0IHN1YnNjcmlwdGlvbiA9IGF0b20ucHJvamVjdC5vbkRpZENoYW5nZVBhdGhzKCgpID0+IHtcbiAgICAvLyBEZWxheSBjbG9zaW5nIHRoZSB1bmRlcmx5aW5nIHNvY2tldCBjb25uZWN0aW9uIHVudGlsIHJlZ2lzdGVyZWQgc3Vic2NyaXB0aW9ucyBoYXZlIGNsb3NlZC5cbiAgICAvLyBXZSBzaG91bGQgbmV2ZXIgZGVwZW5kIG9uIHRoZSBvcmRlciBvZiByZWdpc3RyYXRpb24gb2YgdGhlIGBvbkRpZENoYW5nZVBhdGhzYCBldmVudCxcbiAgICAvLyB3aGljaCBhbHNvIGRpc3Bvc2UgY29uc3VtZWQgc2VydmljZSdzIHJlc291cmNlcy5cbiAgICBzZXRUaW1lb3V0KGNoZWNrQ2xvc2VkUHJvamVjdCwgQ0xPU0VfUFJPSkVDVF9ERUxBWV9NUyk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGNoZWNrQ2xvc2VkUHJvamVjdCgpIHtcbiAgICAvLyBUaGUgcHJvamVjdCBwYXRocyBtYXkgaGF2ZSBjaGFuZ2VkIGR1cmluZyB0aGUgZGVsYXkgdGltZS5cbiAgICAvLyBIZW5jZSwgdGhlIGxhdGVzdCBwcm9qZWN0IHBhdGhzIGFyZSBmZXRjaGVkIGhlcmUuXG4gICAgY29uc3QgcGF0aHMgPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKTtcbiAgICBpZiAocGF0aHMuaW5kZXhPZih3b3JraW5nRGlyZWN0b3J5VXJpKSAhPT0gLTEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gVGhlIHByb2plY3Qgd2FzIHJlbW92ZWQgZnJvbSB0aGUgdHJlZS5cbiAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuXG4gICAgY2xvc2VPcGVuRmlsZXNGb3JSZW1vdGVQcm9qZWN0KGNvbm5lY3Rpb24uZ2V0Q29uZmlnKCkpO1xuXG4gICAgY29uc3QgaG9zdG5hbWUgPSBjb25uZWN0aW9uLmdldFJlbW90ZUhvc3RuYW1lKCk7XG4gICAgaWYgKFJlbW90ZUNvbm5lY3Rpb24uZ2V0QnlIb3N0bmFtZShob3N0bmFtZSkubGVuZ3RoID4gMSkge1xuICAgICAgbG9nZ2VyLmluZm8oJ1JlbWFpbmluZyByZW1vdGUgcHJvamVjdHMgdXNpbmcgTnVjbGlkZSBTZXJ2ZXIgLSBubyBwcm9tcHQgdG8gc2h1dGRvd24nKTtcbiAgICAgIGNvbm5lY3Rpb24uY2xvc2UoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBidXR0b25zID0gWydLZWVwIEl0JywgJ1NodXRkb3duJ107XG4gICAgY29uc3QgYnV0dG9uVG9BY3Rpb25zID0gbmV3IE1hcCgpO1xuXG4gICAgYnV0dG9uVG9BY3Rpb25zLnNldChidXR0b25zWzBdLCAoKSA9PiBjb25uZWN0aW9uLmNsb3NlKCkpO1xuICAgIGJ1dHRvblRvQWN0aW9ucy5zZXQoYnV0dG9uc1sxXSwgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgY29ubmVjdGlvbi5nZXRTZXJ2aWNlKCdJbmZvU2VydmljZScpLnNodXRkb3duU2VydmVyKCk7XG4gICAgICBjb25uZWN0aW9uLmNsb3NlKCk7XG4gICAgICByZXR1cm47XG4gICAgfSk7XG5cbiAgICBpZiAoZmVhdHVyZUNvbmZpZy5nZXQoXG4gICAgICAnbnVjbGlkZS1yZW1vdGUtcHJvamVjdHMuc2h1dGRvd25TZXJ2ZXJBZnRlckRpc2Nvbm5lY3Rpb24nLFxuICAgICkpIHtcbiAgICAgIC8vIEF0b20gdGFrZXMgdGhlIGZpcnN0IGJ1dHRvbiBpbiB0aGUgbGlzdCBhcyBkZWZhdWx0IG9wdGlvbi5cbiAgICAgIGJ1dHRvbnMucmV2ZXJzZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IGNob2ljZSA9IGdsb2JhbC5hdG9tLmNvbmZpcm0oe1xuICAgICAgbWVzc2FnZTogJ05vIG1vcmUgcmVtb3RlIHByb2plY3RzIG9uIHRoZSBob3N0OiBcXCcnICsgaG9zdG5hbWUgK1xuICAgICAgICAnXFwnLiBXb3VsZCB5b3UgbGlrZSB0byBzaHV0ZG93biBOdWNsaWRlIHNlcnZlciB0aGVyZT8nLFxuICAgICAgYnV0dG9ucyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGFjdGlvbiA9IGJ1dHRvblRvQWN0aW9ucy5nZXQoYnV0dG9uc1tjaG9pY2VdKTtcbiAgICBpbnZhcmlhbnQoYWN0aW9uKTtcbiAgICBhY3Rpb24oKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjbG9zZU9wZW5GaWxlc0ZvclJlbW90ZVByb2plY3QocmVtb3RlUHJvamVjdENvbmZpZzogUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24pOiB2b2lkIHtcbiAgY29uc3Qgb3Blbkluc3RhbmNlcyA9IGdldE9wZW5GaWxlRWRpdG9yRm9yUmVtb3RlUHJvamVjdChyZW1vdGVQcm9qZWN0Q29uZmlnKTtcbiAgZm9yIChjb25zdCBvcGVuSW5zdGFuY2Ugb2Ygb3Blbkluc3RhbmNlcykge1xuICAgIGNvbnN0IHtlZGl0b3IsIHBhbmV9ID0gb3Blbkluc3RhbmNlO1xuICAgIHBhbmUucmVtb3ZlSXRlbShlZGl0b3IpO1xuICAgIGVkaXRvci5kZXN0cm95KCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UmVtb3RlUm9vdERpcmVjdG9yaWVzKCk6IEFycmF5PGF0b20kRGlyZWN0b3J5PiB7XG4gIC8vIFRPRE86IFVzZSBudWNsaWRlLXJlbW90ZS11cmkgaW5zdGVhZC5cbiAgcmV0dXJuIGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpLmZpbHRlcihcbiAgICBkaXJlY3RvcnkgPT4gZGlyZWN0b3J5LmdldFBhdGgoKS5zdGFydHNXaXRoKCdudWNsaWRlOicpKTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFueSBEaXJlY3RvcnkgKG5vdCBSZW1vdGVEaXJlY3RvcnkpIG9iamVjdHMgdGhhdCBoYXZlIE51Y2xpZGVcbiAqIHJlbW90ZSBVUklzLlxuICovXG5mdW5jdGlvbiBkZWxldGVEdW1teVJlbW90ZVJvb3REaXJlY3RvcmllcygpIHtcbiAgY29uc3Qge1JlbW90ZURpcmVjdG9yeX0gPSByZXF1aXJlKCcuLi8uLi9yZW1vdGUtY29ubmVjdGlvbicpO1xuICBjb25zdCB7aXNSZW1vdGV9ID0gcmVxdWlyZSgnLi4vLi4vcmVtb3RlLXVyaScpO1xuICBmb3IgKGNvbnN0IGRpcmVjdG9yeSBvZiBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKSkge1xuICAgIGlmIChpc1JlbW90ZShkaXJlY3RvcnkuZ2V0UGF0aCgpKSAmJlxuICAgICAgICAhKFJlbW90ZURpcmVjdG9yeS5pc1JlbW90ZURpcmVjdG9yeShkaXJlY3RvcnkpKSkge1xuICAgICAgYXRvbS5wcm9qZWN0LnJlbW92ZVBhdGgoZGlyZWN0b3J5LmdldFBhdGgoKSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVGhlIHNhbWUgVGV4dEVkaXRvciBtdXN0IGJlIHJldHVybmVkIHRvIHByZXZlbnQgQXRvbSBmcm9tIGNyZWF0aW5nIG11bHRpcGxlIHRhYnNcbiAqIGZvciB0aGUgc2FtZSBmaWxlLCBiZWNhdXNlIEF0b20gZG9lc24ndCBjYWNoZSBwZW5kaW5nIG9wZW5lciBwcm9taXNlcy5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gY3JlYXRlRWRpdG9yRm9yTnVjbGlkZShcbiAgY29ubmVjdGlvbjogUmVtb3RlQ29ubmVjdGlvbixcbiAgdXJpOiBOdWNsaWRlVXJpLFxuKTogUHJvbWlzZTxUZXh0RWRpdG9yPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgYnVmZmVyID0gYXdhaXQgbG9hZEJ1ZmZlckZvclVyaSh1cmkpO1xuICAgIHJldHVybiBjcmVhdGVUZXh0RWRpdG9yKHtidWZmZXJ9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbG9nZ2VyLndhcm4oJ2J1ZmZlciBsb2FkIGlzc3VlOicsIGVycik7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKGBGYWlsZWQgdG8gb3BlbiAke3VyaX06ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIHJlbW90ZSBidWZmZXIgaGFzIGFscmVhZHkgYmVlbiBpbml0aWFsaXplZCBpbiBlZGl0b3IuXG4gKiBUaGlzIGNoZWNrcyBpZiB0aGUgYnVmZmVyIGlzIGluc3RhbmNlIG9mIE51Y2xpZGVUZXh0QnVmZmVyLlxuICovXG5mdW5jdGlvbiBpc1JlbW90ZUJ1ZmZlckluaXRpYWxpemVkKGVkaXRvcjogVGV4dEVkaXRvcik6IGJvb2xlYW4ge1xuICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XG4gIC8vICRGbG93SXNzdWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9mbG93L2lzc3Vlcy8xMzc1XG4gIGlmIChidWZmZXIgJiYgYnVmZmVyLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdOdWNsaWRlVGV4dEJ1ZmZlcicpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlbG9hZFJlbW90ZVByb2plY3RzKFxuICByZW1vdGVQcm9qZWN0czogQXJyYXk8U2VyaWFsaXphYmxlUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24+LFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIC8vIFRoaXMgaXMgaW50ZW50aW9uYWxseSBzZXJpYWwuXG4gIC8vIFRoZSA5MCUgdXNlIGNhc2UgaXMgdG8gaGF2ZSBtdWx0aXBsZSByZW1vdGUgcHJvamVjdHMgZm9yIGEgc2luZ2xlIGNvbm5lY3Rpb247XG4gIC8vIGFmdGVyIHRoZSBmaXJzdCBvbmUgc3VjY2VlZHMgdGhlIHJlc3Qgc2hvdWxkIHJlcXVpcmUgbm8gdXNlciBhY3Rpb24uXG4gIGZvciAoY29uc3QgY29uZmlnIG9mIHJlbW90ZVByb2plY3RzKSB7XG4gICAgLyogZXNsaW50LWRpc2FibGUgYmFiZWwvbm8tYXdhaXQtaW4tbG9vcCAqL1xuICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBhd2FpdCBjcmVhdGVSZW1vdGVDb25uZWN0aW9uKGNvbmZpZyk7XG4gICAgaWYgKCFjb25uZWN0aW9uKSB7XG4gICAgICBsb2dnZXIuaW5mbyhcbiAgICAgICAgJ05vIFJlbW90ZUNvbm5lY3Rpb24gcmV0dXJuZWQgb24gcmVzdG9yZSBzdGF0ZSB0cmlhbDonLFxuICAgICAgICBjb25maWcuaG9zdCxcbiAgICAgICAgY29uZmlnLmN3ZCxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEl0J3MgZmluZSB0aGUgdXNlciBjb25uZWN0ZWQgdG8gYSBkaWZmZXJlbnQgcHJvamVjdCBvbiB0aGUgc2FtZSBob3N0OlxuICAgICAgLy8gd2Ugc2hvdWxkIHN0aWxsIGJlIGFibGUgdG8gcmVzdG9yZSB0aGlzIHVzaW5nIHRoZSBuZXcgY29ubmVjdGlvbi5cbiAgICAgIGNvbnN0IHtjd2QsIGhvc3R9ID0gY29uZmlnO1xuICAgICAgaWYgKGNvbm5lY3Rpb24uZ2V0UGF0aEZvckluaXRpYWxXb3JraW5nRGlyZWN0b3J5KCkgIT09IGN3ZCAmJlxuICAgICAgICAgIGNvbm5lY3Rpb24uZ2V0UmVtb3RlSG9zdG5hbWUoKSA9PT0gaG9zdCkge1xuICAgICAgICBhd2FpdCBSZW1vdGVDb25uZWN0aW9uLmNyZWF0ZUNvbm5lY3Rpb25CeVNhdmVkQ29uZmlnKGhvc3QsIGN3ZCk7XG4gICAgICB9XG4gICAgfVxuICAgIC8qIGVzbGludC1lbmFibGUgYmFiZWwvbm8tYXdhaXQtaW4tbG9vcCAqL1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhY3RpdmF0ZShzdGF0ZTogP3tyZW1vdGVQcm9qZWN0c0NvbmZpZzogU2VyaWFsaXphYmxlUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb25bXX0pOiB2b2lkIHtcbiAgICBjb25zdCBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuICAgIGNvbnN0IFJlbW90ZVByb2plY3RzQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vUmVtb3RlUHJvamVjdHNDb250cm9sbGVyJyk7XG4gICAgY29udHJvbGxlciA9IG5ldyBSZW1vdGVQcm9qZWN0c0NvbnRyb2xsZXIoKTtcblxuICAgIHN1YnNjcmlwdGlvbnMuYWRkKFJlbW90ZUNvbm5lY3Rpb24ub25EaWRBZGRSZW1vdGVDb25uZWN0aW9uKGNvbm5lY3Rpb24gPT4ge1xuICAgICAgYWRkUmVtb3RlRm9sZGVyVG9Qcm9qZWN0KGNvbm5lY3Rpb24pO1xuXG5cbiAgICAgIC8vIE9uIEF0b20gcmVzdGFydCwgaXQgdHJpZXMgdG8gb3BlbiB1cmkgcGF0aHMgYXMgbG9jYWwgYFRleHRFZGl0b3JgIHBhbmUgaXRlbXMuXG4gICAgICAvLyBIZXJlLCBOdWNsaWRlIHJlbG9hZHMgdGhlIHJlbW90ZSBwcm9qZWN0IGZpbGVzIHRoYXQgaGF2ZSBlbXB0eSB0ZXh0IGVkaXRvcnMgb3Blbi5cbiAgICAgIGNvbnN0IGNvbmZpZyA9IGNvbm5lY3Rpb24uZ2V0Q29uZmlnKCk7XG4gICAgICBjb25zdCBvcGVuSW5zdGFuY2VzID0gZ2V0T3BlbkZpbGVFZGl0b3JGb3JSZW1vdGVQcm9qZWN0KGNvbmZpZyk7XG4gICAgICBmb3IgKGNvbnN0IG9wZW5JbnN0YW5jZSBvZiBvcGVuSW5zdGFuY2VzKSB7XG4gICAgICAgIC8vIEtlZXAgdGhlIG9yaWdpbmFsIG9wZW4gZWRpdG9yIGl0ZW0gd2l0aCBhIHVuaXF1ZSBuYW1lIHVudGlsIHRoZSByZW1vdGUgYnVmZmVyIGlzIGxvYWRlZCxcbiAgICAgICAgLy8gVGhlbiwgd2UgYXJlIHJlYWR5IHRvIHJlcGxhY2UgaXQgd2l0aCB0aGUgcmVtb3RlIHRhYiBpbiB0aGUgc2FtZSBwYW5lLlxuICAgICAgICBjb25zdCB7cGFuZSwgZWRpdG9yLCB1cmksIGZpbGVQYXRofSA9IG9wZW5JbnN0YW5jZTtcblxuICAgICAgICAvLyBTa2lwIHJlc3RvcmluZyB0aGUgZWRpdGVyIHdobyBoYXMgcmVtb3RlIGNvbnRlbnQgbG9hZGVkLlxuICAgICAgICBpZiAoaXNSZW1vdGVCdWZmZXJJbml0aWFsaXplZChlZGl0b3IpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIZXJlLCBhIHVuaXF1ZSB1cmkgaXMgcGlja2VkIHRvIHRoZSBwZW5kaW5nIG9wZW4gcGFuZSBpdGVtIHRvIG1haW50YWluIHRoZSBwYW5lIGxheW91dC5cbiAgICAgICAgLy8gT3RoZXJ3aXNlLCB0aGUgb3BlbiB3b24ndCBiZSBjb21wbGV0ZWQgYmVjYXVzZSB0aGVyZSBleGlzdHMgYSBwYW5lIGl0ZW0gd2l0aCB0aGUgc2FtZVxuICAgICAgICAvLyB1cmkuXG4gICAgICAgIC8qICRGbG93Rml4TWUgKi9cbiAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLmZpbGUucGF0aCA9IGAke3VyaX0udG8tY2xvc2VgO1xuICAgICAgICAvLyBDbGVhbnVwIHRoZSBvbGQgcGFuZSBpdGVtIG9uIHN1Y2Nlc3NmdWwgb3BlbmluZyBvciB3aGVuIG5vIGNvbm5lY3Rpb24gY291bGQgYmVcbiAgICAgICAgLy8gZXN0YWJsaXNoZWQuXG4gICAgICAgIGNvbnN0IGNsZWFudXBCdWZmZXIgPSAoKSA9PiB7XG4gICAgICAgICAgcGFuZS5yZW1vdmVJdGVtKGVkaXRvcik7XG4gICAgICAgICAgZWRpdG9yLmRlc3Ryb3koKTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGZpbGVQYXRoID09PSBjb25maWcuY3dkKSB7XG4gICAgICAgICAgY2xlYW51cEJ1ZmZlcigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIElmIHdlIGNsZWFuIHVwIHRoZSBidWZmZXIgYmVmb3JlIHRoZSBgb3BlblVyaUluUGFuZWAgZmluaXNoZXMsXG4gICAgICAgICAgLy8gdGhlIHBhbmUgd2lsbCBiZSBjbG9zZWQsIGJlY2F1c2UgaXQgY291bGQgaGF2ZSBubyBvdGhlciBpdGVtcy5cbiAgICAgICAgICAvLyBTbyB3ZSBtdXN0IGNsZWFuIHVwIGFmdGVyLlxuICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW5VUklJblBhbmUodXJpLCBwYW5lKS50aGVuKGNsZWFudXBCdWZmZXIsIGNsZWFudXBCdWZmZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXG4gICAgICAgICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAgICdudWNsaWRlLXJlbW90ZS1wcm9qZWN0czpjb25uZWN0JyxcbiAgICAgICAgKCkgPT4gcmVxdWlyZSgnLi4vLi4vc3NoLWRpYWxvZycpLm9wZW5Db25uZWN0aW9uRGlhbG9nKClcbiAgICApKTtcblxuICAgIC8vIFN1YnNjcmliZSBvcGVuZXIgYmVmb3JlIHJlc3RvcmluZyB0aGUgcmVtb3RlIHByb2plY3RzLlxuICAgIHN1YnNjcmlwdGlvbnMuYWRkKGF0b20ud29ya3NwYWNlLmFkZE9wZW5lcigodXJpID0gJycpID0+IHtcbiAgICAgIGlmICh1cmkuc3RhcnRzV2l0aCgnbnVjbGlkZTonKSkge1xuICAgICAgICBjb25zdCBjb25uZWN0aW9uID0gUmVtb3RlQ29ubmVjdGlvbi5nZXRGb3JVcmkodXJpKTtcbiAgICAgICAgLy8gT24gQXRvbSByZXN0YXJ0LCBpdCB0cmllcyB0byBvcGVuIHRoZSB1cmkgcGF0aCBhcyBhIGZpbGUgdGFiIGJlY2F1c2UgaXQncyBub3QgYSBsb2NhbFxuICAgICAgICAvLyBkaXJlY3RvcnkuIFdlIGNhbid0IGxldCB0aGF0IGNyZWF0ZSBhIGZpbGUgd2l0aCB0aGUgaW5pdGlhbCB3b3JraW5nIGRpcmVjdG9yeSBwYXRoLlxuICAgICAgICBpZiAoY29ubmVjdGlvbiAmJiB1cmkgIT09IGNvbm5lY3Rpb24uZ2V0VXJpRm9ySW5pdGlhbFdvcmtpbmdEaXJlY3RvcnkoKSkge1xuICAgICAgICAgIGlmIChwZW5kaW5nRmlsZXNbdXJpXSkge1xuICAgICAgICAgICAgcmV0dXJuIHBlbmRpbmdGaWxlc1t1cmldO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCB0ZXh0RWRpdG9yUHJvbWlzZSA9IHBlbmRpbmdGaWxlc1t1cmldID0gY3JlYXRlRWRpdG9yRm9yTnVjbGlkZShjb25uZWN0aW9uLCB1cmkpO1xuICAgICAgICAgIGNvbnN0IHJlbW92ZUZyb21DYWNoZSA9ICgpID0+IGRlbGV0ZSBwZW5kaW5nRmlsZXNbdXJpXTtcbiAgICAgICAgICB0ZXh0RWRpdG9yUHJvbWlzZS50aGVuKHJlbW92ZUZyb21DYWNoZSwgcmVtb3ZlRnJvbUNhY2hlKTtcbiAgICAgICAgICByZXR1cm4gdGV4dEVkaXRvclByb21pc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICAvLyBJZiBSZW1vdGVEaXJlY3RvcnlQcm92aWRlciBpcyBjYWxsZWQgYmVmb3JlIHRoaXMsIGFuZCBpdCBmYWlsZWRcbiAgICAvLyB0byBwcm92aWRlIGEgUmVtb3RlRGlyZWN0b3J5IGZvciBhXG4gICAgLy8gZ2l2ZW4gVVJJLCBBdG9tIHdpbGwgY3JlYXRlIGEgZ2VuZXJpYyBEaXJlY3RvcnkgdG8gd3JhcCB0aGF0LiBXZSB3YW50XG4gICAgLy8gdG8gZGVsZXRlIHRoZXNlIGluc3RlYWQsIGJlY2F1c2UgdGhvc2UgZGlyZWN0b3JpZXMgYXJlbid0IHZhbGlkL3VzZWZ1bFxuICAgIC8vIGlmIHRoZXkgYXJlIG5vdCB0cnVlIFJlbW90ZURpcmVjdG9yeSBvYmplY3RzIChjb25uZWN0ZWQgdG8gYSByZWFsXG4gICAgLy8gcmVhbCByZW1vdGUgZm9sZGVyKS5cbiAgICBkZWxldGVEdW1teVJlbW90ZVJvb3REaXJlY3RvcmllcygpO1xuXG4gICAgLy8gQXR0ZW1wdCB0byByZWxvYWQgcHJldmlvdXNseSBvcGVuIHByb2plY3RzLlxuICAgIGNvbnN0IHJlbW90ZVByb2plY3RzQ29uZmlnID0gc3RhdGUgJiYgc3RhdGUucmVtb3RlUHJvamVjdHNDb25maWc7XG4gICAgaWYgKHJlbW90ZVByb2plY3RzQ29uZmlnICE9IG51bGwpIHtcbiAgICAgIHJlbG9hZFJlbW90ZVByb2plY3RzKHJlbW90ZVByb2plY3RzQ29uZmlnKTtcbiAgICB9XG4gICAgcGFja2FnZVN1YnNjcmlwdGlvbnMgPSBzdWJzY3JpcHRpb25zO1xuICB9LFxuXG4gIGNvbnN1bWVTdGF0dXNCYXIoc3RhdHVzQmFyOiBhdG9tJFN0YXR1c0Jhcik6IHZvaWQge1xuICAgIGlmIChjb250cm9sbGVyKSB7XG4gICAgICBjb250cm9sbGVyLmNvbnN1bWVTdGF0dXNCYXIoc3RhdHVzQmFyKTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gVE9ETzogQWxsIG9mIHRoZSBlbGVtZW50cyBvZiB0aGUgYXJyYXkgYXJlIG5vbi1udWxsLCBidXQgaXQgZG9lcyBub3Qgc2VlbSBwb3NzaWJsZSB0byBjb252aW5jZVxuICAvLyBGbG93IG9mIHRoYXQuXG4gIHNlcmlhbGl6ZSgpOiB7cmVtb3RlUHJvamVjdHNDb25maWc6IEFycmF5PD9TZXJpYWxpemFibGVSZW1vdGVDb25uZWN0aW9uQ29uZmlndXJhdGlvbj59IHtcbiAgICBjb25zdCByZW1vdGVQcm9qZWN0c0NvbmZpZzogQXJyYXk8P1NlcmlhbGl6YWJsZVJlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9uPiA9XG4gICAgICBnZXRSZW1vdGVSb290RGlyZWN0b3JpZXMoKVxuICAgICAgICAubWFwKChkaXJlY3Rvcnk6IGF0b20kRGlyZWN0b3J5KTogP1NlcmlhbGl6YWJsZVJlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9uID0+IHtcbiAgICAgICAgICBjb25zdCBjb25uZWN0aW9uID0gUmVtb3RlQ29ubmVjdGlvbi5nZXRGb3JVcmkoZGlyZWN0b3J5LmdldFBhdGgoKSk7XG4gICAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb24gP1xuICAgICAgICAgICAgY3JlYXRlU2VyaWFsaXphYmxlUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24oY29ubmVjdGlvbi5nZXRDb25maWcoKSkgOiBudWxsO1xuICAgICAgICB9KVxuICAgICAgICAuZmlsdGVyKChjb25maWc6ID9TZXJpYWxpemFibGVSZW1vdGVDb25uZWN0aW9uQ29uZmlndXJhdGlvbikgPT4gY29uZmlnICE9IG51bGwpO1xuICAgIHJldHVybiB7XG4gICAgICByZW1vdGVQcm9qZWN0c0NvbmZpZyxcbiAgICB9O1xuICB9LFxuXG4gIGRlYWN0aXZhdGUoKTogdm9pZCB7XG4gICAgaWYgKHBhY2thZ2VTdWJzY3JpcHRpb25zKSB7XG4gICAgICBwYWNrYWdlU3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gICAgICBwYWNrYWdlU3Vic2NyaXB0aW9ucyA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRyb2xsZXIgIT0gbnVsbCkge1xuICAgICAgY29udHJvbGxlci5kZXN0cm95KCk7XG4gICAgICBjb250cm9sbGVyID0gbnVsbDtcbiAgICB9XG4gIH0sXG5cbiAgY3JlYXRlUmVtb3RlRGlyZWN0b3J5UHJvdmlkZXIoKTogUmVtb3RlRGlyZWN0b3J5UHJvdmlkZXJUIHtcbiAgICBjb25zdCBSZW1vdGVEaXJlY3RvcnlQcm92aWRlciA9IHJlcXVpcmUoJy4vUmVtb3RlRGlyZWN0b3J5UHJvdmlkZXInKTtcbiAgICByZXR1cm4gbmV3IFJlbW90ZURpcmVjdG9yeVByb3ZpZGVyKCk7XG4gIH0sXG5cbiAgY3JlYXRlUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXIoKTogUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXJUIHtcbiAgICBjb25zdCB7Z2V0U2VydmljZUJ5TnVjbGlkZVVyaX0gPSByZXF1aXJlKCcuLi8uLi9jbGllbnQnKTtcbiAgICBjb25zdCB7UmVtb3RlRGlyZWN0b3J5fSA9IHJlcXVpcmUoJy4uLy4uL3JlbW90ZS1jb25uZWN0aW9uJyk7XG4gICAgY29uc3QgUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXIgPSByZXF1aXJlKCcuL1JlbW90ZURpcmVjdG9yeVNlYXJjaGVyJyk7XG4gICAgcmV0dXJuIG5ldyBSZW1vdGVEaXJlY3RvcnlTZWFyY2hlcigoZGlyOiBSZW1vdGVEaXJlY3RvcnkpID0+IHtcbiAgICAgIGNvbnN0IHNlcnZpY2UgPSBnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpKCdGaW5kSW5Qcm9qZWN0U2VydmljZScsIGRpci5nZXRQYXRoKCkpO1xuICAgICAgaW52YXJpYW50KHNlcnZpY2UpO1xuICAgICAgcmV0dXJuIChzZXJ2aWNlOiBGaW5kSW5Qcm9qZWN0U2VydmljZSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgZ2V0SG9tZUZyYWdtZW50cygpOiBIb21lRnJhZ21lbnRzIHtcbiAgICByZXR1cm4ge1xuICAgICAgZmVhdHVyZToge1xuICAgICAgICB0aXRsZTogJ1JlbW90ZSBDb25uZWN0aW9uJyxcbiAgICAgICAgaWNvbjogJ2Nsb3VkLXVwbG9hZCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ29ubmVjdCB0byBhIHJlbW90ZSBzZXJ2ZXIgdG8gZWRpdCBmaWxlcy4nLFxuICAgICAgICBjb21tYW5kOiAnbnVjbGlkZS1yZW1vdGUtcHJvamVjdHM6Y29ubmVjdCcsXG4gICAgICB9LFxuICAgICAgcHJpb3JpdHk6IDgsXG4gICAgfTtcbiAgfSxcblxufTtcbiJdfQ==