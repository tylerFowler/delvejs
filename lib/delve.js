/**
  Delve Client
  @description main class for the Delve client, provides an interface to
    communicate with a Delve JSON-RPC server and perform actions
  @author tylerFowler
**/
'use strict';

const Promise    = require('bluebird');
const RPC        = require('json-rpc2');
const RPCError   = require('json-rpc2').Error;
const types      = require('./types');
const DelveError = require('./errors');

const wrapServerErr = err => { throw new DelveError.DelveServerError(err); };

class Delve {
  /**
    @name Delve
    @constructor
    @desc Initialize the connection to the Delve RPC server
    @param {String} host :default => 'localhost'
    @param {Number} port :default => 8181
  **/
  constructor(_host, _port) {
    let host = _host || 'localhost';
    let port = _port || 8181;

    let client = RPC.Client.$create(port, host);
    this.rpcClient = Promise.promisifyAll(client);
    this.Type = types;
  }

  /** === Breakpoint Methods === **/

  /**
    @name Delve#getBreakpoints()
    @desc Gets all breakpoints
    @returns { Promise<Breakpoint[]> }
  **/
  getBreakpoints() {
    return this.rpcClient.call('ListBreakpoints', null)
    // convert our breakpoints into Breakpoint objects
    .then(rawBreakpoints =>
      rawBreakpoints.map(bp => new types.Breakpoint(bp))
    );
  }

  /**
    @name Delve#getBreakpointById
    @desc Gets a specific breakpoint by the BreakpointId
    @returns { Promise<Breakpoint> }
    @returns { null } if breakpoint w/ id does not exist
  **/
  getBreakpointById(id) {
    return this.rpcClient.call('GetBreakpoint', id)
    .then(bp => new types.Breakpoint(bp))
    .catch(() => null);
  }

  /**
    @name Delve#getBreakpointByName
    @desc Gets a specific breakpoint by name
    @returns { Promise<Breakpoint> }
    @returns { null } if breakpoint w/ name does not exist
  **/
  getBreakpointByName(name) {
    return this.rpcClient.call('GetBreakpointByName', name)
    .then(bp => new types.Breakpoint(bp))
    .catch(() => null);
  }

  /**
    @name Delve#findLocationsForArgs
    @desc Finds all locations described by the given arg string, within the
      given scope if given
    @param { String } locationArgs is any string pattern Delve can use
    @param { Object } _scope :optional
    @returns { Promise<DelveLocation> }
  **/
  findLocationsForArgs(locationArgs, _scope) {
    let Scope = _scope || { Goroutine: -1, Frame: 0 };
    return this.rpcClient.call('FindLocation', {Scope, Loc: locationArgs})
    .catch(
      RPCError.ServerError,
      err => { throw new DelveError.MalformedLocationError(locationArgs, err); }
    );
  }

  /**
    @name Delve#createBreakpoints
    @desc Creates new breakpoints based on the location given,
      the location string can be anything accepted by Delve
    @param { String } name
    @param { String } locationStr
    @param { Bool   } _cont determines if this is a tracepoint or not :optional
    @returns Promise<[Breakpoint]>
  **/
  createBreakpoints(name, locationStr, _cont) {
    let cont = _cont || false;
    return this.findLocationsForArgs(locationStr)
    .map(location => this.rpcClient
      .call('CreateBreakpoint', { name, addr: location.pc, 'continue': cont })
      .then(createdBp => new types.Breakpoint(createdBp))
    )
    .catch(RPCError.ServerError, wrapServerErr);
  }

  clearBreakpointById(id) {
    return this.rpcClient.call('ClearBreakpoint', id)
    .catch(RPCError.ServerError, wrapServerErr);
  }

  clearBreakpointByName(name) {
    return this.rpcClient.call('ClearBreakpointByName', name)
    .catch(RPCError.ServerError, wrapServerErr);
  }

  getThreads() {
    return this.rpcClient.call('ListThreads');
  }

  /**
    @name Delve#getThread
    @desc Gets the thread with the given id
    @param { Number } id of the thread
    @returns Promise<Thread>
    @returns null if thread with the given wasn't found
  **/
  getThread(id) {
    return this.rpcClient.call('GetThread', id)
    .catch(RPCError.ServerError, () => null);
  }

  /**
    @name Delve#getPackageVars
    @desc Returns an array of package variables
    @param { String } filter pattern :optional
    @param { Number } threadId :optional
    @returns Promise<[Variable]>
  **/
  getPackageVars(filter, threadId) {
    var p;
    if (threadId) {
      let threadArgs = { Id: threadId, Filter: filter };
      p = this.rpcClient.call('ListThreadPackageVars', threadArgs);
    } else p = this.rpcClient.call('ListPackageVars', filter);

    return p.catch(RPCError.ServerError, wrapServerErr);
  }
}

module.exports = exports = Delve;
