/**
 * Adapted from https://github.com/yjs/y-websocket/blob/master/bin/utils.cjs
 */
const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const axios = require('axios');

const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');
const map = require('lib0/map');

const debounce = require('lodash.debounce');

const callbackHandler = require('./callback.cjs').callbackHandler;
const isCallbackSet = require('./callback.cjs').isCallbackSet;

const config = require('dotenv');

// get the env vars
config.config();

const CALLBACK_DEBOUNCE_WAIT = parseInt(
  process.env.CALLBACK_DEBOUNCE_WAIT || '2000'
);
const CALLBACK_DEBOUNCE_MAXWAIT = parseInt(
  process.env.CALLBACK_DEBOUNCE_MAXWAIT || '10000'
);

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
const wsReadyStateClosing = 2; // eslint-disable-line
const wsReadyStateClosed = 3; // eslint-disable-line

// disable gc when using snapshots!
const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0';
const persistenceDir = process.env.YPERSISTENCE;
/**
 * @type {{bindState: function(string,WSSharedDoc):void, writeState:function(string,WSSharedDoc):Promise<any>, provider: any}|null}
 */
let persistence = null;
if (typeof persistenceDir === 'string') {
  console.info('Persisting documents to "' + persistenceDir + '"');
  // @ts-ignore
  const LeveldbPersistence = require('y-leveldb').LeveldbPersistence;
  const ldb = new LeveldbPersistence(persistenceDir);
  persistence = {
    provider: ldb,
    bindState: async (docName, ydoc) => {
      const persistedYdoc = await ldb.getYDoc(docName);
      const newUpdates = Y.encodeStateAsUpdate(ydoc);
      ldb.storeUpdate(docName, newUpdates);
      Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
      ydoc.on('update', (update) => {
        ldb.storeUpdate(docName, update);
      });
    },
    writeState: async (_docName, _ydoc) => {},
  };
}

/**
 * @param {{bindState: function(string,WSSharedDoc):void,
 * writeState:function(string,WSSharedDoc):Promise<any>,provider:any}|null} persistence_
 */
exports.setPersistence = (persistence_) => {
  persistence = persistence_;
};

/**
 * @return {null|{bindState: function(string,WSSharedDoc):void,
 * writeState:function(string,WSSharedDoc):Promise<any>}|null} used persistence layer
 */
exports.getPersistence = () => persistence;

/**
 * @type {Map<string,WSSharedDoc>}
 */
const docs = new Map();
// exporting docs so that others can use it
exports.docs = docs;

const messageSync = 0;
const messageAwareness = 1;
// const messageAuth = 2

/**
 * @param {Uint8Array} update
 * @param {any} _origin
 * @param {WSSharedDoc} doc
 * @param {any} _tr
 */
const updateHandler = (update, _origin, doc, _tr) => {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeUpdate(encoder, update);
  const message = encoding.toUint8Array(encoder);
  doc.conns.forEach((_, conn) => send(doc, conn, message));
};

/**
 * @type {(ydoc: Y.Doc) => Promise<void>}
 */
let contentInitializor = (_ydoc) => Promise.resolve();

/**
 * This function is called once every time a Yjs document is created. You can
 * use it to pull data from an external source or initialize content.
 *
 * @param {(ydoc: Y.Doc) => Promise<void>} f
 */
exports.setContentInitializor = (f) => {
  contentInitializor = f;
};

class WSSharedDoc extends Y.Doc {
  /**
   * @param {string} name
   */
  constructor(name) {
    super({ gc: gcEnabled });
    this.name = name;

    /**
     * Maps from conn to set of controlled user ids. Delete all user ids from awareness when this conn is closed
     * @type {Map<Object, Set<number>>}
     */
    this.conns = new Map();

    /**
     * @type {awarenessProtocol.Awareness}
     */
    this.awareness = new awarenessProtocol.Awareness(this);
    this.awareness.setLocalState(null);

    /**
     * @param {{ added: Array<number>, updated: Array<number>, removed: Array<number> }} changes
     * @param {Object | null} conn Origin is the connection that made the change
     */
    const awarenessChangeHandler = ({ added, updated, removed }, conn) => {
      const changedClients = added.concat(updated, removed);
      if (conn !== null) {
        const connControlledIDs = /** @type {Set<number>} */ (
          this.conns.get(conn)
        );
        if (connControlledIDs !== undefined) {
          added.forEach((clientID) => {
            connControlledIDs.add(clientID);
          });
          removed.forEach((clientID) => {
            connControlledIDs.delete(clientID);
          });
        }
      }

      // broadcast awareness update
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      );

      const buff = encoding.toUint8Array(encoder);
      this.conns.forEach((_, c) => {
        send(this, c, buff);
      });
    };

    this.awareness.on('update', awarenessChangeHandler);
    this.on('update', /** @type {any} */ (updateHandler));

    if (isCallbackSet) {
      this.on(
        'update',
        /** @type {any} */ (
          debounce(callbackHandler, CALLBACK_DEBOUNCE_WAIT, {
            maxWait: CALLBACK_DEBOUNCE_MAXWAIT,
          })
        )
      );
    }

    this.whenInitialized = contentInitializor(this);
  }
}

exports.WSSharedDoc = WSSharedDoc;

/**
 * Gets a Y.Doc by name, whether in memory or on disk
 *
 * @param {string} docname - the name of the Y.Doc to find or create
 * @param {string} defaultQuestion - the default value/question to populate the editor with
 * @param {boolean} gc - whether to allow gc on the doc (applies only when created)
 * @return {WSSharedDoc}
 */
const getYDoc = (docname, defaultQuestion = '', gc = true) =>
  map.setIfUndefined(docs, docname, () => {
    console.log(defaultQuestion);
    const doc = new WSSharedDoc(docname);
    const inititalText = doc.getText();
    inititalText.insert(0, defaultQuestion);
    console.log('HELLO> ', inititalText);

    inititalText.observe((event) => {
      console.log(event);
    });

    doc.gc = gc;

    if (persistence !== null) {
      persistence.bindState(docname, doc);
    }

    docs.set(docname, doc);
    return doc;
  });

exports.getYDoc = getYDoc;

/**
 * @param {any} conn
 * @param {WSSharedDoc} doc
 * @param {Uint8Array} message
 */
const messageListener = (conn, doc, message) => {
  try {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);
    switch (messageType) {
      case messageSync:
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn);

        // If the `encoder` only contains the type of reply message and no
        // message, there is no need to send the message. When `encoder` only
        // contains the type of reply, its length is 1.
        if (encoding.length(encoder) > 1) {
          send(doc, conn, encoding.toUint8Array(encoder));
        }
        break;
      case messageAwareness: {
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          decoding.readVarUint8Array(decoder),
          conn
        );
        break;
      }
    }
  } catch (err) {
    console.error(err);
    // @ts-ignore
    doc.emit('error', [err]);
  }
};

/**
 * @param {WSSharedDoc} doc
 * @param {any} conn
 */
const closeConn = (doc, conn) => {
  if (doc.conns.has(conn)) {
    /**
     * @type {Set<number>}
     */
    // @ts-ignore
    const controlledIds = doc.conns.get(conn);
    doc.conns.delete(conn);
    awarenessProtocol.removeAwarenessStates(
      doc.awareness,
      Array.from(controlledIds),
      null
    );

    if (doc.conns.size === 0 && persistence !== null) {
      // if persisted, we store state and destroy ydocument
      persistence.writeState(doc.name, doc).then(() => {
        doc.destroy();
      });

      docs.delete(doc.name);
    } else if (doc.conns.size === 0 && persistence === null) {
      // if the doc is in memory, delete it, do not persist it at all
      const currentDoc = docs.get(doc.name);
      try {
        currentDoc.destroy();
        docs.delete(doc.name);
      } catch (err) {
        console.error('Cannot delete document');
      }
    }
  }

  conn.close();
};

/**
 * @param {WSSharedDoc} doc
 * @param {import('ws').WebSocket} conn
 * @param {Uint8Array} m
 */
const send = (doc, conn, m) => {
  if (
    conn.readyState !== wsReadyStateConnecting &&
    conn.readyState !== wsReadyStateOpen
  ) {
    closeConn(doc, conn);
  }
  try {
    conn.send(m, {}, (err) => {
      err != null && closeConn(doc, conn);
    });
  } catch (e) {
    closeConn(doc, conn);
  }
};

const pingTimeout = 30000;

/**
 * @param {import('ws').WebSocket} conn
 * @param {import('http').IncomingMessage} req
 * @param {any} opts
 */
exports.setupWSConnection = async (
  conn,
  req,
  { docName = (req.url || '').slice(1).split('?')[0], gc = true } = {}
) => {
  conn.binaryType = 'arraybuffer';
z
  // get the difficulties and categories
  const splitResults = urlSplitter(req.url);

  let doc = null;

  if (splitResults === null) {
    // if no extra params provided, then we can just ignore it
    doc = getYDoc(docName, gc);
  } else {
    // otherwise, question service here to get a random question
    try {
      const results = await axios.get(
        `${
          process.env.QUESTION_SERVICE_ENDPOINT ??
          'http://localhost:8003/api/question-service/random'
        }${splitResults}`
      );

      const question = results.data['data']['question']['templateCode'];
      doc = getYDoc(docName, question, gc);
    } catch (err) {
      console.log('Error: ', err);
      throw new Error('Cannot find question');
    }
  }

  // get doc, initialize if it does not exist yet
  doc?.conns.set(conn, new Set());

  // listen and reply to events
  conn.on(
    'message',
    /** @param {ArrayBuffer} message */ (message) => {
      return messageListener(conn, doc, new Uint8Array(message));
    }
  );

  // Check if connection is still alive
  let pongReceived = true;

  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      if (doc.conns.has(conn)) {
        closeConn(doc, conn);
      }
      clearInterval(pingInterval);
    } else if (doc.conns.has(conn)) {
      pongReceived = false;
      try {
        conn.ping();
      } catch (e) {
        closeConn(doc, conn);
        clearInterval(pingInterval);
      }
    }
  }, pingTimeout);

  conn.on('close', () => {
    console.log('Connection Terminated');
    closeConn(doc, conn);
    clearInterval(pingInterval);
  });

  conn.on('pong', () => {
    pongReceived = true;
  });

  // put the following in a variables in a block so the interval handlers don't keep in in
  // scope
  {
    // send sync step 1
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    send(doc, conn, encoding.toUint8Array(encoder));
    const awarenessStates = doc.awareness.getStates();
    if (awarenessStates.size > 0) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(
          doc.awareness,
          Array.from(awarenessStates.keys())
        )
      );
      send(doc, conn, encoding.toUint8Array(encoder));
    }
  }
};

exports.retrieveQuestion = () => {};

const urlSplitter = (url) => {
  // if url is empty or absent, there is nothing to split, return null
  if (
    url === null ||
    url === undefined ||
    typeof url !== 'string' ||
    url.length === 0
  ) {
    return null;
  }

  // remove url splits that result in empty strings
  url = decodeURIComponent(url);
  const splitUrl = url.split(/[&|?|/]/).filter((val, x, y) => val.length > 0);

  let returnString = [];

  // iterate through the url entries and populate accordingly
  for (const urlEntry of splitUrl) {
    if (urlEntry.startsWith('category')) {
      const categories = urlEntry.split('=')[1].split(',');

      for (const category of categories) {
        if (returnString.length === 0) {
          returnString.push(`?topics[]=${category}`);
        } else {
          returnString.push(`&topics[]=${category}`);
        }
      }
    } else if (urlEntry.startsWith('difficulty')) {
      const difficulties = urlEntry.split('=')[1].split(',');

      for (const category of difficulties) {
        if (returnString.length === 0) {
          returnString.push(`?difficulty[]=${category}`);
        } else {
          returnString.push(`&difficulty[]=${category}`);
        }
      }
    }
  }

  if (returnString.length === 0) {
    return null;
  }

  return returnString.join('');
};
