import { Box } from "@mantine/core";
import { Editor } from "@monaco-editor/react";

// const languages = ['Python', 'Javascript', 'C++'];

function CodeEditorWithLanguageSelector({ code, onCodeChange, label, required, height="300px", isReadOnly = false }) {
  return (
    <Box>
      <label style={{ fontSize:"14px" }}>
        {label}
        { required && <span style={{ color:"red", fontSize:"14px", paddingLeft: "4px" }}>*</span> }
      </label>
      {/* <Select
        label={`${label}`}
        placeholder="Select a language"
        data={languages}
        value={language}
        onChange={onLanguageChange}
        mb={8}
        required={required}
      /> */}
      <Editor
        height={height}
        language={'python'}
        value={code}
        theme="vs-dark"
        onChange={(value) => onCodeChange(value || '')}
        options={{ padding: {top: 12}, domReadOnly: isReadOnly, readOnly: isReadOnly, scrollBeyondLastLine: false, minimap: {enabled: false} }}
      />
    </Box>
  );
}

export default CodeEditorWithLanguageSelector;
