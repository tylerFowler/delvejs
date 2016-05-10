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

    this.name = `${DelveErr}BaseError`;
  }
}
error.BaseError = BaseError;

/**
  @class DelveServerError
  @desc Thrown when the Delve RPC API gives back an error, acts as a wrapper
    for issues that arise within Delve rather than the library
**/
class DelveServerError extends BaseError {
  constructor(err) {
    super(`Delve reported error: ${err}`);
    this.error = err;
    this.name = `${DelveErr}ServerError`;
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
    super(`Location invalid: ${err.toString()}`);
    this.error = err;
    this.name = `${DelveErr}MalformedLocationError`;
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
    this.name = `${DelveErr}MalformedBreakpointError`;
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

    this.exitStatus = state.exitStatus;
    this.lastKnownState = state;
    this.name = `${DelveErr}DebuggerExited`;
  }
}
error.DebuggerExited = DebuggerExited;
