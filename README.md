Delvejs
========================

Provides a Node.js interface with a Delve debugger server using it's JSON-RPC API. Note that this library does *not* handle creating a delve process and managing it, only connecting to an existing server.

## Usage

Start a Delve debugging session in headless mode listening on a host & port:
```bash
$> dlv debug --headless=true --listen="localhost:8181"
```

To connect from an application:
```js
const Delve      = require('delve');
const DelveError = require('delve').Error;

// initialize a new Delve client
let delveClient = new Delve('localhost', 8181);

// switch over to a socket connection
delveClient.establishSocketConn()

// set a breakpoint
.then(() => delveClient.createBreakpoints('mybp', 'main.go:1')

// continue to the breakpoint
.then(() => delveClient.continueToNextBreakpoint())

// exit the debugging session, kill the debugger process too
.then(() => delveClient.detach(true))

// catch any Delve errors
.catch(DelveError.DelveServerError, err => console.error(err));
```

To see the full list of commands look at the source in [delve.js](./lib/delve.js). Note that with the exception of functions that return breakpoints many methods will return the data structures returned by the Delve JSON-RPC API verbatim, for a full list of types see the Delve API type definitions [here](https://github.com/derekparker/delve/blob/master/service/api/types.go).

#### TODO
- Write tests.. somehow
