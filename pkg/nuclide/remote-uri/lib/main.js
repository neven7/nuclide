Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _path4 = require('path');

var _path5 = _interopRequireDefault(_path4);

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

// NuclideUri's are either a local file path, or a URI
// of the form nuclide://<host>:<port><path>
//
// This package creates, queries and decomposes NuclideUris.

var REMOTE_PATH_URI_PREFIX = 'nuclide://';

function isRemote(uri) {
  return uri.startsWith(REMOTE_PATH_URI_PREFIX);
}

function isLocal(uri) {
  return !isRemote(uri);
}

function createRemoteUri(hostname, remotePort, remotePath) {
  return 'nuclide://' + hostname + ':' + remotePort + remotePath;
}

/**
 * Parses `uri` with Node's `url.parse` and calls `decodeURI` on `href`, `path`, and `pathname` of
 * the parsed URL object.
 *
 * * `url.parse` seems to apply encodeURI to the URL, and we typically don't want this behavior.
 * * Nuclide URIs disallow use of the `hash` attribute, and any hash characters are interpreted as
 *   as literal hashes.
 *
 *   For example:
 *
 *       parse('nuclide://f.co:123/path/to/#foo.txt#')
 *       >
 *         {
 *           ...
 *           path: '/path/to/#foo.txt#',
 *           ...
 *         }
 */
function parse(uri) {
  var parsedUri = require('url').parse(uri);

  (0, _assert2['default'])(parsedUri.path, 'Nuclide URIs must contain paths, \'' + parsedUri.path + '\' found.');
  var path = parsedUri.path;
  // `url.parse` treates the first '#' character as the beginning of the `hash` attribute. That
  // feature is not used in Nuclide and is instead treated as part of the path.
  if (parsedUri.hash != null) {
    path += parsedUri.hash;
  }

  (0, _assert2['default'])(parsedUri.pathname, 'Nuclide URIs must contain pathnamess, \'' + parsedUri.pathname + '\' found.');
  var pathname = parsedUri.pathname;
  // `url.parse` treates the first '#' character as the beginning of the `hash` attribute. That
  // feature is not used in Nuclide and is instead treated as part of the pathname.
  if (parsedUri.hash != null) {
    pathname += parsedUri.hash;
  }

  // Explicitly copying object properties appeases Flow's "maybe" type handling. Using the `...`
  // operator causes null/undefined errors, and `Object.assign` bypasses type checking.
  return {
    auth: parsedUri.auth,
    host: parsedUri.host,
    hostname: parsedUri.hostname,
    href: decodeURI(parsedUri.href),
    path: decodeURI(path),
    pathname: decodeURI(pathname),
    port: parsedUri.port,
    protocol: parsedUri.protocol,
    query: parsedUri.query,
    search: parsedUri.search,
    slashes: parsedUri.slashes
  };
}

function parseRemoteUri(remoteUri) {
  if (!isRemote(remoteUri)) {
    throw new Error('Expected remote uri. Got ' + remoteUri);
  }
  var parsedUri = parse(remoteUri);
  (0, _assert2['default'])(parsedUri.hostname, 'Remote Nuclide URIs must contain hostnames, \'' + parsedUri.hostname + '\' found.');
  (0, _assert2['default'])(parsedUri.port, 'Remote Nuclide URIs must have port numbers, \'' + parsedUri.port + '\' found.');

  // Explicitly copying object properties appeases Flow's "maybe" type handling. Using the `...`
  // operator causes null/undefined errors, and `Object.assign` bypasses type checking.
  return {
    auth: parsedUri.auth,
    host: parsedUri.host,
    hostname: parsedUri.hostname,
    href: parsedUri.href,
    path: parsedUri.path,
    pathname: parsedUri.pathname,
    port: parsedUri.port,
    protocol: parsedUri.protocol,
    query: parsedUri.query,
    search: parsedUri.search,
    slashes: parsedUri.slashes
  };
}

function getPath(uri) {
  return parse(uri).path;
}

function getHostname(remoteUri) {
  return parseRemoteUri(remoteUri).hostname;
}

function getPort(remoteUri) {
  return Number(parseRemoteUri(remoteUri).port);
}

function join(uri) {
  for (var _len = arguments.length, relativePath = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    relativePath[_key - 1] = arguments[_key];
  }

  if (isRemote(uri)) {
    var _parseRemoteUri = parseRemoteUri(uri);

    var _hostname = _parseRemoteUri.hostname;
    var _port = _parseRemoteUri.port;
    var _path = _parseRemoteUri.path;

    relativePath.splice(0, 0, _path);
    return createRemoteUri(_hostname, Number(_port), _path5['default'].join.apply(null, relativePath));
  } else {
    relativePath.splice(0, 0, uri);
    return _path5['default'].join.apply(null, relativePath);
  }
}

function normalize(uri) {
  if (isRemote(uri)) {
    var _parseRemoteUri2 = parseRemoteUri(uri);

    var _hostname2 = _parseRemoteUri2.hostname;
    var _port2 = _parseRemoteUri2.port;
    var _path2 = _parseRemoteUri2.path;

    return createRemoteUri(_hostname2, Number(_port2), _path5['default'].normalize(_path2));
  } else {
    return _path5['default'].normalize(uri);
  }
}

function getParent(uri) {
  // TODO: Is this different than dirname?
  return normalize(join(uri, '..'));
}

function relative(uri, other) {
  var remote = isRemote(uri);
  if (remote !== isRemote(other) || remote && getHostname(uri) !== getHostname(other)) {
    throw new Error('Cannot relative urls on different hosts.');
  }
  if (remote) {
    return _path5['default'].relative(getPath(uri), getPath(other));
  } else {
    return _path5['default'].relative(uri, other);
  }
}

// TODO: Add optional ext parameter
function basename(uri) {
  if (isRemote(uri)) {
    return _path5['default'].basename(getPath(uri));
  } else {
    return _path5['default'].basename(uri);
  }
}

function dirname(uri) {
  if (isRemote(uri)) {
    var _parseRemoteUri3 = parseRemoteUri(uri);

    var _hostname3 = _parseRemoteUri3.hostname;
    var _port3 = _parseRemoteUri3.port;
    var _path3 = _parseRemoteUri3.path;

    return createRemoteUri(_hostname3, Number(_port3), _path5['default'].dirname(_path3));
  } else {
    return _path5['default'].dirname(uri);
  }
}

/**
 * uri is either a file: uri, or a nuclide: uri.
 * must convert file: uri's to just a path for atom.
 *
 * Returns null if not a valid file: URI.
 */
function uriToNuclideUri(uri) {
  var urlParts = require('url').parse(uri, false);
  if (urlParts.protocol === 'file:' && urlParts.path) {
    // only handle real files for now.
    return urlParts.path;
  } else if (isRemote(uri)) {
    return uri;
  } else {
    return null;
  }
}

/**
 * Converts local paths to file: URI's. Leaves remote URI's alone.
 */
function nuclideUriToUri(uri) {
  if (isRemote(uri)) {
    return uri;
  } else {
    return 'file://' + uri;
  }
}

module.exports = {
  basename: basename,
  dirname: dirname,
  isRemote: isRemote,
  isLocal: isLocal,
  createRemoteUri: createRemoteUri,
  parse: parse,
  parseRemoteUri: parseRemoteUri,
  getPath: getPath,
  getHostname: getHostname,
  getPort: getPort,
  join: join,
  relative: relative,
  normalize: normalize,
  getParent: getParent,
  uriToNuclideUri: uriToNuclideUri,
  nuclideUriToUri: nuclideUriToUri
};
//# sourceMappingURL=data:application/json;base64,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QUFHLEdBQUcsQ0FBQztHQUN4QjtDQUNGOztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZixVQUFRLEVBQVIsUUFBUTtBQUNSLFNBQU8sRUFBUCxPQUFPO0FBQ1AsVUFBUSxFQUFSLFFBQVE7QUFDUixTQUFPLEVBQVAsT0FBTztBQUNQLGlCQUFlLEVBQWYsZUFBZTtBQUNmLE9BQUssRUFBTCxLQUFLO0FBQ0wsZ0JBQWMsRUFBZCxjQUFjO0FBQ2QsU0FBTyxFQUFQLE9BQU87QUFDUCxhQUFXLEVBQVgsV0FBVztBQUNYLFNBQU8sRUFBUCxPQUFPO0FBQ1AsTUFBSSxFQUFKLElBQUk7QUFDSixVQUFRLEVBQVIsUUFBUTtBQUNSLFdBQVMsRUFBVCxTQUFTO0FBQ1QsV0FBUyxFQUFULFNBQVM7QUFDVCxpQkFBZSxFQUFmLGVBQWU7QUFDZixpQkFBZSxFQUFmLGVBQWU7Q0FDaEIsQ0FBQyIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuLy8gTnVjbGlkZVVyaSdzIGFyZSBlaXRoZXIgYSBsb2NhbCBmaWxlIHBhdGgsIG9yIGEgVVJJXG4vLyBvZiB0aGUgZm9ybSBudWNsaWRlOi8vPGhvc3Q+Ojxwb3J0PjxwYXRoPlxuLy9cbi8vIFRoaXMgcGFja2FnZSBjcmVhdGVzLCBxdWVyaWVzIGFuZCBkZWNvbXBvc2VzIE51Y2xpZGVVcmlzLlxuXG5leHBvcnQgdHlwZSBOdWNsaWRlVXJpID0gc3RyaW5nO1xuXG50eXBlIFBhcnNlZFVybCA9IHtcbiAgYXV0aDogP3N0cmluZztcbiAgaHJlZjogc3RyaW5nO1xuICBob3N0OiA/c3RyaW5nO1xuICBob3N0bmFtZTogP3N0cmluZztcbiAgcGF0aDogc3RyaW5nO1xuICBwYXRobmFtZTogc3RyaW5nO1xuICBwb3J0OiA/c3RyaW5nO1xuICBwcm90b2NvbDogP3N0cmluZztcbiAgcXVlcnk6ID9hbnk7XG4gIHNlYXJjaDogP3N0cmluZztcbiAgc2xhc2hlczogP2Jvb2xlYW47XG59O1xuXG50eXBlIFBhcnNlZFJlbW90ZVVybCA9IHtcbiAgYXV0aDogP3N0cmluZztcbiAgaHJlZjogc3RyaW5nO1xuICBob3N0OiA/c3RyaW5nO1xuICBob3N0bmFtZTogc3RyaW5nO1xuICBwYXRoOiBzdHJpbmc7XG4gIHBhdGhuYW1lOiBzdHJpbmc7XG4gIHBvcnQ6IHN0cmluZztcbiAgcHJvdG9jb2w6ID9zdHJpbmc7XG4gIHF1ZXJ5OiA/YW55O1xuICBzZWFyY2g6ID9zdHJpbmc7XG4gIHNsYXNoZXM6ID9ib29sZWFuO1xufTtcblxuaW1wb3J0IGludmFyaWFudCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IHBhdGhQYWNrYWdlIGZyb20gJ3BhdGgnO1xuXG5jb25zdCBSRU1PVEVfUEFUSF9VUklfUFJFRklYID0gJ251Y2xpZGU6Ly8nO1xuXG5mdW5jdGlvbiBpc1JlbW90ZSh1cmk6IE51Y2xpZGVVcmkpOiBib29sZWFuIHtcbiAgcmV0dXJuIHVyaS5zdGFydHNXaXRoKFJFTU9URV9QQVRIX1VSSV9QUkVGSVgpO1xufVxuXG5mdW5jdGlvbiBpc0xvY2FsKHVyaTogTnVjbGlkZVVyaSk6IGJvb2xlYW4ge1xuICByZXR1cm4gIWlzUmVtb3RlKHVyaSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlbW90ZVVyaShob3N0bmFtZTogc3RyaW5nLCByZW1vdGVQb3J0OiBudW1iZXIsIHJlbW90ZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgbnVjbGlkZTovLyR7aG9zdG5hbWV9OiR7cmVtb3RlUG9ydH0ke3JlbW90ZVBhdGh9YDtcbn1cblxuLyoqXG4gKiBQYXJzZXMgYHVyaWAgd2l0aCBOb2RlJ3MgYHVybC5wYXJzZWAgYW5kIGNhbGxzIGBkZWNvZGVVUklgIG9uIGBocmVmYCwgYHBhdGhgLCBhbmQgYHBhdGhuYW1lYCBvZlxuICogdGhlIHBhcnNlZCBVUkwgb2JqZWN0LlxuICpcbiAqICogYHVybC5wYXJzZWAgc2VlbXMgdG8gYXBwbHkgZW5jb2RlVVJJIHRvIHRoZSBVUkwsIGFuZCB3ZSB0eXBpY2FsbHkgZG9uJ3Qgd2FudCB0aGlzIGJlaGF2aW9yLlxuICogKiBOdWNsaWRlIFVSSXMgZGlzYWxsb3cgdXNlIG9mIHRoZSBgaGFzaGAgYXR0cmlidXRlLCBhbmQgYW55IGhhc2ggY2hhcmFjdGVycyBhcmUgaW50ZXJwcmV0ZWQgYXNcbiAqICAgYXMgbGl0ZXJhbCBoYXNoZXMuXG4gKlxuICogICBGb3IgZXhhbXBsZTpcbiAqXG4gKiAgICAgICBwYXJzZSgnbnVjbGlkZTovL2YuY286MTIzL3BhdGgvdG8vI2Zvby50eHQjJylcbiAqICAgICAgID5cbiAqICAgICAgICAge1xuICogICAgICAgICAgIC4uLlxuICogICAgICAgICAgIHBhdGg6ICcvcGF0aC90by8jZm9vLnR4dCMnLFxuICogICAgICAgICAgIC4uLlxuICogICAgICAgICB9XG4gKi9cbmZ1bmN0aW9uIHBhcnNlKHVyaTogTnVjbGlkZVVyaSk6IFBhcnNlZFVybCB7XG4gIGNvbnN0IHBhcnNlZFVyaSA9IHJlcXVpcmUoJ3VybCcpLnBhcnNlKHVyaSk7XG5cbiAgaW52YXJpYW50KHBhcnNlZFVyaS5wYXRoLCBgTnVjbGlkZSBVUklzIG11c3QgY29udGFpbiBwYXRocywgJyR7cGFyc2VkVXJpLnBhdGh9JyBmb3VuZC5gKTtcbiAgbGV0IHBhdGggPSBwYXJzZWRVcmkucGF0aDtcbiAgLy8gYHVybC5wYXJzZWAgdHJlYXRlcyB0aGUgZmlyc3QgJyMnIGNoYXJhY3RlciBhcyB0aGUgYmVnaW5uaW5nIG9mIHRoZSBgaGFzaGAgYXR0cmlidXRlLiBUaGF0XG4gIC8vIGZlYXR1cmUgaXMgbm90IHVzZWQgaW4gTnVjbGlkZSBhbmQgaXMgaW5zdGVhZCB0cmVhdGVkIGFzIHBhcnQgb2YgdGhlIHBhdGguXG4gIGlmIChwYXJzZWRVcmkuaGFzaCAhPSBudWxsKSB7XG4gICAgcGF0aCArPSBwYXJzZWRVcmkuaGFzaDtcbiAgfVxuXG4gIGludmFyaWFudChcbiAgICBwYXJzZWRVcmkucGF0aG5hbWUsXG4gICAgYE51Y2xpZGUgVVJJcyBtdXN0IGNvbnRhaW4gcGF0aG5hbWVzcywgJyR7cGFyc2VkVXJpLnBhdGhuYW1lfScgZm91bmQuYFxuICApO1xuICBsZXQgcGF0aG5hbWUgPSBwYXJzZWRVcmkucGF0aG5hbWU7XG4gIC8vIGB1cmwucGFyc2VgIHRyZWF0ZXMgdGhlIGZpcnN0ICcjJyBjaGFyYWN0ZXIgYXMgdGhlIGJlZ2lubmluZyBvZiB0aGUgYGhhc2hgIGF0dHJpYnV0ZS4gVGhhdFxuICAvLyBmZWF0dXJlIGlzIG5vdCB1c2VkIGluIE51Y2xpZGUgYW5kIGlzIGluc3RlYWQgdHJlYXRlZCBhcyBwYXJ0IG9mIHRoZSBwYXRobmFtZS5cbiAgaWYgKHBhcnNlZFVyaS5oYXNoICE9IG51bGwpIHtcbiAgICBwYXRobmFtZSArPSBwYXJzZWRVcmkuaGFzaDtcbiAgfVxuXG4gIC8vIEV4cGxpY2l0bHkgY29weWluZyBvYmplY3QgcHJvcGVydGllcyBhcHBlYXNlcyBGbG93J3MgXCJtYXliZVwiIHR5cGUgaGFuZGxpbmcuIFVzaW5nIHRoZSBgLi4uYFxuICAvLyBvcGVyYXRvciBjYXVzZXMgbnVsbC91bmRlZmluZWQgZXJyb3JzLCBhbmQgYE9iamVjdC5hc3NpZ25gIGJ5cGFzc2VzIHR5cGUgY2hlY2tpbmcuXG4gIHJldHVybiB7XG4gICAgYXV0aDogcGFyc2VkVXJpLmF1dGgsXG4gICAgaG9zdDogcGFyc2VkVXJpLmhvc3QsXG4gICAgaG9zdG5hbWU6IHBhcnNlZFVyaS5ob3N0bmFtZSxcbiAgICBocmVmOiBkZWNvZGVVUkkocGFyc2VkVXJpLmhyZWYpLFxuICAgIHBhdGg6IGRlY29kZVVSSShwYXRoKSxcbiAgICBwYXRobmFtZTogZGVjb2RlVVJJKHBhdGhuYW1lKSxcbiAgICBwb3J0OiBwYXJzZWRVcmkucG9ydCxcbiAgICBwcm90b2NvbDogcGFyc2VkVXJpLnByb3RvY29sLFxuICAgIHF1ZXJ5OiBwYXJzZWRVcmkucXVlcnksXG4gICAgc2VhcmNoOiBwYXJzZWRVcmkuc2VhcmNoLFxuICAgIHNsYXNoZXM6IHBhcnNlZFVyaS5zbGFzaGVzLFxuICB9O1xufVxuXG5mdW5jdGlvbiBwYXJzZVJlbW90ZVVyaShyZW1vdGVVcmk6IE51Y2xpZGVVcmkpOiBQYXJzZWRSZW1vdGVVcmwge1xuICBpZiAoIWlzUmVtb3RlKHJlbW90ZVVyaSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIHJlbW90ZSB1cmkuIEdvdCAnICsgcmVtb3RlVXJpKTtcbiAgfVxuICBjb25zdCBwYXJzZWRVcmkgPSBwYXJzZShyZW1vdGVVcmkpO1xuICBpbnZhcmlhbnQoXG4gICAgcGFyc2VkVXJpLmhvc3RuYW1lLFxuICAgIGBSZW1vdGUgTnVjbGlkZSBVUklzIG11c3QgY29udGFpbiBob3N0bmFtZXMsICcke3BhcnNlZFVyaS5ob3N0bmFtZX0nIGZvdW5kLmBcbiAgKTtcbiAgaW52YXJpYW50KFxuICAgIHBhcnNlZFVyaS5wb3J0LFxuICAgIGBSZW1vdGUgTnVjbGlkZSBVUklzIG11c3QgaGF2ZSBwb3J0IG51bWJlcnMsICcke3BhcnNlZFVyaS5wb3J0fScgZm91bmQuYFxuICApO1xuXG4gIC8vIEV4cGxpY2l0bHkgY29weWluZyBvYmplY3QgcHJvcGVydGllcyBhcHBlYXNlcyBGbG93J3MgXCJtYXliZVwiIHR5cGUgaGFuZGxpbmcuIFVzaW5nIHRoZSBgLi4uYFxuICAvLyBvcGVyYXRvciBjYXVzZXMgbnVsbC91bmRlZmluZWQgZXJyb3JzLCBhbmQgYE9iamVjdC5hc3NpZ25gIGJ5cGFzc2VzIHR5cGUgY2hlY2tpbmcuXG4gIHJldHVybiB7XG4gICAgYXV0aDogcGFyc2VkVXJpLmF1dGgsXG4gICAgaG9zdDogcGFyc2VkVXJpLmhvc3QsXG4gICAgaG9zdG5hbWU6IHBhcnNlZFVyaS5ob3N0bmFtZSxcbiAgICBocmVmOiBwYXJzZWRVcmkuaHJlZixcbiAgICBwYXRoOiBwYXJzZWRVcmkucGF0aCxcbiAgICBwYXRobmFtZTogcGFyc2VkVXJpLnBhdGhuYW1lLFxuICAgIHBvcnQ6IHBhcnNlZFVyaS5wb3J0LFxuICAgIHByb3RvY29sOiBwYXJzZWRVcmkucHJvdG9jb2wsXG4gICAgcXVlcnk6IHBhcnNlZFVyaS5xdWVyeSxcbiAgICBzZWFyY2g6IHBhcnNlZFVyaS5zZWFyY2gsXG4gICAgc2xhc2hlczogcGFyc2VkVXJpLnNsYXNoZXMsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldFBhdGgodXJpOiBOdWNsaWRlVXJpKTogc3RyaW5nIHtcbiAgcmV0dXJuIHBhcnNlKHVyaSkucGF0aDtcbn1cblxuZnVuY3Rpb24gZ2V0SG9zdG5hbWUocmVtb3RlVXJpOiBOdWNsaWRlVXJpKTogc3RyaW5nIHtcbiAgcmV0dXJuIHBhcnNlUmVtb3RlVXJpKHJlbW90ZVVyaSkuaG9zdG5hbWU7XG59XG5cbmZ1bmN0aW9uIGdldFBvcnQocmVtb3RlVXJpOiBOdWNsaWRlVXJpKTogbnVtYmVyIHtcbiAgcmV0dXJuIE51bWJlcihwYXJzZVJlbW90ZVVyaShyZW1vdGVVcmkpLnBvcnQpO1xufVxuXG5mdW5jdGlvbiBqb2luKHVyaTogTnVjbGlkZVVyaSwgLi4ucmVsYXRpdmVQYXRoOiBBcnJheTxzdHJpbmc+KTogTnVjbGlkZVVyaSB7XG4gIGlmIChpc1JlbW90ZSh1cmkpKSB7XG4gICAgY29uc3Qge2hvc3RuYW1lLCBwb3J0LCBwYXRofSA9IHBhcnNlUmVtb3RlVXJpKHVyaSk7XG4gICAgcmVsYXRpdmVQYXRoLnNwbGljZSgwLCAwLCBwYXRoKTtcbiAgICByZXR1cm4gY3JlYXRlUmVtb3RlVXJpKFxuICAgICAgaG9zdG5hbWUsXG4gICAgICBOdW1iZXIocG9ydCksXG4gICAgICBwYXRoUGFja2FnZS5qb2luLmFwcGx5KG51bGwsIHJlbGF0aXZlUGF0aCkpO1xuICB9IGVsc2Uge1xuICAgIHJlbGF0aXZlUGF0aC5zcGxpY2UoMCwgMCwgdXJpKTtcbiAgICByZXR1cm4gcGF0aFBhY2thZ2Uuam9pbi5hcHBseShudWxsLCByZWxhdGl2ZVBhdGgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZSh1cmk6IE51Y2xpZGVVcmkpOiBOdWNsaWRlVXJpIHtcbiAgaWYgKGlzUmVtb3RlKHVyaSkpIHtcbiAgICBjb25zdCB7aG9zdG5hbWUsIHBvcnQsIHBhdGh9ID0gcGFyc2VSZW1vdGVVcmkodXJpKTtcbiAgICByZXR1cm4gY3JlYXRlUmVtb3RlVXJpKFxuICAgICAgaG9zdG5hbWUsXG4gICAgICBOdW1iZXIocG9ydCksXG4gICAgICBwYXRoUGFja2FnZS5ub3JtYWxpemUocGF0aClcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBwYXRoUGFja2FnZS5ub3JtYWxpemUodXJpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRQYXJlbnQodXJpOiBOdWNsaWRlVXJpKTogTnVjbGlkZVVyaSB7XG4gIC8vIFRPRE86IElzIHRoaXMgZGlmZmVyZW50IHRoYW4gZGlybmFtZT9cbiAgcmV0dXJuIG5vcm1hbGl6ZShqb2luKHVyaSwgJy4uJykpO1xufVxuXG5mdW5jdGlvbiByZWxhdGl2ZSh1cmk6IE51Y2xpZGVVcmksIG90aGVyOiBOdWNsaWRlVXJpKTogc3RyaW5nIHtcbiAgY29uc3QgcmVtb3RlID0gaXNSZW1vdGUodXJpKTtcbiAgaWYgKHJlbW90ZSAhPT0gaXNSZW1vdGUob3RoZXIpIHx8XG4gICAgICAocmVtb3RlICYmIGdldEhvc3RuYW1lKHVyaSkgIT09IGdldEhvc3RuYW1lKG90aGVyKSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCByZWxhdGl2ZSB1cmxzIG9uIGRpZmZlcmVudCBob3N0cy4nKTtcbiAgfVxuICBpZiAocmVtb3RlKSB7XG4gICAgcmV0dXJuIHBhdGhQYWNrYWdlLnJlbGF0aXZlKGdldFBhdGgodXJpKSwgZ2V0UGF0aChvdGhlcikpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBwYXRoUGFja2FnZS5yZWxhdGl2ZSh1cmksIG90aGVyKTtcbiAgfVxufVxuXG4vLyBUT0RPOiBBZGQgb3B0aW9uYWwgZXh0IHBhcmFtZXRlclxuZnVuY3Rpb24gYmFzZW5hbWUodXJpOiBOdWNsaWRlVXJpKTogTnVjbGlkZVVyaSB7XG4gIGlmIChpc1JlbW90ZSh1cmkpKSB7XG4gICAgcmV0dXJuIHBhdGhQYWNrYWdlLmJhc2VuYW1lKGdldFBhdGgodXJpKSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHBhdGhQYWNrYWdlLmJhc2VuYW1lKHVyaSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGlybmFtZSh1cmk6IE51Y2xpZGVVcmkpOiBOdWNsaWRlVXJpIHtcbiAgaWYgKGlzUmVtb3RlKHVyaSkpIHtcbiAgICBjb25zdCB7aG9zdG5hbWUsIHBvcnQsIHBhdGh9ID0gcGFyc2VSZW1vdGVVcmkodXJpKTtcbiAgICByZXR1cm4gY3JlYXRlUmVtb3RlVXJpKFxuICAgICAgaG9zdG5hbWUsXG4gICAgICBOdW1iZXIocG9ydCksXG4gICAgICBwYXRoUGFja2FnZS5kaXJuYW1lKHBhdGgpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcGF0aFBhY2thZ2UuZGlybmFtZSh1cmkpO1xuICB9XG59XG5cbi8qKlxuICogdXJpIGlzIGVpdGhlciBhIGZpbGU6IHVyaSwgb3IgYSBudWNsaWRlOiB1cmkuXG4gKiBtdXN0IGNvbnZlcnQgZmlsZTogdXJpJ3MgdG8ganVzdCBhIHBhdGggZm9yIGF0b20uXG4gKlxuICogUmV0dXJucyBudWxsIGlmIG5vdCBhIHZhbGlkIGZpbGU6IFVSSS5cbiAqL1xuZnVuY3Rpb24gdXJpVG9OdWNsaWRlVXJpKHVyaTogc3RyaW5nKTogP3N0cmluZyB7XG4gIGNvbnN0IHVybFBhcnRzID0gcmVxdWlyZSgndXJsJykucGFyc2UodXJpLCBmYWxzZSk7XG4gIGlmICh1cmxQYXJ0cy5wcm90b2NvbCA9PT0gJ2ZpbGU6JyAmJiB1cmxQYXJ0cy5wYXRoKSB7IC8vIG9ubHkgaGFuZGxlIHJlYWwgZmlsZXMgZm9yIG5vdy5cbiAgICByZXR1cm4gdXJsUGFydHMucGF0aDtcbiAgfSBlbHNlIGlmIChpc1JlbW90ZSh1cmkpKSB7XG4gICAgcmV0dXJuIHVyaTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIENvbnZlcnRzIGxvY2FsIHBhdGhzIHRvIGZpbGU6IFVSSSdzLiBMZWF2ZXMgcmVtb3RlIFVSSSdzIGFsb25lLlxuICovXG5mdW5jdGlvbiBudWNsaWRlVXJpVG9VcmkodXJpOiBOdWNsaWRlVXJpKTogc3RyaW5nIHtcbiAgaWYgKGlzUmVtb3RlKHVyaSkpIHtcbiAgICByZXR1cm4gdXJpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAnZmlsZTovLycgKyB1cmk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGJhc2VuYW1lLFxuICBkaXJuYW1lLFxuICBpc1JlbW90ZSxcbiAgaXNMb2NhbCxcbiAgY3JlYXRlUmVtb3RlVXJpLFxuICBwYXJzZSxcbiAgcGFyc2VSZW1vdGVVcmksXG4gIGdldFBhdGgsXG4gIGdldEhvc3RuYW1lLFxuICBnZXRQb3J0LFxuICBqb2luLFxuICByZWxhdGl2ZSxcbiAgbm9ybWFsaXplLFxuICBnZXRQYXJlbnQsXG4gIHVyaVRvTnVjbGlkZVVyaSxcbiAgbnVjbGlkZVVyaVRvVXJpLFxufTtcbiJdfQ==