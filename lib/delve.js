/**
  Delve Client
  @description main class for the Delve client, provides an interface to
    communicate with a Delve JSON-RPC server and perform actions
  @author tylerFowler
**/
'use strict';

const Promise = require('bluebird');
const RPC     = require('node-json-rpc');
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

    let client = new RPC.Client({host, port});
    this.rpcClient = Promise.promisifyAll(client);
    this.Type = types;
  }
}

module.exports = exports = Delve;
