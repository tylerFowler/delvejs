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

module.exports = exports = Delve;

/**
  @class Delve
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

/**
  @name Delve#establishSocketConn
  @desc Switches the connection over to a socket
    Note that if the socket connection fails the whole program will crash,
    this is due to a bug in the json-rpc2 code that does not handle socket
    errors. It also cannot be caught because the crash happens before the
    socket object is returned back to us.
  @returns Promise<>
**/
Delve.prototype.establishSocketConn =
function establishSocketConn() {
  return this.rpcClient.connectSocketAsync()
  .then(conn => this.rpcClient = Promise.promisifyAll(conn));
};

/**
  @name Delve#_makeCall
  @private
  @desc Makes an RPC method call
  @param { String } method name
  @param { Object } args
  @param { Boolean } wrapError :default => true
  @returns Promise<?>
**/
Delve.prototype._makeCall =
function _makeCall(method, args, _wrapError) {
  let p = this.rpcClient.callAsync(`${this.methodPrefix}.${method}`, args);

  let wrapError = _wrapError || true;
  if (wrapError)
    p.catch(
      RPCError.ServerError, err => {
        throw new DelveError.DelveServerError(err);
      }
    );

  return p;
};

/**
  @name Delve#continueToNextBreakpoint
  @desc Continues to the next breakpoint, returning the new debugger state
  @returns Promise<DebuggerState> the new debugger state, possibly exited
  @throws DebuggerExited if the command goes past the lifecycle of the process
**/
Delve.prototype.continueToNextBreakpoint =
function continueToNextBreakpoint() {
  return this._makeCall('Command', {
    name: types.DebuggerCommands.continue
  })
  .then(state => {
    if (state.exited) throw new DelveError.DebuggerExited(state);
    return state;
  });
};

/**
  @name Delve#next
  @desc Goes to the next line in the source
  @returns Promise<DebuggerState>
**/
Delve.prototype.next =
function next() {
  return this._makeCall('Command', {
    name: types.DebuggerCommands.next
  });
};

/**
  @name Delve#step
  @desc Steps through the program execution
  @returns Promise<DebuggerState>
**/
Delve.prototype.step =
function step() {
  return this._makeCall('Command', {
    name: types.DebuggerCommands.step
  });
};

/**
  @name Delve#stepInstruction
  @desc Steps into the next instruction
  @returns Promise<DebuggerState>
**/
Delve.prototype.stepInstruction =
function stepInstruction() {
  return this._makeCall('Command', {
    name: types.DebuggerCommands.stepInstruction
  });
};

/**
  @name Delve#switchThread
  @desc Switches to the given thread if it exists
  @param { Number } threadID
  @returns Promise<DebuggerState>
**/
Delve.prototype.switchThread =
function switchThread(threadID) {
  return this._makeCall('Command', {
    name: types.DebuggerCommands.switchThread, threadID
  });
};

/**
  @name Delve#switchGoroutine
  @desc Switches to the given goroutine if it exists
  @param { Number } goroutineID
  @returns Promise<DebuggerState>
**/
Delve.prototype.switchGoroutine =
function switchGoroutine(goroutineID) {
  return this._makeCall('Command', {
    name: types.DebuggerCommands.switchGoroutine, goroutineID
  });
};

/**
  @name Delve#halt
  @desc Halts execution
  @returns Promise<DebuggerState>
**/
Delve.prototype.halt =
function halt() {
  return this._makeCall('Command', { name: types.DebuggerCommands.halt });
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
  @name Delve#restartProcess
  @desc Restarts the process if it can, fails if Delve did not start the process
  @returns Promise<>
**/
Delve.prototype.restartProcess =
function restartProcess() {
  return this._makeCall('Restart');
};

/**
  @name Delve#detachProcess
  @desc Detaches debugger from the current process, optionally killing it
  @param { Boolean } kill :default => false
  @returns Promise<Number> returns the result code
**/
Delve.prototype.detachProcess =
function detachProcess(kill) {
  return this._makeCall('Detach', kill || false);
};

/**
  @name Delve#stacktrace
  @desc Gets a stack trace for a goroutine along with it's locals & args
  @param { Number } goroutineId
  @param { Number } depth
  @param { Boolean } full
  @returns Promise<Stackframe>
**/
Delve.prototype.stacktrace =
function stacktrace(goroutineId, depth, full) {
  return this._makeCall('StacktraceGoroutine', {
    Id: goroutineId, Depth: depth, Full: full
  });
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
  return this._makeCall('FindLocation', {Scope, Loc: locationArgs}, false)
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
  );
};

Delve.prototype.clearBreakpointById =
function clearBreakpointById(id) {
  return this._makeCall('ClearBreakpoint', id);
};

Delve.prototype.clearBreakpointByName =
function clearBreakpointByName(name) {
  return this._makeCall('ClearBreakpointByName', name);
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
  return this._makeCall('EvalSymbol', {Scope, 'Symbol': symbol});
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
  return this._makeCall('SetSymbol', {Scope, 'Symbol': symbol, Value: value});
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
  });
};

Delve.prototype.getDebuggerState =
function getDebuggerState() {
  return this._makeCall('State');
};

Delve.prototype.getPid =
function getPid() {
  return this._makeCall('ProcessPid');
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
  return this._makeCall('GetThread', id);
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

  return p;
};

Delve.prototype.getRegisters =
function getRegisters() {
  return this._makeCall('ListRegisters');
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
  return this._makeCall('ListLocalVars', scope);
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
  return this._makeCall('ListFunctionArgs', scope);
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
  .then(bp => types.Breakpoint.decodeBreakpoint(bp), false)
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
  .then(bp => types.Breakpoint.decodeBreakpoint(bp), false)
  .catch(() => null);
};

Delve.prototype.getSources =
function getSources(filter) {
  return this._makeCall('ListSources', filter || '');
};

Delve.prototype.getFunctions =
function getFunctions(filter) {
  return this._makeCall('ListFunctions', filter || '');
};

Delve.prototype.getTypes =
function getTypes(filter) {
  return this._makeCall('ListTypes', filter || '');
};

Delve.prototype.getGoroutines =
function getGoroutines() {
  return this._makeCall('ListGoroutines');
};
