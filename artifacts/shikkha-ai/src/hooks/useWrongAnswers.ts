import { useState, useCallback } from "react";

export interface WrongAnswer {
  questionId: number;
  questionText: string;
  correctOption: string;
  selectedOption: string;
  explanation: string;
  chapterId: number;
  savedAt: string;
}

const STORAGE_KEY = "qovo_wrong_answers";

function load(): WrongAnswer[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(items: WrongAnswer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useWrongAnswers() {
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>(load);

  const addWrong = useCallback((entry: WrongAnswer) => {
    setWrongAnswers((prev) => {
      const filtered = prev.filter((w) => w.questionId !== entry.questionId);
      const updated = [entry, ...filtered].slice(0, 200);
      save(updated);
      return updated;
    });
  }, []);

  const removeWrong = useCallback((questionId: number) => {
    setWrongAnswers((prev) => {
      const updated = prev.filter((w) => w.questionId !== questionId);
      save(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    save([]);
    setWrongAnswers([]);
  }, []);

  return { wrongAnswers, addWrong, removeWrong, clearAll };
}

export function getWrongAnswerCount(): number {
  return load().length;
}
