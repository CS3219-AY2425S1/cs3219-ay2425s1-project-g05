import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';

import React, { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';

import './CollabCodeEditor.module.css';

/**
 * Generate a random colour. Adapted from https://css-tricks.com/snippets/javascript/random-hex-color/
 */
function getColour() {
  return Math.floor(Math.random() * 16777215).toString(16);
}

interface CodeEditorProps {
  endpoint: string;
  room: string;
  user: string;
  theme?: string;
  height?: string;
  defaultValue?: string;
  language?: string;
}

/**
 * Adapted from https://github.com/yjs/yjs-demos/blob/main/monaco-react/src/App.tsx
 * @param endpoint String representing the endpoint websocket server to connect to
 * @param room String representing the room to join
 * @param user Username of the current user
 * @param theme String representing theme to use for the editor, one of 'light' and 'vs-dark'
 * @param height Height of the editor
 * @param defaultValue Default template code
 * @param language Default language to enable code completion in the editor
 * @returns Monaco Editor component
 */
export default function CodeEditor({
  endpoint,
  room,
  user,
  theme = 'light',
  height = '90vh',
  defaultValue = '# Write your code here',
  language = 'python',
}: CodeEditorProps) {
  const doc = useMemo(() => new Y.Doc(), []);
  const [editor, setEditor] = useState(null);
  const [provider, setProvider] = useState(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [binding, setBinding] = useState(null);

  useEffect(() => {
    // create the params
    const params = {
      templateCode: defaultValue,
      userId: user
    };

    const provider = new WebsocketProvider(endpoint, room, doc, {
      params: params,
    });

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

    const awareness = provider?.awareness;
    const colour = getColour();
    const user = name + colour;

    awareness.setLocalStateField('user', {
      name: user,
      color: `#${colour}`,
    });

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
      theme={theme}
      defaultValue={defaultValue}
      defaultLanguage='python'
      language={language}
      onMount={(editor) => {
        setEditor(editor);
      }}
      options={{padding: {top: 12, bottom: 12}, scrollBeyondLastLine: false, minimap: {enabled: false}}}
    />
  );
}
