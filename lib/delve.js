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

/**
  @name Delve
  @constructor
  @desc Initialize the connection to the Delve RPC server
  @param {String} host :default => 'localhost'
  @param {Number} port :default => 8181
**/
function Delve(_host, _port) {
  let host = _host || 'localhost';
  let port = _port || 8181;

  let client = RPC.Client.$create(port, host);
  this.rpcClient = Promise.promisifyAll(client);
  this.Type = types;
  this.methodPrefix = 'RPCServer';
}
module.exports = exports = Delve;

Delve.prototype.establishSocketConn =
function establishSocketConn() {
  return this.rpcClient.connectSocketAsync()
  .then(conn => this.rpcClient = Promise.promisifyAll(conn));
};

Delve.prototype._makeCall =
function _makeCall(method, arg) {
  return this.rpcClient.callAsync(`${this.methodPrefix}.${method}`, arg);
};

/**
  @name Delve#isAttachedToExistingProc
  @returns Promise<Boolean>
**/
Delve.prototype.isAttachedToExistingProc =
function isAttachedToExistingProc() {
  return this._makeCall('AttachedToExistingProcess');
};

/**
  @name Delve#findLocationsForArgs
  @desc Finds all locations described by the given arg string, within the
    given scope if given
  @param { String } locationArgs is any string pattern Delve can use
  @param { Object } _scope :optional
  @returns { Promise<DelveLocation> }
**/
Delve.prototype.findLocationsForArgs =
function findLocationsForArgs(locationArgs, _scope) {
  let Scope = _scope || types.Scope.makeScope(-1, 0);
  return this._makeCall('FindLocation', {Scope, Loc: locationArgs})
  .catch(
    RPCError.ServerError,
    err => { throw new DelveError.MalformedLocationError(locationArgs, err); }
  );
};

/**
  @name Delve#createBreakpoints
  @desc Creates new breakpoints based on the location given,
    the location string can be anything accepted by Delve
  @param { String } name
  @param { String } locationStr
  @param { Bool   } _cont determines if this is a tracepoint or not :optional
  @returns Promise<[Breakpoint]>
**/
Delve.prototype.createBreakpoints =
function createBreakpoints(name, locationStr, _cont) {
  let cont = _cont || false;
  return this.findLocationsForArgs(locationStr)
  .map(location => this._makeCall(
    'CreateBreakpoint', { name, addr: location.pc, 'continue': cont }
    )
    .then(createdBp => types.Breakpoint.decodeBreakpoint(createdBp))
  )
  .catch(RPCError.ServerError, wrapServerErr);
};

Delve.prototype.clearBreakpointById =
function clearBreakpointById(id) {
  return this._makeCall('ClearBreakpoint', id)
  .catch(RPCError.ServerError, wrapServerErr);
};

Delve.prototype.clearBreakpointByName =
function clearBreakpointByName(name) {
  return this._makeCall('ClearBreakpointByName', name)
  .catch(RPCError.ServerError, wrapServerErr);
};

/**
  @name Delve#evalSymbol
  @desc Evaluates the symbol with the given scope and returns the result
  @param { String } symbol
  @param { Number } goroutineId
  @param { Number } frameId
  @returns Promise<Variable> var data structure w/ the result of the expression
**/
Delve.prototype.evalSymbol =
function evalSymbol(symbol, goroutineId, frameId) {
  let Scope = types.Scope.makeScope(goroutineId, frameId);
  return this._makeCall('EvalSymbol', {Scope, 'Symbol': symbol})
  .catch(RPCError.ServerError, wrapServerErr);
};

/**
  @name Delve#setSymbol
  @desc Sets the symbol to the value within the given scope
  @param { String } symbol
  @param { String } val
  @param { Number } goroutineId
  @param { Number } frameId
  @returns Promise<>
**/
Delve.prototype.setSymbol =
function setSymbol(symbol, val, goroutineId, frameId) {
  let Scope = types.Scope.makeScope(goroutineId, frameId);
  return this._makeCall('SetSymbol', {Scope, 'Symbol': symbol, Value: value})
  .catch(RPCError.ServerError, wrapServerErr);
};

/**
  @name Delve#disassemble
  @desc Sends a disassemble request
  @param { Object } pcData
  @param { Number } pcData.start
  @param { Number } pcData.end
  @param { Object } scope
  @param { Number } scope.goroutineId
  @param { Number } scope.frameId
  @param { Number } flavor from Delve's AssemblyFlavour
  @returns Promise<AsmInstruction>
**/
Delve.prototype.disassemble =
function disassemble(pcData, scope, flavor) {
  let Scope = types.Scope.makeScope(scope.goroutineId, scope.frameId);
  return this._makeCall('Disassemble', {
    Scope, StartPC: pcData.start, EndPC: pcData.end, Flavour: flavor
  })
  .catch(RPCError.ServerError, wrapServerErr);
};

Delve.prototype.getThreads =
function getThreads() {
  return this._makeCall('ListThreads');
};

/**
  @name Delve#getThread
  @desc Gets the thread with the given id
  @param { Number } id of the thread
  @returns Promise<Thread>
  @returns null if thread with the given wasn't found
**/
Delve.prototype.getThread =
function getThread(id) {
  return this._makeCall('GetThread', id)
  .catch(RPCError.ServerError, () => null);
};

/**
  @name Delve#getPackageVars
  @desc Returns an array of package variables
  @param { String } filter pattern :optional
  @param { Number } threadId :optional
  @returns Promise<[Variable]>
**/
Delve.prototype.getPackageVars =
function getPackageVars(filter, threadId) {
  var p;
  if (threadId) {
    let threadArgs = { Id: threadId, Filter: filter };
    p = this._makeCall('ListThreadPackageVars', threadArgs);
  } else p = this._makeCall('ListPackageVars', filter);

  return p.catch(RPCError.ServerError, wrapServerErr);
};

Delve.prototype.getRegisters =
function getRegisters() {
  return this._makeCall('ListRegisters')
  .catch(RPCError.ServerError, wrapServerErr);
};

/**
  @name Delve#listLocalVars
  @desc Gets the local variables
  @param { Number } goroutineId
  @param { Number } frameId
  @returns Promise<[Variable]>
**/
Delve.prototype.listLocalVars =
function listLocalVars(goroutineId, frameId) {
  let scope = types.Scope.makeScope(goroutineId, frameId);
  return this._makeCall('ListLocalVars', scope)
  .catch(RPCError.ServerError, wrapServerErr);
};

/**
  @name Delve#listFunctionArgs
  @desc Gets the function arguments
  @param { Number } goroutineId
  @param { Number } frameId
  @returns Promise<[Variable]>
**/
Delve.prototype.listFunctionArgs =
function listFunctionArgs(goroutineId, frameId) {
  let scope = types.Scope.makeScope(goroutineId, frameId);
  return this._makeCall('ListFunctionArgs', scope)
  .catch(RPCError.ServerError, wrapServerErr);
};

/**
  @name Delve#getBreakpoints()
  @desc Gets all breakpoints
  @returns { Promise<Breakpoint[]> }
**/
Delve.prototype.getBreakpoints =
function getBreakpoints() {
  return this._makeCall('ListBreakpoints')
  // convert our breakpoints into Breakpoint objects
  .then(rawBreakpoints =>
    rawBreakpoints.map(bp => types.Breakpoint.decodeBreakpoint(bp))
  );
};

/**
  @name Delve#getBreakpointById
  @desc Gets a specific breakpoint by the BreakpointId
  @returns { Promise<Breakpoint> }
  @returns { null } if breakpoint w/ id does not exist
**/
Delve.prototype.getBreakpointById =
function getBreakpointById(id) {
  return this._makeCall('GetBreakpoint', id)
  .then(bp => types.Breakpoint.decodeBreakpoint(bp))
  .catch(() => null);
};

/**
  @name Delve#getBreakpointByName
  @desc Gets a specific breakpoint by name
  @returns { Promise<Breakpoint> }
  @returns { null } if breakpoint w/ name does not exist
**/
Delve.prototype.getBreakpointByName =
function getBreakpointByName(name) {
  return this._makeCall('GetBreakpointByName', name)
  .then(bp => types.Breakpoint.decodeBreakpoint(bp))
  .catch(() => null);
};

Delve.prototype.getSources =
function getSources(filter) {
  return this._makeCall('ListSources', filter || '')
  .catch(RPCError.ServerError, wrapServerErr);
};

Delve.prototype.getFunctions =
function getFunctions(filter) {
  return this._makeCall('ListFunctions', filter || '')
  .catch(RPCError.ServerError, wrapServerErr);
};

Delve.prototype.getTypes =
function getTypes(filter) {
  return this._makeCall('ListTypes', filter || '')
  .catch(RPCError.ServerError, wrapServerErr);
};

Delve.prototype.getGoroutines =
function getGoroutines() {
  return this._makeCall('ListGoroutines')
  .catch(RPCError.ServerError, wrapServerErr);
};
