/**
 * SSC seed: assigns SSC categories to existing subjects, adds new SSC-only
 * subjects (compulsory / science / commerce / arts groups), with chapters and
 * a starter set of MCQ questions including hints.
 *
 * Idempotent: safe to run multiple times. Existing subjects are matched by
 * `name` and only their `category` (and description) is updated. New subjects
 * are inserted only if absent. New chapters are inserted only if absent for
 * their subject. New questions are inserted only if their (chapterId,
 * questionText) is not already present.
 */

import { db, subjects, chapters, questions } from "@workspace/db";
import { eq, and } from "drizzle-orm";

interface QSeed {
  q: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
  difficulty?: "easy" | "medium" | "hard";
}
interface ChapterSeed {
  name: string;
  nameBn: string;
  questions: QSeed[];
}
interface SubjectSeed {
  name: string;
  nameBn: string;
  icon: string;
  color: string;
  description: string;
  category: "compulsory" | "science" | "commerce" | "arts" | "optional";
  chapters: ChapterSeed[];
}

// ----- Existing subject category mapping (by `name`) -----
const EXISTING_CATEGORIES: Record<
  string,
  { category: SubjectSeed["category"]; nameBn?: string; description?: string }
> = {
  Physics: { category: "science" },
  Chemistry: { category: "science" },
  Biology: { category: "science" },
  Mathematics: { category: "compulsory" },
  ICT: { category: "compulsory" },
  Bangla: { category: "compulsory" },
  English: { category: "compulsory" },
  "General Knowledge": {
    category: "compulsory",
    nameBn: "বাংলাদেশ ও বিশ্বপরিচয়",
    description: "বাংলাদেশের ইতিহাস, ভূগোল, সমাজ ও বিশ্বপরিচয়ের সাধারণ ধারণা",
  },
};

// ----- New SSC subjects with chapters + questions -----
const NEW_SUBJECTS: SubjectSeed[] = [
  {
    name: "Higher Mathematics",
    nameBn: "উচ্চতর গণিত",
    icon: "FunctionSquare",
    color: "#0EA5E9",
    description: "সেট, ফাংশন, জ্যামিতি, ত্রিকোণমিতি ও ভেক্টরের মৌলিক ধারণা",
    category: "science",
    chapters: [
      {
        name: "Set & Function",
        nameBn: "সেট ও ফাংশন",
        questions: [
          {
            q: "A = {1, 2, 3} এবং B = {3, 4} হলে A ∩ B = ?",
            options: ["{1, 2}", "{3}", "{1, 2, 3, 4}", "∅"],
            correctIndex: 1,
            explanation: "ছেদ মানে উভয় সেটে কমন উপাদান। এখানে শুধু 3 কমন।",
            hint: "ছেদ (∩) = উভয় সেটে কমন উপাদান।",
            difficulty: "easy",
          },
          {
            q: "f(x) = 2x + 3 হলে f(4) = ?",
            options: ["7", "8", "11", "14"],
            correctIndex: 2,
            explanation: "f(4) = 2(4) + 3 = 8 + 3 = 11।",
            hint: "x এর জায়গায় 4 বসিয়ে হিসাব করো।",
            difficulty: "easy",
          },
          {
            q: "A = {a, b} এর শক্তি সেটের উপাদান সংখ্যা কত?",
            options: ["2", "3", "4", "8"],
            correctIndex: 2,
            explanation: "n উপাদানের সেটের শক্তি সেটে 2ⁿ উপাদান। n=2 → 2² = 4।",
            hint: "n উপাদানের শক্তি সেটে 2ⁿ উপাদান।",
            difficulty: "medium",
          },
        ],
      },
      {
        name: "Trigonometry",
        nameBn: "ত্রিকোণমিতি",
        questions: [
          {
            q: "sin 30° এর মান কত?",
            options: ["1/2", "√3/2", "1", "0"],
            correctIndex: 0,
            explanation: "sin 30° = 1/2 (মৌলিক ত্রিকোণমিতিক মান)।",
            hint: "30°, 45°, 60° এর মৌলিক sin মান মনে করো।",
            difficulty: "easy",
          },
          {
            q: "sin²θ + cos²θ এর মান কত?",
            options: ["0", "1", "2", "tan θ"],
            correctIndex: 1,
            explanation: "মৌলিক ত্রিকোণমিতিক অভেদ: sin²θ + cos²θ = 1।",
            hint: "এটি একটি মৌলিক ত্রিকোণমিতিক অভেদ।",
            difficulty: "easy",
          },
          {
            q: "tan 45° এর মান কত?",
            options: ["0", "1/√2", "1", "√3"],
            correctIndex: 2,
            explanation: "tan 45° = sin 45°/cos 45° = (1/√2)/(1/√2) = 1।",
            hint: "tan = sin/cos এবং 45° এ sin = cos।",
            difficulty: "easy",
          },
        ],
      },
      {
        name: "Vector",
        nameBn: "ভেক্টর",
        questions: [
          {
            q: "নিচের কোনটি ভেক্টর রাশি?",
            options: ["সময়", "তাপমাত্রা", "বল", "ভর"],
            correctIndex: 2,
            explanation: "বলের মান ও দিক উভয় আছে — তাই ভেক্টর। বাকিগুলো স্কেলার।",
            hint: "ভেক্টরের মান ও দিক — দুটোই থাকে।",
            difficulty: "easy",
          },
          {
            q: "i⃗ · i⃗ এর মান কত?",
            options: ["0", "1", "i⃗", "−1"],
            correctIndex: 1,
            explanation: "একই দিকের একক ভেক্টরের ডট গুণফল = 1।",
            hint: "ডট গুণফল = |a||b|cosθ; একই ভেক্টরে θ = 0°।",
            difficulty: "medium",
          },
        ],
      },
    ],
  },
  {
    name: "Islamic Studies",
    nameBn: "ইসলাম শিক্ষা",
    icon: "Moon",
    color: "#16A34A",
    description: "আকাইদ ও নৈতিক শিক্ষা, ইবাদত, কুরআন-হাদিসের মূল শিক্ষা",
    category: "compulsory",
    chapters: [
      {
        name: "Aqaid",
        nameBn: "আকাইদ ও নৈতিক জীবন",
        questions: [
          {
            q: "ইসলামের মূল স্তম্ভ কয়টি?",
            options: ["৩টি", "৪টি", "৫টি", "৭টি"],
            correctIndex: 2,
            explanation: "ইসলামের মূল স্তম্ভ ৫টি — কালিমা, সালাত, যাকাত, সাওম, হজ।",
            hint: "একটি বিখ্যাত হাদিসে এর সংখ্যা স্পষ্ট বলা হয়েছে।",
            difficulty: "easy",
          },
          {
            q: "ঈমান শব্দের আভিধানিক অর্থ কী?",
            options: ["আনুগত্য", "বিশ্বাস", "ভয়", "ভালোবাসা"],
            correctIndex: 1,
            explanation: "ঈমান অর্থ অন্তর থেকে দৃঢ় বিশ্বাস করা।",
            hint: "ঈমান অন্তরের অবস্থার সাথে সম্পর্কিত।",
            difficulty: "easy",
          },
        ],
      },
      {
        name: "Worship",
        nameBn: "ইবাদত",
        questions: [
          {
            q: "প্রতিদিন ফরজ সালাতের রাকাত সংখ্যা মোট কত?",
            options: ["১৫", "১৭", "১৯", "২০"],
            correctIndex: 1,
            explanation: "ফজর ২ + যোহর ৪ + আসর ৪ + মাগরিব ৩ + এশা ৪ = ১৭ রাকাত।",
            hint: "পাঁচ ওয়াক্তের ফরজ যোগ করো।",
            difficulty: "medium",
          },
          {
            q: "সাওম পালন করা হয় কোন মাসে?",
            options: ["শাবান", "রজব", "রমজান", "শাওয়াল"],
            correctIndex: 2,
            explanation: "রমজান মাসে এক মাসব্যাপী সাওম পালন ইসলামের ৪র্থ স্তম্ভ।",
            hint: "যে মাসে কুরআন নাজিল হয়েছে।",
            difficulty: "easy",
          },
        ],
      },
    ],
  },
  {
    name: "Accounting",
    nameBn: "হিসাববিজ্ঞান",
    icon: "Calculator",
    color: "#F59E0B",
    description: "হিসাবের মৌলিক নীতি, দু'তরফা দাখিলা, জাবেদা ও খতিয়ান",
    category: "commerce",
    chapters: [
      {
        name: "Basics of Accounting",
        nameBn: "হিসাবের মৌলিক ধারণা",
        questions: [
          {
            q: "হিসাববিজ্ঞানের মৌলিক সমীকরণ কোনটি?",
            options: [
              "সম্পদ = দায় − মালিকানা",
              "সম্পদ = দায় + মালিকানা",
              "মালিকানা = সম্পদ + দায়",
              "দায় = সম্পদ + মালিকানা",
            ],
            correctIndex: 1,
            explanation: "হিসাব সমীকরণ: সম্পদ = দায় + মালিকানা স্বত্ব।",
            hint: "দু'তরফার সাম্যতা — বাঁ পাশে সম্পদ, ডান পাশে দাবি।",
            difficulty: "medium",
          },
          {
            q: "নিচের কোনটি একটি স্থায়ী সম্পদ?",
            options: ["নগদ অর্থ", "প্রাপ্য হিসাব", "যন্ত্রপাতি", "মজুদ পণ্য"],
            correctIndex: 2,
            explanation: "যন্ত্রপাতি দীর্ঘমেয়াদে ব্যবহারের জন্য — তাই স্থায়ী সম্পদ।",
            hint: "যেটি এক বছরের বেশি সময় ব্যবহার হয়।",
            difficulty: "easy",
          },
        ],
      },
      {
        name: "Double Entry & Journal",
        nameBn: "দু'তরফা দাখিলা ও জাবেদা",
        questions: [
          {
            q: "দু'তরফা দাখিলায় প্রতিটি লেনদেনের কয়টি পক্ষ থাকে?",
            options: ["১", "২", "৩", "৪"],
            correctIndex: 1,
            explanation: "প্রতিটি লেনদেনে ২টি পক্ষ — ডেবিট ও ক্রেডিট।",
            hint: "নামটাই বলে দিচ্ছে — \"দু'তরফা\"।",
            difficulty: "easy",
          },
          {
            q: "জাবেদা থেকে স্থানান্তরিত হিসাব রাখার বইকে কী বলে?",
            options: ["জাবেদা", "খতিয়ান", "নগদান বই", "ক্রয় বই"],
            correctIndex: 1,
            explanation: "জাবেদার এন্ট্রি স্থানান্তর করা হয় খতিয়ানে।",
            hint: "এটি \"হিসাবের রাজা\" নামে পরিচিত।",
            difficulty: "medium",
          },
        ],
      },
    ],
  },
  {
    name: "Business Entrepreneurship",
    nameBn: "ব্যবসায় উদ্যোগ",
    icon: "Briefcase",
    color: "#EA580C",
    description: "ব্যবসায়ের ধরন, উদ্যোক্তার গুণাবলি ও ব্যবসায় পরিবেশ",
    category: "commerce",
    chapters: [
      {
        name: "Business Basics",
        nameBn: "ব্যবসায়ের ধারণা",
        questions: [
          {
            q: "মুনাফা অর্জনের উদ্দেশ্যে পণ্য বা সেবা সরবরাহকে কী বলে?",
            options: ["শিল্প", "ব্যবসায়", "সমাজসেবা", "পেশা"],
            correctIndex: 1,
            explanation: "ব্যবসায় = মুনাফার উদ্দেশ্যে অর্থনৈতিক কাজ।",
            hint: "মূল উদ্দেশ্য — মুনাফা।",
            difficulty: "easy",
          },
          {
            q: "একমালিকানা ব্যবসায়ের প্রধান বৈশিষ্ট্য কী?",
            options: [
              "অসীম দায়",
              "শেয়ার বাজারে তালিকাভুক্ত",
              "বহু মালিক",
              "আইনি সত্তা পৃথক",
            ],
            correctIndex: 0,
            explanation: "একমালিকানায় মালিকের ব্যক্তিগত সম্পত্তি দিয়েও দেনা শোধ করতে হয় — অসীম দায়।",
            hint: "মালিকের দায় কোম্পানির দায়ের সাথে কতটুকু সীমাবদ্ধ?",
            difficulty: "medium",
          },
        ],
      },
      {
        name: "Entrepreneur",
        nameBn: "উদ্যোক্তা",
        questions: [
          {
            q: "উদ্যোক্তার অপরিহার্য গুণ কোনটি?",
            options: ["অলসতা", "ঝুঁকি গ্রহণ", "ভয়", "দ্বিধা"],
            correctIndex: 1,
            explanation: "ঝুঁকি গ্রহণ ছাড়া উদ্যোক্তা হওয়া যায় না।",
            hint: "যে গুণটি ছাড়া নতুন কিছু শুরুই করা যায় না।",
            difficulty: "easy",
          },
        ],
      },
    ],
  },
  {
    name: "Finance Banking",
    nameBn: "ফিন্যান্স ও ব্যাংকিং",
    icon: "Landmark",
    color: "#0D9488",
    description: "অর্থায়নের ধারণা, ব্যাংক ও আর্থিক প্রতিষ্ঠানের কাজ",
    category: "commerce",
    chapters: [
      {
        name: "Banking",
        nameBn: "ব্যাংকিং পরিচিতি",
        questions: [
          {
            q: "বাংলাদেশের কেন্দ্রীয় ব্যাংকের নাম কী?",
            options: ["সোনালী ব্যাংক", "জনতা ব্যাংক", "বাংলাদেশ ব্যাংক", "অগ্রণী ব্যাংক"],
            correctIndex: 2,
            explanation: "বাংলাদেশ ব্যাংক দেশের কেন্দ্রীয় ব্যাংক, ১৯৭১ সালে প্রতিষ্ঠিত।",
            hint: "এটি অন্যান্য ব্যাংককে নিয়ন্ত্রণ করে।",
            difficulty: "easy",
          },
          {
            q: "নিম্নের কোনটি ব্যাংকের প্রাথমিক কাজ?",
            options: [
              "শিক্ষাদান",
              "আমানত গ্রহণ ও ঋণদান",
              "বিদ্যুৎ সরবরাহ",
              "পরিবহন ব্যবস্থা",
            ],
            correctIndex: 1,
            explanation: "ব্যাংকের প্রাথমিক কাজ আমানত গ্রহণ ও ঋণদান।",
            hint: "ব্যাংকের আয়ের প্রধান উৎস কোনটি?",
            difficulty: "easy",
          },
        ],
      },
    ],
  },
  {
    name: "Economics",
    nameBn: "অর্থনীতি",
    icon: "TrendingUp",
    color: "#9333EA",
    description: "চাহিদা-যোগান, উৎপাদন, বাজার ও জাতীয় আয়",
    category: "arts",
    chapters: [
      {
        name: "Demand & Supply",
        nameBn: "চাহিদা ও যোগান",
        questions: [
          {
            q: "চাহিদা বিধি অনুযায়ী, দাম বাড়লে চাহিদার পরিমাণ কেমন হয়?",
            options: ["বাড়ে", "কমে", "অপরিবর্তিত", "অসীম"],
            correctIndex: 1,
            explanation: "চাহিদা বিধি: অন্যান্য বিষয় স্থির থাকলে দাম বাড়লে চাহিদা কমে।",
            hint: "দাম ও চাহিদার সম্পর্ক — সমমুখী না বিপরীতমুখী?",
            difficulty: "easy",
          },
          {
            q: "যোগান বিধি অনুসারে দাম ও যোগানের সম্পর্ক কেমন?",
            options: ["বিপরীতমুখী", "সমমুখী", "কোনো সম্পর্ক নেই", "শূন্য"],
            correctIndex: 1,
            explanation: "দাম বাড়লে যোগানও বাড়ে — সমমুখী।",
            hint: "বিক্রেতা বেশি দাম পেলে কী করে?",
            difficulty: "easy",
          },
        ],
      },
      {
        name: "National Income",
        nameBn: "জাতীয় আয়",
        questions: [
          {
            q: "GDP এর পূর্ণরূপ কী?",
            options: [
              "Gross Domestic Product",
              "General Domestic Price",
              "Gross Domestic Price",
              "General Direct Product",
            ],
            correctIndex: 0,
            explanation: "GDP = Gross Domestic Product (মোট দেশজ উৎপাদন)।",
            hint: "Gross — মোট, Domestic — দেশজ।",
            difficulty: "easy",
          },
        ],
      },
    ],
  },
  {
    name: "Civics",
    nameBn: "পৌরনীতি ও নাগরিকতা",
    icon: "Scale",
    color: "#7C3AED",
    description: "নাগরিকতা, সরকার, সংবিধান ও মৌলিক অধিকার",
    category: "arts",
    chapters: [
      {
        name: "Citizenship",
        nameBn: "নাগরিকতা",
        questions: [
          {
            q: "বাংলাদেশের সংবিধান কত সালে গৃহীত হয়?",
            options: ["১৯৭১", "১৯৭২", "১৯৭৫", "১৯৭৩"],
            correctIndex: 1,
            explanation: "৪ নভেম্বর ১৯৭২ সালে গৃহীত হয়, ১৬ ডিসেম্বর ১৯৭২ থেকে কার্যকর।",
            hint: "স্বাধীনতার পরের বছর।",
            difficulty: "medium",
          },
          {
            q: "নাগরিকের কোনটি একটি মৌলিক অধিকার?",
            options: [
              "ভোটদানের অধিকার নেই",
              "বাকস্বাধীনতা",
              "কর ফাঁকি",
              "আইন অমান্য",
            ],
            correctIndex: 1,
            explanation: "বাকস্বাধীনতা সংবিধান স্বীকৃত মৌলিক অধিকার।",
            hint: "সংবিধানের তৃতীয় ভাগে যা উল্লেখ আছে।",
            difficulty: "easy",
          },
        ],
      },
      {
        name: "Government",
        nameBn: "সরকার ব্যবস্থা",
        questions: [
          {
            q: "বাংলাদেশের সরকার ব্যবস্থা কোন ধরনের?",
            options: ["রাষ্ট্রপতি শাসিত", "সংসদীয়", "রাজতান্ত্রিক", "একনায়কতান্ত্রিক"],
            correctIndex: 1,
            explanation: "বাংলাদেশ একটি সংসদীয় গণতান্ত্রিক রাষ্ট্র।",
            hint: "প্রধানমন্ত্রী হলেন নির্বাহী প্রধান।",
            difficulty: "easy",
          },
        ],
      },
    ],
  },
  {
    name: "Geography",
    nameBn: "ভূগোল ও পরিবেশ",
    icon: "Globe2",
    color: "#0891B2",
    description: "ভূমিরূপ, জলবায়ু, সম্পদ ও পরিবেশগত বিষয়",
    category: "arts",
    chapters: [
      {
        name: "Earth & Climate",
        nameBn: "পৃথিবী ও জলবায়ু",
        questions: [
          {
            q: "পৃথিবী সূর্যকে একবার পরিক্রমণ করতে কত সময় নেয়?",
            options: ["২৪ ঘণ্টা", "৩০ দিন", "৩৬৫.২৫ দিন", "১২ মাস ঠিক"],
            correctIndex: 2,
            explanation: "পৃথিবীর বার্ষিক গতি ≈ ৩৬৫.২৫ দিনে সম্পন্ন হয়।",
            hint: "এই কারণেই প্রতি ৪ বছর পর লিপ ইয়ার আসে।",
            difficulty: "easy",
          },
          {
            q: "বাংলাদেশের জলবায়ু কোন ধরনের?",
            options: [
              "নাতিশীতোষ্ণ",
              "ক্রান্তীয় মৌসুমী",
              "মেরু",
              "মরু",
            ],
            correctIndex: 1,
            explanation: "বাংলাদেশের জলবায়ু ক্রান্তীয় মৌসুমী — উষ্ণ ও আর্দ্র।",
            hint: "বর্ষাকাল প্রবল মৌসুমি বায়ুর কারণে আসে।",
            difficulty: "easy",
          },
        ],
      },
      {
        name: "Resources",
        nameBn: "সম্পদ ও পরিবেশ",
        questions: [
          {
            q: "নিম্নের কোনটি পুনর্নবীকরণযোগ্য সম্পদ?",
            options: ["কয়লা", "সৌরশক্তি", "প্রাকৃতিক গ্যাস", "পেট্রোলিয়াম"],
            correctIndex: 1,
            explanation: "সৌরশক্তি অফুরন্ত — পুনর্নবীকরণযোগ্য সম্পদ।",
            hint: "যেটি ফুরিয়ে যায় না।",
            difficulty: "easy",
          },
        ],
      },
    ],
  },
];

// ----- BD & World Studies (compulsory) — replaces "General Knowledge" content -----
const BD_WORLD_CHAPTERS: ChapterSeed[] = [
  {
    name: "Bangladesh Liberation War",
    nameBn: "বাংলাদেশের মুক্তিযুদ্ধ",
    questions: [
      {
        q: "বাংলাদেশের স্বাধীনতা যুদ্ধ শুরু হয় কত সালে?",
        options: ["১৯৬৯", "১৯৭০", "১৯৭১", "১৯৭২"],
        correctIndex: 2,
        explanation: "২৬ মার্চ ১৯৭১ সালে স্বাধীনতা ঘোষণার মাধ্যমে যুদ্ধ শুরু।",
        hint: "যে সালেই বাংলাদেশ স্বাধীন হয়।",
        difficulty: "easy",
      },
      {
        q: "মুক্তিযুদ্ধের মোট সেক্টর সংখ্যা কত ছিল?",
        options: ["৭", "৯", "১১", "১৩"],
        correctIndex: 2,
        explanation: "মুক্তিযুদ্ধে সমগ্র বাংলাদেশকে ১১টি সেক্টরে ভাগ করা হয়েছিল।",
        hint: "১০ এর চেয়ে বেশি, ১২ এর কম।",
        difficulty: "medium",
      },
    ],
  },
  {
    name: "World",
    nameBn: "বিশ্বপরিচয়",
    questions: [
      {
        q: "জাতিসংঘ প্রতিষ্ঠিত হয় কত সালে?",
        options: ["১৯৪৫", "১৯৪৭", "১৯৪৯", "১৯৫০"],
        correctIndex: 0,
        explanation: "২৪ অক্টোবর ১৯৪৫ সালে জাতিসংঘ আনুষ্ঠানিকভাবে প্রতিষ্ঠিত হয়।",
        hint: "দ্বিতীয় বিশ্বযুদ্ধ শেষ হওয়ার বছরেই।",
        difficulty: "easy",
      },
      {
        q: "জাতিসংঘের সদর দপ্তর কোথায়?",
        options: ["প্যারিস", "জেনেভা", "নিউইয়র্ক", "লন্ডন"],
        correctIndex: 2,
        explanation: "জাতিসংঘের প্রধান সদর দপ্তর নিউইয়র্ক, যুক্তরাষ্ট্রে অবস্থিত।",
        hint: "যুক্তরাষ্ট্রের একটি বিখ্যাত শহর।",
        difficulty: "easy",
      },
    ],
  },
];

async function ensureSubject(s: SubjectSeed): Promise<number> {
  const found = await db.select().from(subjects).where(eq(subjects.name, s.name)).limit(1);
  if (found.length > 0) {
    await db
      .update(subjects)
      .set({
        category: s.category,
        nameBn: s.nameBn,
        description: s.description,
        icon: s.icon,
        color: s.color,
      })
      .where(eq(subjects.id, found[0].id));
    return found[0].id;
  }
  const inserted = await db
    .insert(subjects)
    .values({
      name: s.name,
      nameBn: s.nameBn,
      icon: s.icon,
      color: s.color,
      description: s.description,
      category: s.category,
    })
    .returning();
  return inserted[0].id;
}

async function ensureChapter(subjectId: number, ch: ChapterSeed, orderIndex: number): Promise<number> {
  const found = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.subjectId, subjectId), eq(chapters.name, ch.name)))
    .limit(1);
  if (found.length > 0) return found[0].id;
  const inserted = await db
    .insert(chapters)
    .values({ subjectId, name: ch.name, nameBn: ch.nameBn, orderIndex })
    .returning();
  return inserted[0].id;
}

async function ensureQuestions(chapterId: number, qs: QSeed[]): Promise<number> {
  let added = 0;
  for (const q of qs) {
    const exists = await db
      .select()
      .from(questions)
      .where(and(eq(questions.chapterId, chapterId), eq(questions.questionText, q.q)))
      .limit(1);
    if (exists.length > 0) {
      // Backfill hint if missing
      if (!exists[0].hint && q.hint) {
        await db.update(questions).set({ hint: q.hint }).where(eq(questions.id, exists[0].id));
      }
      continue;
    }
    await db.insert(questions).values({
      chapterId,
      questionText: q.q,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      hint: q.hint,
      difficulty: q.difficulty ?? "medium",
      source: "Qovo SSC seed",
      year: null,
    });
    added++;
  }
  return added;
}

async function main() {
  console.log("=== Qovo SSC seed ===");

  // 1) Categorize / rename existing subjects
  const allExisting = await db.select().from(subjects);
  for (const row of allExisting) {
    const meta = EXISTING_CATEGORIES[row.name];
    if (!meta) continue;
    await db
      .update(subjects)
      .set({
        category: meta.category,
        ...(meta.nameBn ? { nameBn: meta.nameBn } : {}),
        ...(meta.description ? { description: meta.description } : {}),
      })
      .where(eq(subjects.id, row.id));
    console.log(`  · updated subject: ${row.name} -> category=${meta.category}`);
  }

  // 2) Add chapters/questions to "General Knowledge" (now BD & World Studies)
  const gk = allExisting.find((s) => s.name === "General Knowledge");
  if (gk) {
    let i = 0;
    for (const ch of BD_WORLD_CHAPTERS) {
      const cid = await ensureChapter(gk.id, ch, i++);
      const added = await ensureQuestions(cid, ch.questions);
      console.log(`  · BD&World chapter "${ch.name}" — added ${added} questions`);
    }
  }

  // 3) Insert new SSC subjects + chapters + questions
  for (const subj of NEW_SUBJECTS) {
    const sid = await ensureSubject(subj);
    let i = 0;
    let totalAdded = 0;
    for (const ch of subj.chapters) {
      const cid = await ensureChapter(sid, ch, i++);
      totalAdded += await ensureQuestions(cid, ch.questions);
    }
    console.log(`  · ${subj.name} (${subj.category}) — ${subj.chapters.length} chapters, +${totalAdded} questions`);
  }

  console.log("=== done ===");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
