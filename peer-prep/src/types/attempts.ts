import { AttemptQuestion, Question } from "./question";

// src/types/attempts.ts
export interface TestCaseResult {
  testCaseId: string;
  expectedOutput: string;
  input: string;
  isPassed: boolean;
  output: string;
  error: string;
  _id?: string;
  meta?: {
    memory: number;
    time: string;
  }
}

export interface UserAttempt {
  _id: string;
  userId: string;
  otherUserId: string;
  question: AttemptQuestion;
  roomId: string;
  notes: string;
  attemptCode: string;
  testCaseResults: TestCaseResult[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface AttemptData {
  attempt: UserAttempt[];
}

export interface AttemptsData {
  attempts: UserAttempt[];
}
