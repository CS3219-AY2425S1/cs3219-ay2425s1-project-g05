export type Complexity = "EASY" | "MEDIUM" | "HARD";

export type TestCase = {
  _id?: number;
  testCode: string;
  isPublic: boolean;
  expectedOutput: string;
  meta: { [key: string]: any };
};

export type QuestionOlsd = {
  id: number,
  title: string,
  shortDescription: string,
  description: string,
  categories: string[],
  complexity: Complexity,
  link: string
}

export type Question = {
  _id: string;
  title: string;
  description: { [key: string]: any };
  categories: string[];
  difficulty: Complexity;
  isDeleted: boolean;
  testCases: TestCase[];
  solutionCode: string;
  link: string;
  __v: number;
};

export interface QuestionResponseData {
  question?: Question;
  questions?: Question[];
  categories?: string[];
}

export interface CategoryResponseData {
  categories: string[];
}

export const SAMPLE_QUESTIONS: any[] = [{
  id: 1,
  title: "Reverse a string",
  shortDescription: `Write a function that reverses a string. The input string is given as an array of characters s.  
You must do this by modifying the input array in-place with O(1) extra memory.`,
  description: `Write a function that reverses a string. The input string is given as an array of characters s.  
You must do this by modifying the input array in-place with O(1) extra memory.  
  
Example 1: 
  
Input: s = 
["h","e","l","l","o"] 
Output: 
["o","l","l","e","h"] 
Example 2: 
  
Input: s = 
["H","a","n","n","a","h"] 
Output: 
["h","a","n","n","a","H"] 
  
Constraints: 
  
1 <= s.length <= 105 
s[i] is a printable ascii character. `,
  categories: ["strings", "algorithms"],
  complexity: "easy",
  link: "https://leetcode.com/problems/reverse-string/"
}, {
  id: 2,
  title: "Linked List Cycle Detection",
  shortDescription: `Implement a function to detect if a linked list contains a cycle.`,
  description: `Implement a function 
to detect if a linked 
list contains a cycle.`,
  categories: ["linked lists", "algorithms"],
  complexity: "medium",
  link: "https://leetcode.com/problems/linked-list-cycle/"
}]