import { CodeHighlight } from "@mantine/code-highlight";
import { Accordion, AccordionItem, Collapse } from "@mantine/core";
import ReactMarkdown from "react-markdown";

/**
 * Capitalize the first letter of a string
 */
export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert separate array of categories and categoriesIds
 */
export function convertToCombinedCategoryId(
  categories: string[],
  categoriesId: number[]
): { category: string; id: number }[] {
  const output = [];
  for (let i = 0; i < categories.length; i++) {
    output.push({
      category: categories[i],
      id: categoriesId[i],
    });
  }

  return output;
}

/**
 * Convert a Date object into 12-hour time
 *
 * @param date The date (in Date object)
 * @returns
 */
export function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;

  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Convert kilobytes to megabytes.
 * Round to 2 dp
 *
 * @param kb
 * @returns
 */
export function kBtoMb(kb: number): number {
  return Math.round((kb / 1000) * 100) / 100;
}

/**
 * If the number (in seconds) is less than 0.1, convert to ms
 * @param s
 * @returns String
 */
export function secondsToMsIfappropriate(s: number): string {
  return s < 0.1 ? `${s * 1000} ms` : `${s} s`;
}

export type FormattableTextOption = "plain" | "code" | "collapse";

export type FormattableText = {
  content: string;
  type: FormattableTextOption;
};
export function splitTextIntoObjects(text: string): FormattableText[] {
  const result = [];

  // Define patterns for different types, making it easy to expand in the future
  const patterns = {
    code: /```([^`]*)```/g,
    // Future patterns like bold, underline can be added here
    // bold: /\*\*([^*]+)\*\*/g,
    // underline: /__(.*?)__/g
    // match [collapse]asdasd[collapse]
  };

  let lastIndex = 0;
  let match;

  // Function to process a pattern match
  const processMatch = (match, type, startIndex, endIndex) => {
    // Add any plain text before the matched pattern
    if (startIndex > lastIndex) {
      result.push({
        content: text.slice(lastIndex, startIndex),
        type: "plain",
      });
    }

    // Add the matched content as the specified type
    result.push({
      content: match.trim() + "\n",
      type: type,
    });

    // Update lastIndex to continue after this matched pattern
    lastIndex = endIndex;
  };

  // Loop through each pattern type
  for (const [type, pattern] of Object.entries(patterns)) {
    // Reset lastIndex for each pattern search
    lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
      processMatch(match[1], type, match.index, pattern.lastIndex);
    }
  }

  // Add any remaining plain text after the last match
  if (!text || lastIndex < text.length) {
    result.push({
      content: text.slice(lastIndex),
      type: "plain",
    });
  }

  return result;
}

export const generateReactObjects = (text: string) => {
  const messageContentSplit = splitTextIntoObjects(text);

  const textObjects = messageContentSplit.map((textObj, i) => {
    switch (textObj.type) {
      case "code":
        // look in textObj.content for the matching language
        const languages = {
          js: /\b(javascript|js|function|const|let|=>|console\.log|document)\b/,
          python: /\b(python|def|print\(|import|class|lambda|self)\b/,
          java: /\b(java|public\s+class|System\.out\.print|void\s+main|new\s+[A-Z])/,
          c: /\b(cpp|#include|int\s+main|printf|scanf)\b/,
          html: /<html>|<body>|<\/html>|<\/body>/,
          css: /\b(color:|background-color:|font-size:|margin:|padding:)\b/,
          sql: /\b(sql|SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\b/,
          // Add more languages and patterns here as needed
        };

        let codeLang = "";

        // Check each language pattern against the text
        for (const [language, pattern] of Object.entries(languages)) {
          if (pattern.test(textObj.content)) {
            codeLang = language;
          }
        }

        // remove that language from the text
        const langCodeToLanguage = {
          js: "javascript",
          python: "python",
          java: "java",
          c: "cpp",
          html: "html",
          css: "css",
          sql: "sql",
        };

        textObj.content = textObj.content.replace(
          langCodeToLanguage[codeLang],
          ""
        );
        return (
          <CodeHighlight
            code={textObj.content}
            language={codeLang}
            copyLabel="Copy"
            copiedLabel="Copied"
            key={i}
            onClick={(e) => e.stopPropagation()}
          />
          // <Code block>{textObj.content}</Code>
        );
        break;
      case "plain":
        return <ReactMarkdown key={i}>{textObj.content}</ReactMarkdown>;
        // return <Text key={i}> {textObj.content} </Text>;
        break;
      case "collapse":
        return (
          <Accordion>
            <Accordion.Item value="aa">
              <Accordion.Control>Click to open</Accordion.Control>
              <Accordion.Panel>
                <ReactMarkdown>{textObj.content}</ReactMarkdown>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        );
        break;
      default:
        return <ReactMarkdown key={i}>{textObj.content}</ReactMarkdown>;
    }
  });

  return textObjects;
};
