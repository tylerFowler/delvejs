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

/**
  @type Breakpoint
  @desc A Delve breakpoint
  @param { Object } bp a breakpoint in the format given in RPC
  @param { Number } bp.id
  @param { String } bp.name
  @param { Number } bp.addr memory address of the breakpoint
  @param { String } bp.file
  @param { Number } bp.line
  @param { String|Null } bp.functionName
  @param { Bool } bp.continue tracepoint flag
  @param { Bool } bp.goroutine
  @param { Number } bp.stacktrace # of stack frames to retrieve
  @param { String[] } bp.variables
  @param { Object } bp.hitCount { goroutineId: hitCount, ... }
  @param { Number } bp.totalHitCount
**/
let Breakpoint = function Breakpoint(bp) {
  try {
    let newBreakpoint = {
      id: bp.id,
      name: bp.name,
      addr: bp.addr,
      file: bp.file,
      line: bp.line,
      functionName: bp.functionName || null,
      continue: bp.continue,
      goroutine: bp.goroutine,
      stacktrace: bp.stacktrace,
      variables: bp.variables || [],
      hitCount: bp.hitCount || [],
      totalHitCount: bp.totalHitCount || 0
    };

    Object.assign(this, newBreakpoint);
  } catch (err) {
    throw new DelveError.MalformedBreakpointError(err);
  }
};
Breakpoint.prototype.validateName = function validateName(name) {
  if (parseInt(name, 10)) return false; // can't be a number
  return true;
};

types.Breakpoint = Breakpoint;
