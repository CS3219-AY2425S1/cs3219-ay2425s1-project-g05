/**
 * Adapted from https://github.com/yjs/y-websocket/blob/master/bin/utils.cjs
 */
import { Doc, encodeStateAsUpdate, applyUpdate } from 'yjs';
import { writeUpdate, readSyncMessage, writeSyncStep1 } from 'y-protocols/sync';
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
  removeAwarenessStates,
} from 'y-protocols/awareness';
import {
  createEncoder,
  writeVarUint,
  toUint8Array,
  writeVarUint8Array,
  length,
} from 'lib0/encoding';
import { createDecoder, readVarUint, readVarUint8Array } from 'lib0/decoding';
import { setIfUndefined } from 'lib0/map';
import debounce from 'lodash.debounce';
import { config } from 'dotenv';

import { callbackHandler, isCallbackSet } from './callback.js';
import LocalClient from '../session/client.js';

// get the env vars
config();

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
      const newUpdates = encodeStateAsUpdate(ydoc);
      ldb.storeUpdate(docName, newUpdates);
      applyUpdate(ydoc, encodeStateAsUpdate(persistedYdoc));
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
const setPersistence = (persistence_) => {
  persistence = persistence_;
};

/**
 * @return {null|{bindState: function(string,WSSharedDoc):void,
 * writeState:function(string,WSSharedDoc):Promise<any>}|null} used persistence layer
 */
const getPersistence = () => persistence;

/**
 * To export for others to use
 * @type {Map<string,WSSharedDoc>}
 */
const docs = new Map();

/**
 * To export to allow others to see the set of deleted rooms
 */
const deleted = new Set();

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
  const encoder = createEncoder();
  writeVarUint(encoder, messageSync);
  writeUpdate(encoder, update);
  const message = toUint8Array(encoder);
  doc.conns.forEach((_, conn) => send(doc, conn, message));
};

/**
 * @type {(ydoc: Doc) => Promise<void>}
 */
let contentInitializor = (_ydoc) => Promise.resolve();

/**
 * This function is called once every time a Yjs document is created. You can
 * use it to pull data from an external source or initialize content.
 *
 * @param {(ydoc: Doc) => Promise<void>} f
 */
const setContentInitializor = (f) => {
  contentInitializor = f;
};

class WSSharedDoc extends Doc {
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
     * @type {Awareness}
     */
    this.awareness = new Awareness(this);
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
      const encoder = createEncoder();
      writeVarUint(encoder, messageAwareness);
      writeVarUint8Array(
        encoder,
        encodeAwarenessUpdate(this.awareness, changedClients)
      );

      const buff = toUint8Array(encoder);
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

/**
 * Gets a Y.Doc by name, whether in memory or on disk
 *
 * @param {string} docname - the name of the Y.Doc to find or create
 * @param {string} defaultQuestion - the default value/question to populate the editor with
 * @param {boolean} gc - whether to allow gc on the doc (applies only when created)
 * @return {WSSharedDoc}
 */
const getYDoc = (docname, defaultQuestion = '', userId = '', gc = true) =>
  setIfUndefined(docs, docname, () => {
    const doc = new WSSharedDoc(docname);
    const inititalText = doc.getText();
    inititalText.insert(0, defaultQuestion);

    doc.gc = gc;

    if (persistence !== null) {
      persistence.bindState(docname, doc);
    }

    docs.set(docname, doc);
    return doc;
  });

/**
 * @param {any} conn
 * @param {WSSharedDoc} doc
 * @param {Uint8Array} message
 */
const messageListener = (conn, doc, message) => {
  try {
    const encoder = createEncoder();
    const decoder = createDecoder(message);
    const messageType = readVarUint(decoder);
    switch (messageType) {
      case messageSync:
        writeVarUint(encoder, messageSync);
        readSyncMessage(decoder, encoder, doc, conn);

        // If the `encoder` only contains the type of reply message and no
        // message, there is no need to send the message. When `encoder` only
        // contains the type of reply, its length is 1.
        if (length(encoder) > 1) {
          send(doc, conn, toUint8Array(encoder));
        }
        break;
      case messageAwareness: {
        applyAwarenessUpdate(doc.awareness, readVarUint8Array(decoder), conn);
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
 * @param {string} userId UserId of user to close/remove
 * @param {any} conn
 */
const closeConn = (doc, userId, conn) => {
  console.log('State before CLOSING CONNECTION', LocalClient.getState());

  if (doc.conns.has(conn)) {
    /**
     * @type {Set<number>}
     */
    // @ts-ignore
    const controlledIds = doc.conns.get(conn);

    doc.conns.delete(conn);

    removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);

    // delete room
    LocalClient.delete(userId, doc.name);

    if (doc.conns.size === 0 && persistence !== null) {
      // if persisted, we store state and destroy ydocument
      persistence.writeState(doc.name, doc).then(() => {
        doc.destroy();
      });

      deleted.add(doc.name);
      LocalClient.removeQuestion(doc.name);
      docs.delete(doc.name);
    } else if (doc.conns.size === 0 && persistence === null) {
      // if the doc is in memory, delete it, do not persist it at all
      const currentDoc = docs.get(doc.name);
      try {
        deleted.add(doc.name);
        currentDoc.destroy();
        docs.delete(doc.name);
        LocalClient.removeQuestion(doc.name);
      } catch (err) {
        console.error('Cannot delete document');
      }
    }
  }

  console.log('State AFTER CLOSING CONNECTION', LocalClient.getState());
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
const setupWSConnection = (
  conn,
  req,
  { docName = (req.url || '').slice(1).split('?')[0], gc = true } = {}
) => {
  console.log('State BEFORE OPENING CONNECTION', LocalClient.getState());

  conn.binaryType = 'arraybuffer';
  // get the difficulties and categories
  // const { userId, splitResults } = getTemplateQuestion(req.url);
  const result = getTemplateQuestion(req.url);
  const question = result[0];
  const userId = result[1];

  let doc = null;

  if (question === null) {
    // if no extra params provided, then we can just ignore it
    doc = getYDoc(docName, gc);
  } else {
    try {
      doc = getYDoc(docName, question, gc);
      LocalClient.putQuestion(docName, question);
    } catch (err) {
      console.log('Error: ', err);
      throw new Error('Cannot find question');
    }
  }

  // get doc, initialize if it does not exist yet
  doc?.conns.set(conn, new Set());

  // add the user
  LocalClient.add(userId, doc.name);

  // listen and reply to events
  conn.on(
    'message',
    /** @param {ArrayBuffer} message */ (message) => {
      return messageListener(conn, doc, new Uint8Array(message));
    }
  );

  // Check if connection is still alive
  let pongReceived = true;

  const pingInterval = setInterval(async () => {
    if (!pongReceived) {
      if (doc.conns.has(conn)) {
        closeConn(doc, userId, conn);
      }
      clearInterval(pingInterval);
    } else if (doc.conns.has(conn)) {
      pongReceived = false;
      try {
        conn.ping();
      } catch (e) {
        closeConn(doc, userId, conn);
        clearInterval(pingInterval);
      }
    }
  }, pingTimeout);

  conn.on('close', async () => {
    closeConn(doc, userId, conn);
    clearInterval(pingInterval);
  });

  conn.on('pong', () => {
    pongReceived = true;
  });

  console.log('State AFTER OPENING CONNECTION', LocalClient.getState());

  // put the following in a variables in a block so the interval handlers don't keep in in
  // scope
  {
    // send sync step 1
    const encoder = createEncoder();
    writeVarUint(encoder, messageSync);
    writeSyncStep1(encoder, doc);
    send(doc, conn, toUint8Array(encoder));
    const awarenessStates = doc.awareness.getStates();
    if (awarenessStates.size > 0) {
      const encoder = createEncoder();
      writeVarUint(encoder, messageAwareness);
      writeVarUint8Array(
        encoder,
        encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys()))
      );
      send(doc, conn, toUint8Array(encoder));
    }
  }
};

const getTemplateQuestion = (url) => {
  // if url is empty or absent, there is nothing to split, return null
  if (
    url === null ||
    url === undefined ||
    typeof url !== 'string' ||
    url.length === 0
  ) {
    return null;
  }

  // decode to split properly
  url = decodeURIComponent(url);

  // use regex to get the correct component
  const userId = url.split('userId=')[1];
  const templateCode = url.split('templateCode=')[1].split('&userId=')[0];

  return [
    templateCode?.length == 0 ? null : templateCode,
    userId?.length == 0 ? 'defaultUser' : userId,
  ];
};

export {
  setPersistence,
  getPersistence,
  docs,
  setContentInitializor,
  WSSharedDoc,
  getYDoc,
  setupWSConnection,
  deleted,
};
