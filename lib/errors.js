/**
  Delve Client Errors
  @description Custom errors for the Delve client, many of which wrap special
    errors that can be given by Delve itself
  @author tylerFowler
**/
'use strict';

let error = module.exports = {};

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

    this.setName('DelveConnError');
  }
}
error.DelveConnError = DelveConnError;

class MalformedBreakpointError extends BaseError {
  constructor(ogErr) {
    let msg = `Error creating breakpoint: ${ogErr}`;
    super(msg);

    this.parseError = ogErr;
    this.setName('MalformedBreakpointError');
  }
}
error.MalformedBreakpointError = MalformedBreakpointError;
