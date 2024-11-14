import React, { useState, useRef, useEffect } from 'react';
import { TextInput, Button, Stack, Text, Box, ScrollArea, Loader } from '@mantine/core';
import { IconMessageCircle2 } from '@tabler/icons-react'; // Import a chat icon
import styles from './AiChat.module.css';
import ReactMarkDown from 'react-markdown';

interface ChatMessage {
  sender: 'User' | 'AI';
  text: string;
}

const AiChat: React.FC = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setChatHistory((prev) => [...prev, { sender: 'User', text: message }]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8008/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      setChatHistory((prev) => [...prev, { sender: 'AI', text: data.reply }]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setChatHistory((prev) => [
        ...prev,
        { sender: 'AI', text: 'Error: Could not fetch response' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      sendMessage();
    }
  };

  return (
    <Stack className={styles.container}>
      <ScrollArea className={styles.chatBox} ref={scrollAreaRef}>
        {chatHistory.length === 0 && !isLoading && (
          <div className={styles.emptyStateContainer}>
            <IconMessageCircle2 className={styles.emptyIcon} />
            <Text className={styles.emptyText}>
              What would you like to ask today?
            </Text>
          </div>
        )}

        <Stack>
          {chatHistory.map((entry, index) => (
            <Box
              key={index}
              className={entry.sender === 'User' ? styles.userMessage : styles.aiMessage}
            >
              <Text>{entry.sender === 'User' ? 'You' : 'AI'}:</Text>
              <ReactMarkDown>{entry.text}</ReactMarkDown>
            </Box>
          ))}

          {isLoading && (
            <Box className={styles.loaderContainer}>
              <Loader size="sm" color="gray" />
              <Text>Generating response...</Text>
            </Box>
          )}
        </Stack>
      </ScrollArea>

      <div className={styles.inputContainer}>
        <TextInput
          placeholder="Type your message..."
          value={message}
          onChange={(event) => setMessage(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          style={{ flexGrow: 1 }}
          disabled={isLoading}
        />
        <Button onClick={sendMessage} disabled={isLoading}>
          {isLoading ? <Loader size="xs" color="white" /> : 'Send'}
        </Button>
      </div>
    </Stack>
  );
};

export default AiChat;
