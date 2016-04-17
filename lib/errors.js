/**
  Delve Client Errors
  @description Custom errors for the Delve client, many of which wrap special
    errors that can be given by Delve itself
  @author tylerFowler
**/
'use strict';

let error = module.exports = {};

const DelveErr = 'DelveError';

/**
  @class BaseError
  @desc Provides the base for all custom errors, meant to be extended
**/
class BaseError extends Error {
  constructor(msg) {
    super(msg);

    if (Error.captureStackTrace)
      Error.captureStackTrace(this, this.constructor);

    this.setName('BaseError');
  }

  setName(v) { this.name = `${DelveErr}${v}`; }
}
error.BaseError = BaseError;

/**
  @class DelveConnError
  @desc Thrown when the RPC server connection cannot be established
**/
class DelveConnError extends BaseError {
  constructor(connInfo) {
    let msg = 'Could not reach Delve RPC Server at ' +
      `${connInfo.host}:${connInfo.port}`;

    super(msg);

    this.setName('ConnError');
  }
}
error.DelveConnError = DelveConnError;

/**
  @class DelveServerError
  @desc Thrown when the Delve RPC API gives back an error, acts as a wrapper
    for issues that arise within Delve rather than the library
**/
class DelveServerError extends BaseError {
  constructor(err) {
    super(`Delve reported error: ${err}`);
    this.error = err;
    this.setName('ServerError');
  }
}
error.DelveServerError = DelveServerError;

/**
  @class MalformedLocationError
  @desc Thrown when a given location is reported as invalid from Delve
  @param { String } locationArg
  @param { Error } err is the original error from the RPC client
**/
class MalformedLocationError extends BaseError {
  constructor(locationArg, err) {
    super(`Invalid location pattern: ${locationArg}`);
    this.error = err;
    this.setName('MalformedLocationError');
  }
}
error.MalformedLocationError = MalformedLocationError;

/**
  @class MalformedBreakpointError
  @desc Thrown when a breakpoint from the Delve server cannot be parsed
**/
class MalformedBreakpointError extends BaseError {
  constructor(ogErr) {
    let msg = `Error creating breakpoint: ${ogErr}`;
    super(msg);

    this.parseError = ogErr;
    this.setName('MalformedBreakpointError');
  }
}
error.MalformedBreakpointError = MalformedBreakpointError;

/**
  @class DebuggerExited
  @desc Thrown when the debugger has reported an exited state, usually after a
    continue command
  @param { DebuggerState } state
**/
class DebuggerExited extends BaseError {
  constructor(state) {
    super(`Process has exited with status ${state.exitStatus}`);

    this.lastKnownState = state;
    this.setName('DebuggerExited');
  }
}
error.DebuggerExited = DebuggerExited;
