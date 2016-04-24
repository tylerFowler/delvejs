/**
  Delve API Type Classes
  @description provides structures around each type used by the Delve RPC Server
  @author tylerFowler
**/
'use strict';

var types;
module.exports = exports = types = {};

types.DebuggerCommands = {
  continue        : 'continue',
  step            : 'step',
  stepInstruction : 'stepInstruction',
  next            : 'next',
  halt            : 'halt',

  // Note that these two require that a threadId or goroutineId
  // be supplied in the request in addition to the command name
  switchThread    : 'switchThread',
  switchGoroutine : 'switchGoroutine'
};

types.Breakpoint = {};
/**
  @type Breakpoint
  @desc Converts a Delve breakpoint to a more friendly format
  @param { Object } bp a breakpoint in the format given by the Delve API
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
types.Breakpoint.decodeBreakpoint = function Breakpoint(bp) {
  try {
    let newBreakpoint = {
      id: bp.id,
      name: bp.name,
      location: {
        addr: bp.addr,
        file: bp.file,
        line: bp.line,
        functionName: bp.functionName || null,
        goroutine: bp.goroutine
      },
      condition: bp.Cond,
      continue: bp.continue,
      stacktrace: bp.stacktrace,
      variables: bp.variables || [],
      hitCount: bp.hitCount || [],
      totalHitCount: bp.totalHitCount || 0
    };

    return newBreakpoint;
  } catch (err) {
    throw new DelveError.MalformedBreakpointError(err);
  }
};

types.Scope = {
  makeScope: function makeScope(GoroutineID, Frame) {
    return { GoroutineID, Frame };
  }
};
