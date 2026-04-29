import { eq, sql } from "drizzle-orm";
import { db, subjects, chapters, questions } from "@workspace/db";

interface QSeed {
  subject: string;
  chapter: string;
  source: string;
  year: number;
  difficulty: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const Q: QSeed[] = [
  // PHYSICS - Vectors
  { subject: "পদার্থবিজ্ঞান", chapter: "ভেক্টর", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "নিচের কোনটি ভেক্টর রাশি?", options: ["সময়", "দ্রুতি", "বেগ", "ভর"], correctIndex: 2,
    explanation: "বেগের মান ও দিক উভয়ই থাকে — তাই এটি ভেক্টর।" },
  { subject: "পদার্থবিজ্ঞান", chapter: "ভেক্টর", source: "HSC ২০২২", year: 2022, difficulty: "medium",
    questionText: "একই দিকে ক্রিয়াশীল 3N ও 4N বলের লব্ধি কত?", options: ["1 N", "5 N", "7 N", "12 N"], correctIndex: 2,
    explanation: "একই দিকে হলে যোগফল হবে: 3 + 4 = 7 N।" },
  { subject: "পদার্থবিজ্ঞান", chapter: "ভেক্টর", source: "HSC ২০২১", year: 2021, difficulty: "hard",
    questionText: "পরস্পর লম্ব 3N ও 4N বলের লব্ধির মান কত?", options: ["1 N", "5 N", "7 N", "12 N"], correctIndex: 1,
    explanation: "R = √(3² + 4²) = √25 = 5 N" },
  { subject: "পদার্থবিজ্ঞান", chapter: "ভেক্টর", source: "এডমিশন প্রস্তুতি", year: 2024, difficulty: "medium",
    questionText: "একক ভেক্টরের মান কত?", options: ["0", "1", "−1", "অসীম"], correctIndex: 1,
    explanation: "একক ভেক্টরের মান সর্বদা 1, এটি শুধু দিক নির্দেশ করে।" },

  // PHYSICS - Motion
  { subject: "পদার্থবিজ্ঞান", chapter: "এক মাত্রিক গতি", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "একটি বস্তু 20 m/s বেগে উপরে নিক্ষেপ করা হলো। সর্বোচ্চ উচ্চতা কত? (g = 10 m/s²)",
    options: ["10 m", "15 m", "20 m", "40 m"], correctIndex: 2,
    explanation: "h = u²/(2g) = 400/20 = 20 m" },
  { subject: "পদার্থবিজ্ঞান", chapter: "এক মাত্রিক গতি", source: "HSC ২০২২", year: 2022, difficulty: "easy",
    questionText: "মুক্তভাবে পড়ন্ত বস্তুর প্রাথমিক বেগ কত?", options: ["0", "g", "9.8 m/s", "অসীম"], correctIndex: 0,
    explanation: "মুক্তভাবে পড়ন্ত মানে স্থির অবস্থা থেকে — u = 0।" },
  { subject: "পদার্থবিজ্ঞান", chapter: "এক মাত্রিক গতি", source: "SSC ২০২৩", year: 2023, difficulty: "easy",
    questionText: "একটি বস্তু 10s এ 100 m অতিক্রম করল। গড় বেগ কত?",
    options: ["5 m/s", "10 m/s", "20 m/s", "100 m/s"], correctIndex: 1,
    explanation: "গড় বেগ = মোট দূরত্ব / মোট সময় = 100/10 = 10 m/s" },

  // PHYSICS - Work, Energy
  { subject: "পদার্থবিজ্ঞান", chapter: "কাজ, ক্ষমতা ও শক্তি", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "100 W বাল্ব 10 ঘণ্টা জ্বললে কত শক্তি ব্যয় হবে?",
    options: ["1 kWh", "10 kWh", "100 kWh", "1000 kWh"], correctIndex: 0,
    explanation: "শক্তি = ক্ষমতা × সময় = 100 × 10 = 1000 Wh = 1 kWh" },
  { subject: "পদার্থবিজ্ঞান", chapter: "কাজ, ক্ষমতা ও শক্তি", source: "এডমিশন প্রস্তুতি", year: 2024, difficulty: "hard",
    questionText: "কোন ভৌত রাশির একক জুল নয়?",
    options: ["কাজ", "শক্তি", "তাপ", "ক্ষমতা"], correctIndex: 3,
    explanation: "ক্ষমতার একক ওয়াট (W); কাজ, শক্তি ও তাপের একক জুল।" },

  // PHYSICS - Waves
  { subject: "পদার্থবিজ্ঞান", chapter: "তরঙ্গ", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "বায়ুতে শব্দের গতি প্রায় কত (20°C তাপমাত্রায়)?",
    options: ["100 m/s", "243 m/s", "343 m/s", "3 × 10⁸ m/s"], correctIndex: 2,
    explanation: "20°C বায়ুতে শব্দের গতি প্রায় 343 m/s।" },
  { subject: "পদার্থবিজ্ঞান", chapter: "তরঙ্গ", source: "HSC ২০২২", year: 2022, difficulty: "easy",
    questionText: "শব্দের কম্পাঙ্কের একক কী?", options: ["মিটার", "সেকেন্ড", "হার্জ", "ডেসিবেল"], correctIndex: 2,
    explanation: "কম্পাঙ্কের একক হার্জ (Hz) = প্রতি সেকেন্ডে কম্পন সংখ্যা।" },

  // PHYSICS - Modern
  { subject: "পদার্থবিজ্ঞান", chapter: "আধুনিক পদার্থবিজ্ঞান", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "ফোটনের শক্তি E = ?", options: ["mc²", "hf", "½mv²", "qV"], correctIndex: 1,
    explanation: "ফোটনের শক্তি E = hf, যেখানে h = প্ল্যাঙ্কের ধ্রুবক।" },
  { subject: "পদার্থবিজ্ঞান", chapter: "আধুনিক পদার্থবিজ্ঞান", source: "এডমিশন প্রস্তুতি", year: 2024, difficulty: "hard",
    questionText: "প্ল্যাঙ্কের ধ্রুবকের মান প্রায় কত?",
    options: ["6.63 × 10⁻³⁴ J·s", "9.1 × 10⁻³¹ kg", "3 × 10⁸ m/s", "1.6 × 10⁻¹⁹ C"], correctIndex: 0,
    explanation: "h = 6.63 × 10⁻³⁴ J·s" },

  // CHEMISTRY - Atomic
  { subject: "রসায়ন", chapter: "পরমাণুর গঠন", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "L শেলে সর্বোচ্চ কতটি ইলেকট্রন থাকতে পারে?",
    options: ["2", "8", "18", "32"], correctIndex: 1,
    explanation: "2n² সূত্র: n = 2 হলে 2(2)² = 8।" },
  { subject: "রসায়ন", chapter: "পরমাণুর গঠন", source: "HSC ২০২২", year: 2022, difficulty: "easy",
    questionText: "ইলেকট্রনের চার্জ কত কুলম্ব?",
    options: ["1.6 × 10⁻¹⁹ C", "−1.6 × 10⁻¹⁹ C", "1.6 × 10¹⁹ C", "0"], correctIndex: 1,
    explanation: "ইলেকট্রনের চার্জ −1.6 × 10⁻¹⁹ C (ঋণাত্মক)।" },
  { subject: "রসায়ন", chapter: "পরমাণুর গঠন", source: "SSC ২০২৩", year: 2023, difficulty: "easy",
    questionText: "পরমাণুর কেন্দ্রকে কী বলে?", options: ["প্রোটন", "ইলেকট্রন", "নিউক্লিয়াস", "কোয়ার্ক"], correctIndex: 2,
    explanation: "পরমাণুর কেন্দ্রকে নিউক্লিয়াস বলে।" },

  // CHEMISTRY - Bonding
  { subject: "রসায়ন", chapter: "রাসায়নিক বন্ধন", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "নিচের কোনটি সম-যোজী যৌগ?", options: ["NaCl", "KCl", "MgO", "CO₂"], correctIndex: 3,
    explanation: "CO₂ অধাতু-অধাতু — সমযোজী।" },
  { subject: "রসায়ন", chapter: "রাসায়নিক বন্ধন", source: "এডমিশন প্রস্তুতি", year: 2024, difficulty: "hard",
    questionText: "H₂O অণুর আকৃতি কেমন?", options: ["সরলরৈখিক", "ত্রিকোণীয়", "বাঁকা / V-আকৃতির", "চতুর্ফলকীয়"], correctIndex: 2,
    explanation: "অক্সিজেনের লোন পেয়ারের কারণে H₂O বাঁকা / V-আকৃতির।" },

  // CHEMISTRY - Acids
  { subject: "রসায়ন", chapter: "এসিড, ক্ষারক ও লবণ", source: "HSC ২০২৩", year: 2023, difficulty: "easy",
    questionText: "লেবুর রসে যে এসিড থাকে তা হলো —",
    options: ["সাইট্রিক এসিড", "ল্যাকটিক এসিড", "এসিটিক এসিড", "অক্সালিক এসিড"], correctIndex: 0,
    explanation: "লেবুতে সাইট্রিক এসিড থাকে।" },
  { subject: "রসায়ন", chapter: "এসিড, ক্ষারক ও লবণ", source: "SSC ২০২২", year: 2022, difficulty: "easy",
    questionText: "ভিনেগারে যে এসিড থাকে —",
    options: ["সাইট্রিক", "এসিটিক", "ল্যাকটিক", "নাইট্রিক"], correctIndex: 1,
    explanation: "ভিনেগারে এসিটিক এসিড (CH₃COOH) থাকে।" },

  // CHEMISTRY - Organic
  { subject: "রসায়ন", chapter: "জৈব রসায়ন", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "অ্যালকেনের সাধারণ সংকেত —", options: ["CₙH₂ₙ", "CₙH₂ₙ₊₂", "CₙH₂ₙ₋₂", "CₙHₙ"], correctIndex: 1,
    explanation: "অ্যালকেনের সাধারণ সংকেত CₙH₂ₙ₊₂।" },
  { subject: "রসায়ন", chapter: "জৈব রসায়ন", source: "এডমিশন প্রস্তুতি", year: 2024, difficulty: "hard",
    questionText: "বেনজিনের আণবিক সংকেত —", options: ["C₆H₆", "C₆H₁₂", "C₅H₅", "C₆H₅OH"], correctIndex: 0,
    explanation: "বেনজিন C₆H₆।" },

  // MATH - Sets
  { subject: "গণিত", chapter: "সেট ও ফাংশন", source: "HSC ২০২৩", year: 2023, difficulty: "easy",
    questionText: "যদি n(A) = 5, n(B) = 7, n(A∩B) = 3, তবে n(A∪B) = ?",
    options: ["9", "12", "15", "10"], correctIndex: 0,
    explanation: "n(A∪B) = n(A) + n(B) − n(A∩B) = 5 + 7 − 3 = 9" },
  { subject: "গণিত", chapter: "সেট ও ফাংশন", source: "HSC ২০২২", year: 2022, difficulty: "medium",
    questionText: "যদি f(x) = x² − 1, তবে f(3) = ?", options: ["6", "8", "10", "9"], correctIndex: 1,
    explanation: "f(3) = 3² − 1 = 9 − 1 = 8" },

  // MATH - Trigonometry
  { subject: "গণিত", chapter: "ত্রিকোণমিতি", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "sin 60° এর মান —", options: ["1/2", "√3/2", "1/√2", "√3"], correctIndex: 1,
    explanation: "sin 60° = √3/2" },
  { subject: "গণিত", chapter: "ত্রিকোণমিতি", source: "এডমিশন প্রস্তুতি", year: 2024, difficulty: "hard",
    questionText: "1 + tan²θ = ?", options: ["sin²θ", "cos²θ", "sec²θ", "cosec²θ"], correctIndex: 2,
    explanation: "মৌলিক অভেদ: 1 + tan²θ = sec²θ" },
  { subject: "গণিত", chapter: "ত্রিকোণমিতি", source: "HSC ২০২১", year: 2021, difficulty: "easy",
    questionText: "cos 0° = ?", options: ["0", "1", "∞", "−1"], correctIndex: 1,
    explanation: "cos 0° = 1" },

  // MATH - Calculus
  { subject: "গণিত", chapter: "অন্তরীকরণ", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "d/dx (e^x) = ?", options: ["x·e^(x−1)", "e^x", "1", "x·e^x"], correctIndex: 1,
    explanation: "e^x এর অবকলজ e^x — এটিই একমাত্র ফাংশন যার অবকলজ নিজেই।" },
  { subject: "গণিত", chapter: "অন্তরীকরণ", source: "এডমিশন প্রস্তুতি", year: 2024, difficulty: "medium",
    questionText: "d/dx (ln x) = ?", options: ["1/x", "x", "ln x", "e^x"], correctIndex: 0,
    explanation: "d/dx (ln x) = 1/x" },

  // MATH - Integration
  { subject: "গণিত", chapter: "যোগজীকরণ", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "∫ 1/x dx = ?", options: ["x + C", "ln|x| + C", "−1/x² + C", "1 + C"], correctIndex: 1,
    explanation: "∫ 1/x dx = ln|x| + C" },
  { subject: "গণিত", chapter: "যোগজীকরণ", source: "HSC ২০২২", year: 2022, difficulty: "medium",
    questionText: "∫ e^x dx = ?", options: ["e^x + C", "x·e^x + C", "ln x + C", "e^(x+1)/(x+1) + C"], correctIndex: 0,
    explanation: "∫ e^x dx = e^x + C" },

  // MATH - Probability
  { subject: "গণিত", chapter: "সম্ভাবনা", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "একটি তাসের প্যাকেট থেকে একটি তাস তোলা হলো। তাসটি লাল হওয়ার সম্ভাবনা —",
    options: ["1/4", "1/2", "1/13", "1/26"], correctIndex: 1,
    explanation: "৫২ টি তাসের মধ্যে ২৬ টি লাল। সম্ভাবনা = 26/52 = 1/2।" },

  // BIOLOGY - Cell
  { subject: "জীববিজ্ঞান", chapter: "কোষ জীববিজ্ঞান", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "কোষ আবিষ্কার করেন কে?", options: ["রবার্ট হুক", "লিউয়েনহক", "ডারউইন", "মেন্ডেল"], correctIndex: 0,
    explanation: "১৬৬৫ সালে রবার্ট হুক কোষ আবিষ্কার করেন।" },
  { subject: "জীববিজ্ঞান", chapter: "কোষ জীববিজ্ঞান", source: "HSC ২০২২", year: 2022, difficulty: "medium",
    questionText: "প্রোক্যারিওটিক কোষে অনুপস্থিত —",
    options: ["সাইটোপ্লাজম", "DNA", "নিউক্লিয়াস", "রাইবোসোম"], correctIndex: 2,
    explanation: "প্রোক্যারিওটিক কোষে সংগঠিত নিউক্লিয়াস থাকে না।" },

  // BIOLOGY - Genetics
  { subject: "জীববিজ্ঞান", chapter: "জিনতত্ত্ব", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "DNA এর দ্বি-হেলিক্স মডেল প্রস্তাব করেন —",
    options: ["মেন্ডেল", "ওয়াটসন ও ক্রিক", "ডারউইন", "চ্যাডউইক"], correctIndex: 1,
    explanation: "১৯৫৩ সালে ওয়াটসন ও ক্রিক DNA এর দ্বি-হেলিক্স মডেল প্রস্তাব করেন।" },
  { subject: "জীববিজ্ঞান", chapter: "জিনতত্ত্ব", source: "এডমিশন প্রস্তুতি", year: 2024, difficulty: "hard",
    questionText: "DNA এর কোন বেস RNA তে অনুপস্থিত?",
    options: ["অ্যাডেনিন", "গুয়ানিন", "সাইটোসিন", "থাইমিন"], correctIndex: 3,
    explanation: "RNA তে থাইমিনের পরিবর্তে ইউরাসিল থাকে।" },

  // BIOLOGY - Physiology
  { subject: "জীববিজ্ঞান", chapter: "মানব শারীরবৃত্ত", source: "HSC ২০২৩", year: 2023, difficulty: "easy",
    questionText: "মানুষের রক্তের pH প্রায় কত?", options: ["6.4", "7.0", "7.4", "8.0"], correctIndex: 2,
    explanation: "মানুষের রক্ত সামান্য ক্ষারীয় — pH প্রায় 7.4।" },
  { subject: "জীববিজ্ঞান", chapter: "মানব শারীরবৃত্ত", source: "SSC ২০২৩", year: 2023, difficulty: "easy",
    questionText: "মানুষের শ্বাসকার্যে কোন গ্যাস ব্যবহৃত হয়?",
    options: ["O₂", "CO₂", "N₂", "H₂"], correctIndex: 0,
    explanation: "শ্বাসকার্যে অক্সিজেন (O₂) গ্রহণ ও কার্বন ডাই-অক্সাইড (CO₂) ত্যাগ হয়।" },

  // BIOLOGY - Plant
  { subject: "জীববিজ্ঞান", chapter: "উদ্ভিদ জগত", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "সালোকসংশ্লেষণ ঘটে কোষের কোন অঙ্গাণুতে?",
    options: ["মাইটোকন্ড্রিয়া", "ক্লোরোপ্লাস্ট", "রাইবোসোম", "নিউক্লিয়াস"], correctIndex: 1,
    explanation: "ক্লোরোপ্লাস্টে ক্লোরোফিলের সাহায্যে সালোকসংশ্লেষণ ঘটে।" },

  // ICT - Number Systems
  { subject: "তথ্য ও যোগাযোগ প্রযুক্তি", chapter: "সংখ্যা পদ্ধতি", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "(11111111)₂ এর দশমিক মান —", options: ["127", "128", "255", "256"], correctIndex: 2,
    explanation: "8 বিটের সর্বোচ্চ মান = 2⁸ − 1 = 255" },
  { subject: "তথ্য ও যোগাযোগ প্রযুক্তি", chapter: "সংখ্যা পদ্ধতি", source: "HSC ২০২২", year: 2022, difficulty: "easy",
    questionText: "1 KB = কত বাইট?", options: ["1000", "1024", "100", "10000"], correctIndex: 1,
    explanation: "1 KB = 2¹⁰ = 1024 byte" },
  { subject: "তথ্য ও যোগাযোগ প্রযুক্তি", chapter: "সংখ্যা পদ্ধতি", source: "এডমিশন প্রস্তুতি", year: 2024, difficulty: "medium",
    questionText: "(15)₁₀ এর হেক্সাডেসিমেল মান —", options: ["E", "F", "10", "1F"], correctIndex: 1,
    explanation: "15 = F (হেক্সে)" },

  // ICT - Programming
  { subject: "তথ্য ও যোগাযোগ প্রযুক্তি", chapter: "প্রোগ্রামিং মৌলিক", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "নিচের কোনটি একটি কম্পাইলড ভাষা?",
    options: ["Python", "JavaScript", "C", "PHP"], correctIndex: 2,
    explanation: "C কম্পাইলড ভাষা; বাকি তিনটি ইন্টারপ্রিটেড।" },
  { subject: "তথ্য ও যোগাযোগ প্রযুক্তি", chapter: "প্রোগ্রামিং মৌলিক", source: "HSC ২০২২", year: 2022, difficulty: "easy",
    questionText: "C ভাষায় int কত বাইট মেমোরি দখল করে (সাধারণত)?",
    options: ["1", "2", "4", "8"], correctIndex: 2,
    explanation: "আধুনিক সিস্টেমে int সাধারণত 4 বাইট।" },

  // ICT - Database
  { subject: "তথ্য ও যোগাযোগ প্রযুক্তি", chapter: "ডেটাবেস", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "Primary Key এর বৈশিষ্ট্য —",
    options: ["NULL হতে পারে", "ডুপ্লিকেট হতে পারে", "অনন্য ও NOT NULL", "শুধুমাত্র সংখ্যা"], correctIndex: 2,
    explanation: "Primary Key অবশ্যই অনন্য (UNIQUE) ও NOT NULL হতে হবে।" },
  { subject: "তথ্য ও যোগাযোগ প্রযুক্তি", chapter: "ডেটাবেস", source: "এডমিশন প্রস্তুতি", year: 2024, difficulty: "easy",
    questionText: "SQL এ ডেটা মুছতে ব্যবহৃত কমান্ড —",
    options: ["REMOVE", "DELETE", "DROP", "ERASE"], correctIndex: 1,
    explanation: "DELETE কমান্ড টেবিলের রো মুছে দেয়।" },

  // ICT - Networking
  { subject: "তথ্য ও যোগাযোগ প্রযুক্তি", chapter: "নেটওয়ার্কিং", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "LAN এর পূর্ণরূপ —",
    options: ["Local Access Network", "Local Area Network", "Long Area Network", "Light Area Network"], correctIndex: 1,
    explanation: "LAN = Local Area Network" },
  { subject: "তথ্য ও যোগাযোগ প্রযুক্তি", chapter: "নেটওয়ার্কিং", source: "HSC ২০২২", year: 2022, difficulty: "easy",
    questionText: "OSI মডেলে কয়টি স্তর আছে?", options: ["4", "5", "7", "9"], correctIndex: 2,
    explanation: "OSI মডেলে ৭টি স্তর আছে।" },

  // BANGLA - Grammar
  { subject: "বাংলা", chapter: "ব্যাকরণ", source: "HSC ২০২৩", year: 2023, difficulty: "easy",
    questionText: "'অহংকার' শব্দের বিপরীত শব্দ —",
    options: ["গর্ব", "নম্রতা", "দম্ভ", "অহং"], correctIndex: 1,
    explanation: "'অহংকার' এর বিপরীত শব্দ 'নম্রতা'।" },
  { subject: "বাংলা", chapter: "ব্যাকরণ", source: "HSC ২০২২", year: 2022, difficulty: "easy",
    questionText: "'রাজা' শব্দের স্ত্রীলিঙ্গ —",
    options: ["রানি", "রাজী", "রাজনি", "রাজরানি"], correctIndex: 0,
    explanation: "'রাজা'র স্ত্রীলিঙ্গ 'রানি'।" },
  { subject: "বাংলা", chapter: "ব্যাকরণ", source: "SSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "'কর্মে বিরতি' কোন সমাস?",
    options: ["দ্বন্দ্ব", "তৎপুরুষ", "বহুব্রীহি", "অব্যয়ীভাব"], correctIndex: 3,
    explanation: "'কর্মে বিরতি' = কর্মবিরতি — অব্যয়ীভাব সমাস।" },

  // BANGLA - Literature
  { subject: "বাংলা", chapter: "সাহিত্য", source: "HSC ২০২৩", year: 2023, difficulty: "easy",
    questionText: "বাংলা সাহিত্যের প্রথম মহিলা ঔপন্যাসিক কে?",
    options: ["বেগম রোকেয়া", "স্বর্ণকুমারী দেবী", "আশাপূর্ণা দেবী", "মহাশ্বেতা দেবী"], correctIndex: 1,
    explanation: "স্বর্ণকুমারী দেবী বাংলা সাহিত্যের প্রথম মহিলা ঔপন্যাসিক।" },
  { subject: "বাংলা", chapter: "সাহিত্য", source: "HSC ২০২২", year: 2022, difficulty: "medium",
    questionText: "'পদ্মা নদীর মাঝি' উপন্যাসের রচয়িতা কে?",
    options: ["শরৎচন্দ্র চট্টোপাধ্যায়", "মানিক বন্দ্যোপাধ্যায়", "বিভূতিভূষণ বন্দ্যোপাধ্যায়", "তারাশঙ্কর বন্দ্যোপাধ্যায়"], correctIndex: 1,
    explanation: "মানিক বন্দ্যোপাধ্যায় 'পদ্মা নদীর মাঝি' (১৯৩৬) রচনা করেন।" },
  { subject: "বাংলা", chapter: "সাহিত্য", source: "SSC ২০২৩", year: 2023, difficulty: "easy",
    questionText: "'অগ্নিবীণা' কাব্যগ্রন্থের রচয়িতা —",
    options: ["রবীন্দ্রনাথ ঠাকুর", "জীবনানন্দ দাশ", "কাজী নজরুল ইসলাম", "জসীমউদ্দীন"], correctIndex: 2,
    explanation: "কাজী নজরুল ইসলামের প্রথম কাব্যগ্রন্থ 'অগ্নিবীণা' (১৯২২)।" },

  // ENGLISH - Grammar
  { subject: "ইংরেজি", chapter: "Grammar", source: "HSC ২০২৩", year: 2023, difficulty: "easy",
    questionText: "Choose the correct preposition: 'He is fond ___ music.'",
    options: ["with", "of", "in", "on"], correctIndex: 1,
    explanation: "'Fond of' is the correct collocation." },
  { subject: "ইংরেজি", chapter: "Grammar", source: "HSC ২০২২", year: 2022, difficulty: "medium",
    questionText: "Choose the correct sentence:",
    options: ["He has gone to home.", "He has gone home.", "He has went home.", "He gone home."], correctIndex: 1,
    explanation: "'Home' as adverb does not need 'to'." },
  { subject: "ইংরেজি", chapter: "Grammar", source: "SSC ২০২৩", year: 2023, difficulty: "easy",
    questionText: "Past participle of 'go' is —",
    options: ["went", "gone", "going", "goes"], correctIndex: 1,
    explanation: "go — went — gone" },

  // ENGLISH - Vocabulary
  { subject: "ইংরেজি", chapter: "Vocabulary", source: "HSC ২০২৩", year: 2023, difficulty: "medium",
    questionText: "Synonym of 'Brave' —",
    options: ["Coward", "Courageous", "Weak", "Lazy"], correctIndex: 1,
    explanation: "'Courageous' = brave." },
  { subject: "ইংরেজি", chapter: "Vocabulary", source: "এডমিশন প্রস্তুতি", year: 2024, difficulty: "hard",
    questionText: "What does 'Ephemeral' mean?",
    options: ["Eternal", "Temporary / short-lived", "Permanent", "Powerful"], correctIndex: 1,
    explanation: "Ephemeral = lasting for a very short time." },

  // GK - Bangladesh
  { subject: "সাধারণ জ্ঞান", chapter: "বাংলাদেশ বিষয়াবলী", source: "BCS প্রস্তুতি", year: 2024, difficulty: "easy",
    questionText: "বাংলাদেশের জাতীয় পশু কোনটি?",
    options: ["বাঘ", "রয়েল বেঙ্গল টাইগার", "হাতি", "হরিণ"], correctIndex: 1,
    explanation: "রয়েল বেঙ্গল টাইগার বাংলাদেশের জাতীয় পশু।" },
  { subject: "সাধারণ জ্ঞান", chapter: "বাংলাদেশ বিষয়াবলী", source: "BCS প্রস্তুতি", year: 2023, difficulty: "medium",
    questionText: "বাংলাদেশের সর্বোচ্চ বিচারিক আদালত —",
    options: ["জজ কোর্ট", "হাইকোর্ট", "সুপ্রিম কোর্ট", "আপিল বিভাগ"], correctIndex: 2,
    explanation: "সুপ্রিম কোর্ট বাংলাদেশের সর্বোচ্চ বিচারিক আদালত (হাইকোর্ট ও আপিল বিভাগ মিলে)।" },
  { subject: "সাধারণ জ্ঞান", chapter: "বাংলাদেশ বিষয়াবলী", source: "BCS প্রস্তুতি", year: 2024, difficulty: "easy",
    questionText: "বাংলাদেশের জাতীয় কবি কে?",
    options: ["রবীন্দ্রনাথ ঠাকুর", "কাজী নজরুল ইসলাম", "জসীমউদ্দীন", "জীবনানন্দ দাশ"], correctIndex: 1,
    explanation: "কাজী নজরুল ইসলাম বাংলাদেশের জাতীয় কবি।" },
  { subject: "সাধারণ জ্ঞান", chapter: "বাংলাদেশ বিষয়াবলী", source: "BCS প্রস্তুতি", year: 2024, difficulty: "easy",
    questionText: "বাংলাদেশ কত সালে জাতিসংঘের সদস্য হয়?",
    options: ["১৯৭১", "১৯৭৪", "১৯৭৫", "১৯৭৬"], correctIndex: 1,
    explanation: "১৯৭৪ সালের ১৭ সেপ্টেম্বর বাংলাদেশ জাতিসংঘের সদস্যপদ লাভ করে।" },
  { subject: "সাধারণ জ্ঞান", chapter: "বাংলাদেশ বিষয়াবলী", source: "BCS প্রস্তুতি", year: 2023, difficulty: "medium",
    questionText: "বাংলাদেশের সবচেয়ে বড় নদী —",
    options: ["মেঘনা", "যমুনা", "পদ্মা", "ব্রহ্মপুত্র"], correctIndex: 0,
    explanation: "মেঘনা বাংলাদেশের সবচেয়ে বড় নদী (প্রস্থ ও বিস্তৃতিতে)।" },
  { subject: "সাধারণ জ্ঞান", chapter: "বাংলাদেশ বিষয়াবলী", source: "BCS প্রস্তুতি", year: 2024, difficulty: "easy",
    questionText: "বাংলাদেশের জাতীয় সংসদের আসন সংখ্যা —",
    options: ["২৯৯", "৩০০", "৩৫০", "৪০০"], correctIndex: 2,
    explanation: "মোট ৩৫০ আসন (৩০০ সাধারণ + ৫০ মহিলা সংরক্ষিত)।" },
  { subject: "সাধারণ জ্ঞান", chapter: "বাংলাদেশ বিষয়াবলী", source: "BCS প্রস্তুতি", year: 2023, difficulty: "easy",
    questionText: "মুক্তিযুদ্ধের সময় বাংলাদেশ কয়টি সেক্টরে বিভক্ত ছিল?",
    options: ["৭", "৯", "১০", "১১"], correctIndex: 3,
    explanation: "মুক্তিযুদ্ধের সময় বাংলাদেশকে ১১টি সেক্টরে ভাগ করা হয়েছিল।" },

  // GK - International
  { subject: "সাধারণ জ্ঞান", chapter: "আন্তর্জাতিক বিষয়াবলী", source: "BCS প্রস্তুতি", year: 2024, difficulty: "easy",
    questionText: "ASEAN এর সদর দপ্তর কোথায়?",
    options: ["জাকার্তা", "কুয়ালালামপুর", "ব্যাংকক", "সিঙ্গাপুর"], correctIndex: 0,
    explanation: "ASEAN এর সদর দপ্তর ইন্দোনেশিয়ার জাকার্তায়।" },
  { subject: "সাধারণ জ্ঞান", chapter: "আন্তর্জাতিক বিষয়াবলী", source: "BCS প্রস্তুতি", year: 2023, difficulty: "medium",
    questionText: "জাতিসংঘ প্রতিষ্ঠিত হয় কত সালে?",
    options: ["১৯৪৩", "১৯৪৫", "১৯৪৭", "১৯৫০"], correctIndex: 1,
    explanation: "১৯৪৫ সালের ২৪ অক্টোবর জাতিসংঘ প্রতিষ্ঠিত হয়।" },
  { subject: "সাধারণ জ্ঞান", chapter: "আন্তর্জাতিক বিষয়াবলী", source: "BCS প্রস্তুতি", year: 2024, difficulty: "medium",
    questionText: "বিশ্বের বৃহত্তম মহাদেশ —",
    options: ["আফ্রিকা", "ইউরোপ", "এশিয়া", "উত্তর আমেরিকা"], correctIndex: 2,
    explanation: "এশিয়া বিশ্বের বৃহত্তম মহাদেশ।" },
  { subject: "সাধারণ জ্ঞান", chapter: "আন্তর্জাতিক বিষয়াবলী", source: "BCS প্রস্তুতি", year: 2023, difficulty: "easy",
    questionText: "World Wide Web (WWW) আবিষ্কার করেন —",
    options: ["টিম বার্নার্স লি", "বিল গেটস", "স্টিভ জবস", "মার্ক জাকারবার্গ"], correctIndex: 0,
    explanation: "১৯৮৯ সালে টিম বার্নার্স লি WWW আবিষ্কার করেন।" },

  // GK - Science & Tech
  { subject: "সাধারণ জ্ঞান", chapter: "বিজ্ঞান ও প্রযুক্তি", source: "BCS প্রস্তুতি", year: 2024, difficulty: "easy",
    questionText: "মঙ্গল গ্রহকে কী বলা হয়?", options: ["নীল গ্রহ", "লাল গ্রহ", "সবুজ গ্রহ", "হলুদ গ্রহ"], correctIndex: 1,
    explanation: "আয়রন অক্সাইডের কারণে মঙ্গলকে 'লাল গ্রহ' বলা হয়।" },
  { subject: "সাধারণ জ্ঞান", chapter: "বিজ্ঞান ও প্রযুক্তি", source: "BCS প্রস্তুতি", year: 2023, difficulty: "medium",
    questionText: "মানবদেহে অস্থির সংখ্যা প্রায় কতটি (প্রাপ্তবয়স্কে)?",
    options: ["১৮৬", "২০৬", "২৫০", "৩০০"], correctIndex: 1,
    explanation: "প্রাপ্তবয়স্ক মানুষের শরীরে ২০৬টি হাড় থাকে।" },
  { subject: "সাধারণ জ্ঞান", chapter: "বিজ্ঞান ও প্রযুক্তি", source: "BCS প্রস্তুতি", year: 2024, difficulty: "easy",
    questionText: "ভিটামিন C এর রাসায়নিক নাম —",
    options: ["এসকর্বিক এসিড", "সাইট্রিক এসিড", "ফলিক এসিড", "ল্যাকটিক এসিড"], correctIndex: 0,
    explanation: "ভিটামিন C = এসকর্বিক এসিড।" },
  { subject: "সাধারণ জ্ঞান", chapter: "বিজ্ঞান ও প্রযুক্তি", source: "BCS প্রস্তুতি", year: 2023, difficulty: "medium",
    questionText: "সূর্যের শক্তির উৎস —",
    options: ["রাসায়নিক বিক্রিয়া", "নিউক্লিয়ার ফিউশন", "নিউক্লিয়ার ফিশন", "তাপশক্তি"], correctIndex: 1,
    explanation: "সূর্যে হাইড্রোজেন থেকে হিলিয়াম তৈরির ফিউশন বিক্রিয়ায় শক্তি উৎপন্ন হয়।" },
];

async function main() {
  // Build subject & chapter cache
  const allSubjects = await db.select().from(subjects);
  const subjectMap = new Map(allSubjects.map((s) => [s.nameBn, s.id]));
  const allChapters = await db.select().from(chapters);
  const chapterMap = new Map(allChapters.map((c) => [`${c.subjectId}::${c.nameBn}`, c.id]));

  let added = 0;
  let skipped = 0;
  let missing = 0;

  for (const q of Q) {
    const subjId = subjectMap.get(q.subject);
    if (!subjId) {
      missing++;
      continue;
    }
    const chapId = chapterMap.get(`${subjId}::${q.chapter}`);
    if (!chapId) {
      missing++;
      continue;
    }
    const exists = await db
      .select({ id: questions.id })
      .from(questions)
      .where(sql`${questions.chapterId} = ${chapId} AND ${questions.questionText} = ${q.questionText}`)
      .limit(1);
    if (exists.length > 0) {
      skipped++;
      continue;
    }
    await db.insert(questions).values({
      chapterId: chapId,
      questionText: q.questionText,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      difficulty: q.difficulty,
      source: q.source,
      year: q.year,
    });
    added++;
  }

  console.log(`Added ${added}, skipped ${skipped}, missing-chapter ${missing}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
