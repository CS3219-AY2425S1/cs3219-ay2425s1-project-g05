import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';

import React, { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';

import './CodeEditor.module.css';

/**
 * Generate a random colour. Adapted from https://css-tricks.com/snippets/javascript/random-hex-color/
 */
function getColour() {
  return Math.floor(Math.random() * 16777215).toString(16);
}

/**
 * Adapted from https://github.com/yjs/yjs-demos/blob/main/monaco-react/src/App.tsx
 * @param endpoint String representing the endpoint websocket server to connect to
 * @param room String representing the room to join
 * @param user Username of the current user
 * @param height Height of the editor
 * @param defaultValue Default value to add into the editor
 * @param language Default language to enable code completion in the editor
 * @returns Monaco Editor component
 */
export default function CodeEditor({
  endpoint,
  room,
  name = 'user',
  height = '90vh',
  defaultValue = '# Write your code here',
  language = 'python',
}) {
  const doc = useMemo(() => new Y.Doc(), []);
  const [editor, setEditor] = useState(null);
  const [provider, setProvider] = useState(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [binding, setBinding] = useState(null);

  useEffect(() => {
    const provider = new WebsocketProvider(endpoint, room, doc);

    setProvider(provider);

    return () => {
      provider?.disconnect();
      provider?.destroy();
      doc.destroy();
    };
  }, [doc]);

  useEffect(() => {
    if (provider == null || editor == null) {
      return;
    }

    console.log('Provider connected: ', provider);

    const awareness = provider?.awareness;
    const colour = getColour();
    const user = name + colour;

    awareness.setLocalStateField('user', {
      name: user,
      color: `#${colour}`,
    });

    console.log('Awareness Set:', awareness);

    const binding = new MonacoBinding(
      doc.getText(),
      editor.getModel()!,
      new Set([editor]),
      awareness
    );

    setBinding(binding);

    return () => {
      binding.destroy();
    };
  }, [doc, provider, editor]);

  return (
    <Editor
      height={height}
      defaultValue={defaultValue}
      defaultLanguage={language}
      onMount={(editor) => {
        setEditor(editor);
      }}
    />
  );
}
