export interface ParsedQuestion {
  subjectName: string;
  chapterName: string;
  source: string | null;
  year: number | null;
  difficulty: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string | null;
  startLine: number;
}

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  questions: ParsedQuestion[];
  errors: ParseError[];
}

const LETTER_TO_INDEX: Record<string, number> = {
  A: 0, B: 1, C: 2, D: 3, E: 4,
  a: 0, b: 1, c: 2, d: 3, e: 4,
  "ক": 0, "খ": 1, "গ": 2, "ঘ": 3, "ঙ": 4,
  "১": 0, "২": 1, "৩": 2, "৪": 3, "৫": 4,
  "1": 0, "2": 1, "3": 2, "4": 3, "5": 4,
};

interface Block {
  startLine: number;
  lines: { lineNo: number; text: string }[];
}

function splitBlocks(code: string): Block[] {
  const rawLines = code.split(/\r?\n/);
  const blocks: Block[] = [];
  let current: Block | null = null;
  rawLines.forEach((text, i) => {
    const lineNo = i + 1;
    const trimmed = text.trim();
    if (/^---+$/.test(trimmed) || /^===+$/.test(trimmed)) {
      if (current) {
        blocks.push(current);
        current = null;
      }
      return;
    }
    if (!current) {
      current = { startLine: lineNo, lines: [] };
    }
    current.lines.push({ lineNo, text });
  });
  if (current) blocks.push(current);
  return blocks.filter((b) => b.lines.some((l) => l.text.trim().length > 0));
}

function parseAnswerToken(raw: string): number | null {
  const cleaned = raw.trim().replace(/^[।.]+|[।.]+$/g, "").trim();
  if (cleaned.length === 0) return null;
  const first = cleaned[0];
  if (first in LETTER_TO_INDEX) return LETTER_TO_INDEX[first];
  const m = cleaned.match(/^(\d+)/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 5) return n - 1;
  }
  return null;
}

function parseBlock(block: Block, defaults: { subject?: string; chapter?: string; source?: string | null; year?: number | null; difficulty?: string }): { question?: ParsedQuestion; error?: ParseError; updates: { subject?: string; chapter?: string; source?: string | null; year?: number | null; difficulty?: string } } {
  const updates: { subject?: string; chapter?: string; source?: string | null; year?: number | null; difficulty?: string } = {};
  let questionText = "";
  let questionLine = block.startLine;
  const options: string[] = [];
  const optionLetters: string[] = [];
  let answerToken: string | null = null;
  let answerLine = -1;
  let explanation = "";
  let hint = "";
  let mode: "none" | "question" | "explain" | "hint" = "none";

  const directiveRe = /^@(\w+)\s*[:：]\s*(.*)$/;
  const optionRe = /^([A-Ea-eকখগঘঙ১২৩৪৫1-5])\s*[).।]\s*(.+)$/;
  const labelRe = /^([A-Za-zা-৯\u0980-\u09FF]+)\s*[:：]\s*(.*)$/;

  for (const { lineNo, text } of block.lines) {
    const trimmed = text.trim();
    if (trimmed === "") {
      if (mode === "explain") explanation += "\n";
      continue;
    }

    const dir = trimmed.match(directiveRe);
    if (dir) {
      const key = dir[1].toLowerCase();
      const val = dir[2].trim();
      if (key === "subject" || key === "বিষয়") updates.subject = val;
      else if (key === "chapter" || key === "অধ্যায়") updates.chapter = val;
      else if (key === "source" || key === "উৎস") updates.source = val || null;
      else if (key === "year" || key === "বছর") {
        const n = parseInt(val.replace(/[^\d]/g, ""), 10);
        updates.year = Number.isNaN(n) ? null : n;
      } else if (key === "difficulty" || key === "কঠিনতা") updates.difficulty = val.toLowerCase();
      continue;
    }

    const opt = trimmed.match(optionRe);
    if (opt) {
      const letter = opt[1];
      const value = opt[2].trim();
      optionLetters.push(letter);
      options.push(value);
      mode = "none";
      continue;
    }

    const label = trimmed.match(labelRe);
    if (label) {
      const key = label[1].toLowerCase();
      const val = label[2].trim();
      if (key === "q" || key === "question" || key === "প্রশ্ন") {
        questionText = val;
        questionLine = lineNo;
        mode = "question";
        continue;
      }
      if (key === "answer" || key === "ans" || key === "উত্তর" || key === "ans.") {
        answerToken = val;
        answerLine = lineNo;
        mode = "none";
        continue;
      }
      if (key === "explain" || key === "explanation" || key === "ব্যাখ্যা") {
        explanation = val;
        mode = "explain";
        continue;
      }
      if (key === "hint" || key === "সংকেত" || key === "ইঙ্গিত") {
        hint = val;
        mode = "hint";
        continue;
      }
    }

    // Continuation line for question, explanation, or hint
    if (mode === "question") {
      questionText += (questionText.endsWith(" ") || questionText === "" ? "" : " ") + trimmed;
    } else if (mode === "explain") {
      explanation += (explanation === "" ? "" : "\n") + trimmed;
    } else if (mode === "hint") {
      hint += (hint === "" ? "" : " ") + trimmed;
    } else if (questionText === "" && options.length === 0 && answerToken === null) {
      // First non-directive line — treat as the question text
      questionText = trimmed;
      questionLine = lineNo;
      mode = "question";
    }
  }

  // If only directives, no question — apply updates to defaults but don't return a question
  if (questionText === "" && options.length === 0 && answerToken === null) {
    return { updates };
  }

  const subject = updates.subject ?? defaults.subject;
  const chapter = updates.chapter ?? defaults.chapter;
  if (!subject) {
    return { updates, error: { line: block.startLine, message: "@subject নির্ধারণ করা হয়নি (এই প্রশ্ন বা তার আগের কোনো প্রশ্নে)।" } };
  }
  if (!chapter) {
    return { updates, error: { line: block.startLine, message: "@chapter নির্ধারণ করা হয়নি।" } };
  }
  if (!questionText) {
    return { updates, error: { line: block.startLine, message: "প্রশ্ন (Q:) পাওয়া যায়নি।" } };
  }
  if (options.length < 2) {
    return { updates, error: { line: questionLine, message: `কমপক্ষে ২টি অপশন দরকার, পাওয়া গেছে ${options.length}।` } };
  }
  if (options.length > 5) {
    return { updates, error: { line: questionLine, message: "সর্বোচ্চ ৫টি অপশন সমর্থিত।" } };
  }
  if (answerToken === null) {
    return { updates, error: { line: questionLine, message: "Answer: লাইন পাওয়া যায়নি।" } };
  }

  // Resolve answer index
  let correctIndex: number | null = null;
  // Try matching by letter present in options
  const letterIdx = parseAnswerToken(answerToken);
  if (letterIdx !== null) {
    // Find which option index has this letter
    const letterChar = answerToken.trim()[0];
    const found = optionLetters.findIndex((l) => l === letterChar);
    if (found >= 0) correctIndex = found;
    else if (letterIdx < options.length) correctIndex = letterIdx;
  }
  if (correctIndex === null || correctIndex < 0 || correctIndex >= options.length) {
    return { updates, error: { line: answerLine, message: `Answer "${answerToken}" অপশনগুলোর সাথে মেলেনি।` } };
  }

  const source = updates.source !== undefined ? updates.source : defaults.source ?? null;
  const year = updates.year !== undefined ? updates.year : defaults.year ?? null;
  const difficulty = updates.difficulty ?? defaults.difficulty ?? "medium";

  const question: ParsedQuestion = {
    subjectName: subject,
    chapterName: chapter,
    source,
    year,
    difficulty,
    questionText: questionText.trim(),
    options,
    correctIndex,
    explanation: explanation.trim() || "ব্যাখ্যা প্রদান করা হয়নি।",
    hint: hint.trim() || null,
    startLine: block.startLine,
  };

  return { updates, question };
}

export function parseQuestionCode(code: string): ParseResult {
  const blocks = splitBlocks(code);
  const questions: ParsedQuestion[] = [];
  const errors: ParseError[] = [];
  const defaults: { subject?: string; chapter?: string; source?: string | null; year?: number | null; difficulty?: string } = {};

  for (const block of blocks) {
    const { question, error, updates } = parseBlock(block, defaults);
    if (updates.subject !== undefined) defaults.subject = updates.subject;
    if (updates.chapter !== undefined) defaults.chapter = updates.chapter;
    if (updates.source !== undefined) defaults.source = updates.source;
    if (updates.year !== undefined) defaults.year = updates.year;
    if (updates.difficulty !== undefined) defaults.difficulty = updates.difficulty;
    if (error) errors.push(error);
    if (question) questions.push(question);
  }

  return { questions, errors };
}
