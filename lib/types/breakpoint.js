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
let Breakpoint = exports.Breakpoint = function Breakpoint(bp) {
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
      continue: bp.continue,
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
