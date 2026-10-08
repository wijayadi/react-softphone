// Injected into the browser before any page script runs.
//
// Replaces window.WebSocket with a fake that speaks just enough SIP for JsSIP
// to complete REGISTER and place a call, so the softphone can be exercised in
// e2e tests without a real SIP server / network.
//
// Captures everything the client sends on window.__sipSent so tests can assert
// the outgoing INVITE request URI.
(function () {
  var sent = [];
  window.__sipSent = sent;

  function headerOf(request, name) {
    var lines = request.split('\r\n');
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().indexOf(name.toLowerCase() + ':') === 0) {
        return lines[i];
      }
    }
    return '';
  }

  function buildResponse(statusLine, request, extra) {
    var via = headerOf(request, 'Via');
    var from = headerOf(request, 'From');
    var to = headerOf(request, 'To');
    if (to && !/;tag=/i.test(to)) {
      to += ';tag=sf' + Math.random().toString(36).slice(2, 8);
    }
    var callId = headerOf(request, 'Call-ID');
    var cseq = headerOf(request, 'CSeq');
    var contact = headerOf(request, 'Contact');
    var headers = [via, from, to, callId, cseq, contact].filter(Boolean);
    if (extra) {
      headers = headers.concat(extra);
    }
    headers.push('Content-Length: 0');
    return [statusLine].concat(headers).concat(['', '']).join('\r\n');
  }

  function FakeWebSocket(url, protocols) {
    this.url = url;
    this.protocol = Array.isArray(protocols) ? protocols[0] : protocols || '';
    this.readyState = 0;
    this.binaryType = 'blob';
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSING = 2;
    this.CLOSED = 3;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    this._listeners = {};
    window.__sipSocket = this;
    var self = this;
    setTimeout(function () {
      self.readyState = 1;
      var ev = { type: 'open' };
      if (self.onopen) self.onopen(ev);
      self._dispatch('open', ev);
    }, 5);
  }

  FakeWebSocket.CONNECTING = 0;
  FakeWebSocket.OPEN = 1;
  FakeWebSocket.CLOSING = 2;
  FakeWebSocket.CLOSED = 3;

  FakeWebSocket.prototype.addEventListener = function (type, cb) {
    (this._listeners[type] = this._listeners[type] || []).push(cb);
  };
  FakeWebSocket.prototype.removeEventListener = function (type, cb) {
    this._listeners[type] = (this._listeners[type] || []).filter(function (f) {
      return f !== cb;
    });
  };
  FakeWebSocket.prototype._dispatch = function (type, ev) {
    (this._listeners[type] || []).forEach(function (cb) {
      cb(ev);
    });
  };
  FakeWebSocket.prototype._deliver = function (text) {
    var ev = { type: 'message', data: text };
    if (this.onmessage) this.onmessage(ev);
    this._dispatch('message', ev);
  };
  FakeWebSocket.prototype.send = function (data) {
    var text = typeof data === 'string' ? data : String(data);
    sent.push(text);
    var requestLine = text.split('\r\n')[0] || '';
    var self = this;
    if (/^REGISTER /i.test(requestLine)) {
      setTimeout(function () {
        self._deliver(buildResponse('SIP/2.0 200 OK', text));
      }, 5);
    } else if (/^OPTIONS /i.test(requestLine)) {
      setTimeout(function () {
        self._deliver(buildResponse('SIP/2.0 200 OK', text));
      }, 5);
    } else if (/^INVITE /i.test(requestLine)) {
      var forcedStatus = window.__SOFTPHONE_TEST_INVITE_STATUS__;
      var statusLine = forcedStatus
        ? 'SIP/2.0 ' + forcedStatus
        : 'SIP/2.0 100 Trying';
      setTimeout(function () {
        self._deliver(buildResponse(statusLine, text));
      }, 5);
    } else if (/^(BYE|CANCEL) /i.test(requestLine)) {
      setTimeout(function () {
        self._deliver(buildResponse('SIP/2.0 200 OK', text));
      }, 5);
    }
  };
  FakeWebSocket.prototype.close = function () {
    this.readyState = 3;
    var ev = { type: 'close', wasClean: true, code: 1000, reason: '' };
    if (this.onclose) this.onclose(ev);
    this._dispatch('close', ev);
  };

  window.WebSocket = FakeWebSocket;

  // Optional: simulate a denied / unavailable microphone.
  if (window.__SOFTPHONE_TEST_FAIL_MEDIA__ && navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia = function () {
      var err = new Error('Permission denied');
      err.name = 'NotAllowedError';
      return Promise.reject(err);
    };
  }
})();
