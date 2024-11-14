import { RichTextEditor as MantineRichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';
import Placeholder from '@tiptap/extension-placeholder';

interface RichTextEditorProps {
  content: string;
  onContentChange: (textValue: string, htmlvalue: string) => void;
}

function RichTextEditor({ content, onContentChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Underline,
      Placeholder.configure({ placeholder: 'Type in your question description...' }),
    ],
    content: content,
    onUpdate({ editor }) {
      onContentChange(editor.getText(), editor.getHTML());
    },
  });

  // Update editor content when content changes
  useEffect(() => {
    if (editor) {
      const currentContent = editor.getHTML();
      if (currentContent === content) {
        return;
      }

      const { from, to } = editor.state.selection; // Get current cursor position

      editor.commands.setContent(content, false, {
        preserveWhitespace: 'full',
      });
      
      editor.commands.setTextSelection({ from, to }); // Restore the cursor position
    }
  }, [content, editor]);


  return (
    <>
      <label style={{ fontSize:"14px" }}>
        Description
        <span style={{ color:"red", fontSize:"14px", paddingLeft: "4px" }}>*</span>  
      </label>      
      <MantineRichTextEditor editor={editor}>
        <MantineRichTextEditor.Toolbar>
          <MantineRichTextEditor.ControlsGroup>
            <MantineRichTextEditor.Bold />
            <MantineRichTextEditor.Italic />
            <MantineRichTextEditor.Underline />
            <MantineRichTextEditor.Strikethrough />
            <MantineRichTextEditor.ClearFormatting />
            <MantineRichTextEditor.Highlight />
            <MantineRichTextEditor.Code />
          </MantineRichTextEditor.ControlsGroup>

          <MantineRichTextEditor.ControlsGroup>
            <MantineRichTextEditor.H1 />
            <MantineRichTextEditor.H2 />
            <MantineRichTextEditor.H3 />
            <MantineRichTextEditor.H4 />
          </MantineRichTextEditor.ControlsGroup>

          <MantineRichTextEditor.ControlsGroup>
            <MantineRichTextEditor.BulletList />
            <MantineRichTextEditor.OrderedList />
          </MantineRichTextEditor.ControlsGroup>

          <MantineRichTextEditor.ControlsGroup>
            <MantineRichTextEditor.Link />
            <MantineRichTextEditor.Unlink />
          </MantineRichTextEditor.ControlsGroup>

          <MantineRichTextEditor.ControlsGroup>
            <MantineRichTextEditor.Undo />
            <MantineRichTextEditor.Redo />
          </MantineRichTextEditor.ControlsGroup>
        </MantineRichTextEditor.Toolbar>
        
        <MantineRichTextEditor.Content />
      </MantineRichTextEditor>
    </>
  );
};

export default RichTextEditor;
