/**
  Delve Client
  @description main class for the Delve client, provides an interface to
    communicate with a Delve JSON-RPC server and perform actions
  @author tylerFowler
**/
'use strict';

const Promise = require('bluebird');
const RPC     = require('json-rpc2');
const types   = require('./types');

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
}

module.exports = exports = Delve;
