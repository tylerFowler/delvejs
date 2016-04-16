/**
  Delve API Type Classes
  @description provides structures around each type used by the Delve RPC Server
  @author tylerFowler
**/
'use strict';

const DelveError = require('../errors');

// Types:
// - DebuggerState
// - DebuggerCommand
// - Breakpoint
// - BreakpointInfo
// - Thread
// - Location
// - Stackframe
// - Function
// - Variable
// - Goroutine
// - EvalScope

let types = module.exports = exports = {};
types.Breakpoint = require('./breakpoint').Breakpoint;

types.Scope = {
  makeScope: function makeScope(GoroutineID, Frame) {
    return { GoroutineID, Frame };
  }
};
