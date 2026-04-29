import { db, subjects, chapters, questions, tests } from "@workspace/db";

async function main() {
  const existing = await db.select().from(subjects);
  if (existing.length > 0) {
    console.log("Already seeded");
    process.exit(0);
  }

  const subjectData = [
    { name: "Physics", nameBn: "পদার্থবিজ্ঞান", icon: "Atom", color: "#06B6D4", description: "গতিবিদ্যা, তরঙ্গ, বিদ্যুৎ ও আধুনিক পদার্থবিজ্ঞান" },
    { name: "Chemistry", nameBn: "রসায়ন", icon: "FlaskConical", color: "#A855F7", description: "জৈব, অজৈব ও ভৌত রসায়ন" },
    { name: "Mathematics", nameBn: "গণিত", icon: "Sigma", color: "#F97316", description: "বীজগণিত, ক্যালকুলাস, ত্রিকোণমিতি" },
    { name: "Biology", nameBn: "জীববিজ্ঞান", icon: "Leaf", color: "#10B981", description: "উদ্ভিদ ও প্রাণী জীববিজ্ঞান, জিনতত্ত্ব" },
    { name: "ICT", nameBn: "তথ্য ও যোগাযোগ প্রযুক্তি", icon: "Cpu", color: "#3B82F6", description: "প্রোগ্রামিং, ডেটাবেস, নেটওয়ার্কিং" },
    { name: "Bangla", nameBn: "বাংলা", icon: "BookOpen", color: "#EC4899", description: "ব্যাকরণ, সাহিত্য, রচনা" },
    { name: "English", nameBn: "ইংরেজি", icon: "Languages", color: "#F59E0B", description: "Grammar, vocabulary, comprehension" },
    { name: "General Knowledge", nameBn: "সাধারণ জ্ঞান", icon: "Globe", color: "#EF4444", description: "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলী" },
  ];

  const insertedSubjects = await db.insert(subjects).values(subjectData).returning();

  type ChapterSeed = {
    subjectId: number;
    name: string;
    nameBn: string;
    orderIndex: number;
  };
  const chaptersBySubject: Record<string, { name: string; nameBn: string }[]> = {
    Physics: [
      { name: "Vectors", nameBn: "ভেক্টর" },
      { name: "Motion in One Dimension", nameBn: "এক মাত্রিক গতি" },
      { name: "Work, Energy & Power", nameBn: "কাজ, ক্ষমতা ও শক্তি" },
      { name: "Waves", nameBn: "তরঙ্গ" },
      { name: "Modern Physics", nameBn: "আধুনিক পদার্থবিজ্ঞান" },
    ],
    Chemistry: [
      { name: "Atomic Structure", nameBn: "পরমাণুর গঠন" },
      { name: "Chemical Bonding", nameBn: "রাসায়নিক বন্ধন" },
      { name: "Acids, Bases & Salts", nameBn: "এসিড, ক্ষারক ও লবণ" },
      { name: "Organic Chemistry", nameBn: "জৈব রসায়ন" },
    ],
    Mathematics: [
      { name: "Sets & Functions", nameBn: "সেট ও ফাংশন" },
      { name: "Trigonometry", nameBn: "ত্রিকোণমিতি" },
      { name: "Differential Calculus", nameBn: "অন্তরীকরণ" },
      { name: "Integration", nameBn: "যোগজীকরণ" },
      { name: "Probability", nameBn: "সম্ভাবনা" },
    ],
    Biology: [
      { name: "Cell Biology", nameBn: "কোষ জীববিজ্ঞান" },
      { name: "Genetics", nameBn: "জিনতত্ত্ব" },
      { name: "Human Physiology", nameBn: "মানব শারীরবৃত্ত" },
      { name: "Plant Kingdom", nameBn: "উদ্ভিদ জগত" },
    ],
    ICT: [
      { name: "Number Systems", nameBn: "সংখ্যা পদ্ধতি" },
      { name: "Programming Basics", nameBn: "প্রোগ্রামিং মৌলিক" },
      { name: "Database", nameBn: "ডেটাবেস" },
      { name: "Networking", nameBn: "নেটওয়ার্কিং" },
    ],
    Bangla: [
      { name: "Grammar", nameBn: "ব্যাকরণ" },
      { name: "Literature", nameBn: "সাহিত্য" },
      { name: "Composition", nameBn: "রচনা" },
    ],
    English: [
      { name: "Grammar", nameBn: "Grammar" },
      { name: "Vocabulary", nameBn: "Vocabulary" },
      { name: "Reading Comprehension", nameBn: "Reading" },
    ],
    "General Knowledge": [
      { name: "Bangladesh Affairs", nameBn: "বাংলাদেশ বিষয়াবলী" },
      { name: "International Affairs", nameBn: "আন্তর্জাতিক বিষয়াবলী" },
      { name: "Science & Technology", nameBn: "বিজ্ঞান ও প্রযুক্তি" },
    ],
  };

  const chapterSeeds: ChapterSeed[] = [];
  for (const s of insertedSubjects) {
    const list = chaptersBySubject[s.name] ?? [];
    list.forEach((c, i) => {
      chapterSeeds.push({ subjectId: s.id, name: c.name, nameBn: c.nameBn, orderIndex: i });
    });
  }
  const insertedChapters = await db.insert(chapters).values(chapterSeeds).returning();

  // Seed questions per chapter
  type QSeed = {
    chapterId: number;
    questionText: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    difficulty: string;
  };

  const questionBank: Record<string, QSeed[]> = {};
  function add(chapterName: string, qs: Omit<QSeed, "chapterId">[]) {
    questionBank[chapterName] = qs.map((q) => ({ ...q, chapterId: 0 }));
  }

  add("Vectors", [
    {
      questionText: "দুটি ভেক্টরের ক্রস গুণফল সর্বোচ্চ হয় যখন তাদের মধ্যবর্তী কোণ কত?",
      options: ["0°", "45°", "90°", "180°"],
      correctIndex: 2,
      explanation: "A × B = AB sinθ। sinθ সর্বোচ্চ হয় θ = 90° এ।",
      difficulty: "easy",
    },
    {
      questionText: "নিচের কোনটি স্কেলার রাশি?",
      options: ["বেগ", "ত্বরণ", "তাপমাত্রা", "বল"],
      correctIndex: 2,
      explanation: "তাপমাত্রার শুধু মান আছে, দিক নেই — তাই এটি স্কেলার।",
      difficulty: "easy",
    },
    {
      questionText: "একটি ভেক্টরের x-উপাংশ 3 এবং y-উপাংশ 4 হলে এর মান কত?",
      options: ["5", "7", "12", "25"],
      correctIndex: 0,
      explanation: "|V| = √(3² + 4²) = √25 = 5",
      difficulty: "medium",
    },
    {
      questionText: "ডট গুণফল A·B = 0 হলে A এবং B এর মধ্যবর্তী কোণ কত?",
      options: ["0°", "60°", "90°", "180°"],
      correctIndex: 2,
      explanation: "A·B = AB cosθ = 0 হলে cosθ = 0, অর্থাৎ θ = 90°।",
      difficulty: "medium",
    },
  ]);

  add("Motion in One Dimension", [
    {
      questionText: "একটি বস্তু স্থির অবস্থা থেকে সমত্বরণে চলতে শুরু করে। 2 সেকেন্ডে 10 m/s বেগ পেলে ত্বরণ কত?",
      options: ["2 m/s²", "5 m/s²", "10 m/s²", "20 m/s²"],
      correctIndex: 1,
      explanation: "a = (v - u) / t = (10 - 0) / 2 = 5 m/s²",
      difficulty: "easy",
    },
    {
      questionText: "অভিকর্ষজ ত্বরণের আদর্শ মান (পৃথিবীতে) প্রায় কত?",
      options: ["8.9 m/s²", "9.8 m/s²", "10.5 m/s²", "11.2 m/s²"],
      correctIndex: 1,
      explanation: "g ≈ 9.8 m/s² (পৃথিবীর পৃষ্ঠে আদর্শ মান)।",
      difficulty: "easy",
    },
    {
      questionText: "v² = u² + 2as — সমীকরণটি কোন ক্ষেত্রে প্রযোজ্য?",
      options: ["শুধু অসমান ত্বরণ", "শুধু সমত্বরণ", "যেকোনো গতি", "শুধু স্থির গতি"],
      correctIndex: 1,
      explanation: "এটি সমত্বরণ গতির তৃতীয় সূত্র।",
      difficulty: "medium",
    },
  ]);

  add("Work, Energy & Power", [
    {
      questionText: "1 অশ্বশক্তি (HP) কত ওয়াটের সমান?",
      options: ["546 W", "646 W", "746 W", "846 W"],
      correctIndex: 2,
      explanation: "1 HP = 746 W",
      difficulty: "easy",
    },
    {
      questionText: "গতিশক্তির সূত্র কোনটি?",
      options: ["mgh", "½mv²", "mv", "Fd"],
      correctIndex: 1,
      explanation: "KE = ½mv²",
      difficulty: "easy",
    },
    {
      questionText: "একটি 2 kg বস্তু 5 m/s বেগে চলছে। এর গতিশক্তি কত?",
      options: ["10 J", "25 J", "50 J", "100 J"],
      correctIndex: 1,
      explanation: "KE = ½ × 2 × 5² = 25 J",
      difficulty: "medium",
    },
  ]);

  add("Waves", [
    {
      questionText: "শব্দ তরঙ্গ কোন ধরনের তরঙ্গ?",
      options: ["আড় তরঙ্গ", "অনুদৈর্ঘ্য তরঙ্গ", "তড়িৎচুম্বকীয় তরঙ্গ", "স্থির তরঙ্গ"],
      correctIndex: 1,
      explanation: "শব্দ তরঙ্গ একটি যান্ত্রিক অনুদৈর্ঘ্য তরঙ্গ।",
      difficulty: "easy",
    },
    {
      questionText: "তরঙ্গের বেগ, তরঙ্গদৈর্ঘ্য এবং কম্পাঙ্কের মধ্যে সম্পর্ক কী?",
      options: ["v = f / λ", "v = f × λ", "v = λ / f", "v = f + λ"],
      correctIndex: 1,
      explanation: "v = fλ (বেগ = কম্পাঙ্ক × তরঙ্গদৈর্ঘ্য)",
      difficulty: "medium",
    },
  ]);

  add("Modern Physics", [
    {
      questionText: "আইনস্টাইনের ভর-শক্তি সমীকরণ কোনটি?",
      options: ["E = mc", "E = mc²", "E = m/c", "E = m + c²"],
      correctIndex: 1,
      explanation: "E = mc² — আইনস্টাইনের বিখ্যাত সমীকরণ।",
      difficulty: "easy",
    },
    {
      questionText: "একটি ফোটনের শক্তি কীসের সমানুপাতিক?",
      options: ["তরঙ্গদৈর্ঘ্য", "কম্পাঙ্ক", "বেগ", "ভর"],
      correctIndex: 1,
      explanation: "E = hf, কম্পাঙ্কের সমানুপাতিক।",
      difficulty: "medium",
    },
  ]);

  add("Atomic Structure", [
    {
      questionText: "একটি পরমাণুর প্রোটন সংখ্যা ও ইলেকট্রন সংখ্যার সম্পর্ক কী (নিরপেক্ষ অবস্থায়)?",
      options: ["প্রোটন > ইলেকট্রন", "প্রোটন = ইলেকট্রন", "প্রোটন < ইলেকট্রন", "কোনো সম্পর্ক নেই"],
      correctIndex: 1,
      explanation: "নিরপেক্ষ পরমাণুতে প্রোটন ও ইলেকট্রন সংখ্যা সমান।",
      difficulty: "easy",
    },
    {
      questionText: "K শেল-এ সর্বোচ্চ কতটি ইলেকট্রন থাকতে পারে?",
      options: ["2", "8", "18", "32"],
      correctIndex: 0,
      explanation: "2n² সূত্র অনুসারে n=1 হলে 2(1)² = 2।",
      difficulty: "easy",
    },
    {
      questionText: "নিউট্রন আবিষ্কার করেন কে?",
      options: ["রাদারফোর্ড", "চ্যাডউইক", "বোর", "টমসন"],
      correctIndex: 1,
      explanation: "১৯৩২ সালে জেমস চ্যাডউইক নিউট্রন আবিষ্কার করেন।",
      difficulty: "medium",
    },
  ]);

  add("Chemical Bonding", [
    {
      questionText: "NaCl কোন ধরনের বন্ধন দ্বারা গঠিত?",
      options: ["সমযোজী", "আয়নিক", "ধাতব", "হাইড্রোজেন"],
      correctIndex: 1,
      explanation: "Na ইলেকট্রন দান করে Cl গ্রহণ করে — আয়নিক বন্ধন।",
      difficulty: "easy",
    },
    {
      questionText: "পানির অণুতে H এবং O এর মধ্যে কোন বন্ধন থাকে?",
      options: ["আয়নিক", "সমযোজী", "ধাতব", "ভ্যান ডার ওয়ালস"],
      correctIndex: 1,
      explanation: "H₂O এ H ও O ইলেকট্রন ভাগাভাগি করে — সমযোজী বন্ধন।",
      difficulty: "easy",
    },
  ]);

  add("Acids, Bases & Salts", [
    {
      questionText: "নিরপেক্ষ pH মান কত?",
      options: ["0", "5", "7", "14"],
      correctIndex: 2,
      explanation: "pH = 7 নিরপেক্ষ (যেমন বিশুদ্ধ পানি)।",
      difficulty: "easy",
    },
    {
      questionText: "নিচের কোনটি একটি শক্তিশালী ক্ষারক?",
      options: ["NH₃", "NaOH", "CH₃COOH", "H₂CO₃"],
      correctIndex: 1,
      explanation: "NaOH (সোডিয়াম হাইড্রক্সাইড) একটি শক্তিশালী ক্ষারক।",
      difficulty: "medium",
    },
  ]);

  add("Organic Chemistry", [
    {
      questionText: "মিথেন (CH₄) এর হাইব্রিডাইজেশন কী?",
      options: ["sp", "sp²", "sp³", "sp³d"],
      correctIndex: 2,
      explanation: "CH₄ এর কেন্দ্রীয় C পরমাণু sp³ হাইব্রিডাইজড।",
      difficulty: "medium",
    },
    {
      questionText: "নিচের কোনটি অসম্পৃক্ত হাইড্রোকার্বন?",
      options: ["মিথেন", "ইথেন", "প্রোপেন", "ইথিন"],
      correctIndex: 3,
      explanation: "ইথিন (C₂H₄) এ দ্বি-বন্ধন রয়েছে — অসম্পৃক্ত।",
      difficulty: "easy",
    },
  ]);

  add("Sets & Functions", [
    {
      questionText: "যদি A = {1,2,3} এবং B = {3,4,5} হয়, তবে A ∩ B = ?",
      options: ["{1,2}", "{3}", "{4,5}", "{1,2,3,4,5}"],
      correctIndex: 1,
      explanation: "ছেদ — সাধারণ উপাদান হলো {3}।",
      difficulty: "easy",
    },
    {
      questionText: "ফাংশন f(x) = 2x + 3, f(5) = ?",
      options: ["10", "11", "13", "15"],
      correctIndex: 2,
      explanation: "f(5) = 2(5) + 3 = 13",
      difficulty: "easy",
    },
  ]);

  add("Trigonometry", [
    {
      questionText: "sin 30° + cos 60° = ?",
      options: ["0", "0.5", "1", "1.5"],
      correctIndex: 2,
      explanation: "sin 30° = 0.5 এবং cos 60° = 0.5, যোগফল = 1।",
      difficulty: "easy",
    },
    {
      questionText: "tan 45° এর মান কত?",
      options: ["0", "0.5", "1", "√3"],
      correctIndex: 2,
      explanation: "tan 45° = 1",
      difficulty: "easy",
    },
    {
      questionText: "sin²θ + cos²θ = ?",
      options: ["0", "1", "2", "tan²θ"],
      correctIndex: 1,
      explanation: "মৌলিক ত্রিকোণমিতিক অভেদ — sin²θ + cos²θ = 1।",
      difficulty: "easy",
    },
  ]);

  add("Differential Calculus", [
    {
      questionText: "d/dx (x³) = ?",
      options: ["x²", "2x²", "3x²", "x³/3"],
      correctIndex: 2,
      explanation: "ক্ষমতা সূত্র: d/dx(xⁿ) = n·xⁿ⁻¹",
      difficulty: "easy",
    },
    {
      questionText: "d/dx (sin x) = ?",
      options: ["cos x", "-cos x", "-sin x", "tan x"],
      correctIndex: 0,
      explanation: "sin x এর অবকলজ cos x।",
      difficulty: "easy",
    },
  ]);

  add("Integration", [
    {
      questionText: "∫ x² dx = ?",
      options: ["2x + C", "x³/3 + C", "x³ + C", "3x² + C"],
      correctIndex: 1,
      explanation: "∫ xⁿ dx = xⁿ⁺¹/(n+1) + C",
      difficulty: "easy",
    },
    {
      questionText: "∫ cos x dx = ?",
      options: ["sin x + C", "-sin x + C", "-cos x + C", "tan x + C"],
      correctIndex: 0,
      explanation: "cos x এর অখণ্ড sin x + C।",
      difficulty: "easy",
    },
  ]);

  add("Probability", [
    {
      questionText: "একটি মুদ্রা একবার নিক্ষেপ করলে হেড আসার সম্ভাবনা কত?",
      options: ["1/4", "1/3", "1/2", "1"],
      correctIndex: 2,
      explanation: "দুটি সম্ভাব্য ফলাফলের মধ্যে একটি — 1/2।",
      difficulty: "easy",
    },
    {
      questionText: "একটি ছক্কা নিক্ষেপ করলে জোড় সংখ্যা আসার সম্ভাবনা কত?",
      options: ["1/6", "1/3", "1/2", "2/3"],
      correctIndex: 2,
      explanation: "জোড় সংখ্যা: 2,4,6 — তিনটি; মোট ছয়টি — 3/6 = 1/2।",
      difficulty: "medium",
    },
  ]);

  add("Cell Biology", [
    {
      questionText: "কোষের পাওয়ার হাউস বলা হয় কাকে?",
      options: ["নিউক্লিয়াস", "মাইটোকন্ড্রিয়া", "রাইবোসোম", "গলগি বডি"],
      correctIndex: 1,
      explanation: "মাইটোকন্ড্রিয়া ATP উৎপাদন করে — কোষের পাওয়ার হাউস।",
      difficulty: "easy",
    },
    {
      questionText: "প্রোটিন সংশ্লেষণ ঘটে কোথায়?",
      options: ["নিউক্লিয়াস", "মাইটোকন্ড্রিয়া", "রাইবোসোম", "লাইসোসোম"],
      correctIndex: 2,
      explanation: "রাইবোসোম প্রোটিন সংশ্লেষণের কারখানা।",
      difficulty: "easy",
    },
  ]);

  add("Genetics", [
    {
      questionText: "DNA এর পূর্ণরূপ কী?",
      options: ["Deoxyribonucleic Acid", "Dinucleic Acid", "Diribonucleic Acid", "Doublenucleic Acid"],
      correctIndex: 0,
      explanation: "DNA = Deoxyribonucleic Acid",
      difficulty: "easy",
    },
    {
      questionText: "মানুষের শরীরে কত জোড়া ক্রোমোজোম থাকে?",
      options: ["22", "23", "44", "46"],
      correctIndex: 1,
      explanation: "মানুষের 23 জোড়া (মোট 46) ক্রোমোজোম থাকে।",
      difficulty: "easy",
    },
  ]);

  add("Human Physiology", [
    {
      questionText: "মানব হৃদয়ের কয়টি প্রকোষ্ঠ থাকে?",
      options: ["2", "3", "4", "5"],
      correctIndex: 2,
      explanation: "চারটি — দুটি অলিন্দ ও দুটি নিলয়।",
      difficulty: "easy",
    },
    {
      questionText: "রক্তের কোন উপাদান অক্সিজেন বহন করে?",
      options: ["প্লাজমা", "শ্বেত রক্তকণিকা", "লোহিত রক্তকণিকা", "অণুচক্রিকা"],
      correctIndex: 2,
      explanation: "লোহিত রক্তকণিকার হিমোগ্লোবিন অক্সিজেন বহন করে।",
      difficulty: "easy",
    },
  ]);

  add("Plant Kingdom", [
    {
      questionText: "সালোকসংশ্লেষণ প্রক্রিয়ায় কোন গ্যাস উৎপন্ন হয়?",
      options: ["CO₂", "O₂", "N₂", "H₂"],
      correctIndex: 1,
      explanation: "সালোকসংশ্লেষণে অক্সিজেন (O₂) উৎপন্ন হয়।",
      difficulty: "easy",
    },
  ]);

  add("Number Systems", [
    {
      questionText: "বাইনারি (1010)₂ এর দশমিক মান কত?",
      options: ["8", "10", "12", "14"],
      correctIndex: 1,
      explanation: "1×8 + 0×4 + 1×2 + 0×1 = 10",
      difficulty: "easy",
    },
    {
      questionText: "1 বাইট = কত বিট?",
      options: ["4", "8", "16", "32"],
      correctIndex: 1,
      explanation: "1 byte = 8 bits",
      difficulty: "easy",
    },
  ]);

  add("Programming Basics", [
    {
      questionText: "কোনটি একটি লুপ স্টেটমেন্ট?",
      options: ["if", "switch", "for", "return"],
      correctIndex: 2,
      explanation: "for একটি লুপ স্টেটমেন্ট।",
      difficulty: "easy",
    },
    {
      questionText: "C ভাষায় কোন ফাংশন থেকে প্রোগ্রাম শুরু হয়?",
      options: ["start()", "begin()", "main()", "init()"],
      correctIndex: 2,
      explanation: "C প্রোগ্রাম main() থেকে শুরু হয়।",
      difficulty: "easy",
    },
  ]);

  add("Database", [
    {
      questionText: "SQL এ কোন কমান্ড ডেটা যোগ করতে ব্যবহৃত হয়?",
      options: ["SELECT", "INSERT", "UPDATE", "DELETE"],
      correctIndex: 1,
      explanation: "INSERT কমান্ড নতুন ডেটা যোগ করে।",
      difficulty: "easy",
    },
    {
      questionText: "DBMS এর পূর্ণরূপ কী?",
      options: ["Data Backup Management System", "Database Management System", "Digital Backup Management Software", "Data Box Management Service"],
      correctIndex: 1,
      explanation: "DBMS = Database Management System",
      difficulty: "easy",
    },
  ]);

  add("Networking", [
    {
      questionText: "HTTP এর পূর্ণরূপ কী?",
      options: ["HyperText Transfer Protocol", "HighText Transfer Protocol", "HyperTool Transfer Protocol", "HyperText Transmission Procedure"],
      correctIndex: 0,
      explanation: "HTTP = HyperText Transfer Protocol",
      difficulty: "easy",
    },
    {
      questionText: "ইন্টারনেটে IP এর পূর্ণরূপ কী?",
      options: ["Internal Protocol", "Internet Protocol", "Interconnect Protocol", "International Protocol"],
      correctIndex: 1,
      explanation: "IP = Internet Protocol",
      difficulty: "easy",
    },
  ]);

  add("Grammar", [
    {
      questionText: "'বই' শব্দের বহুবচন রূপ কোনটি?",
      options: ["বইগুলো", "বইয়ের", "বইকে", "বইয়ে"],
      correctIndex: 0,
      explanation: "বহুবচন বোঝাতে 'গুলো' প্রত্যয় যুক্ত হয়।",
      difficulty: "easy",
    },
    {
      questionText: "নিচের কোনটি ক্রিয়াপদ?",
      options: ["সুন্দর", "ছেলে", "যাচ্ছে", "তিনি"],
      correctIndex: 2,
      explanation: "'যাচ্ছে' একটি ক্রিয়াপদ।",
      difficulty: "easy",
    },
  ]);

  add("Literature", [
    {
      questionText: "'গীতাঞ্জলি' কাব্যগ্রন্থের রচয়িতা কে?",
      options: ["কাজী নজরুল ইসলাম", "রবীন্দ্রনাথ ঠাকুর", "জীবনানন্দ দাশ", "মাইকেল মধুসূদন দত্ত"],
      correctIndex: 1,
      explanation: "রবীন্দ্রনাথ ঠাকুর গীতাঞ্জলি রচনার জন্য নোবেল পুরস্কার পান (1913)।",
      difficulty: "easy",
    },
    {
      questionText: "'বিদ্রোহী' কবিতার কবি কে?",
      options: ["রবীন্দ্রনাথ ঠাকুর", "জীবনানন্দ দাশ", "কাজী নজরুল ইসলাম", "সুকান্ত ভট্টাচার্য"],
      correctIndex: 2,
      explanation: "'বিদ্রোহী' কাজী নজরুল ইসলামের রচনা।",
      difficulty: "easy",
    },
  ]);

  add("Composition", [
    {
      questionText: "একটি ভালো রচনার প্রথম অংশকে কী বলে?",
      options: ["মূল অংশ", "ভূমিকা", "উপসংহার", "সারসংক্ষেপ"],
      correctIndex: 1,
      explanation: "রচনার শুরুতে ভূমিকা থাকে।",
      difficulty: "easy",
    },
  ]);

  add("Vocabulary", [
    {
      questionText: "Synonym of 'Happy' is —",
      options: ["Sad", "Joyful", "Angry", "Tired"],
      correctIndex: 1,
      explanation: "'Joyful' means full of happiness.",
      difficulty: "easy",
    },
    {
      questionText: "Antonym of 'Begin' is —",
      options: ["Start", "Open", "End", "Continue"],
      correctIndex: 2,
      explanation: "'End' is opposite of 'Begin'.",
      difficulty: "easy",
    },
  ]);

  add("Reading Comprehension", [
    {
      questionText: "Choose the correct meaning of 'Bibliophile':",
      options: ["A person who hates books", "A book collector / lover", "A book seller", "A librarian"],
      correctIndex: 1,
      explanation: "Bibliophile = a lover of books.",
      difficulty: "medium",
    },
  ]);

  // English -> 'Grammar' chapter clashes with Bangla 'Grammar' — bank uses subject-aware key by name only.
  // To handle: re-add English Grammar with a different key
  questionBank["English-Grammar"] = [
    {
      chapterId: 0,
      questionText: "Choose the correct sentence:",
      options: ["He don't like tea.", "He doesn't likes tea.", "He doesn't like tea.", "He not like tea."],
      correctIndex: 2,
      explanation: "Third person singular: 'doesn't' + base verb.",
      difficulty: "easy",
    },
    {
      chapterId: 0,
      questionText: "Identify the correct passive form: 'She writes a letter.'",
      options: ["A letter is written by her.", "A letter was written by her.", "A letter has written by her.", "A letter writes by her."],
      correctIndex: 0,
      explanation: "Simple present passive: is/am/are + past participle.",
      difficulty: "medium",
    },
  ];

  add("Bangladesh Affairs", [
    {
      questionText: "বাংলাদেশের রাজধানী কোনটি?",
      options: ["চট্টগ্রাম", "ঢাকা", "রাজশাহী", "সিলেট"],
      correctIndex: 1,
      explanation: "ঢাকা বাংলাদেশের রাজধানী।",
      difficulty: "easy",
    },
    {
      questionText: "বাংলাদেশ স্বাধীনতা লাভ করে কোন সালে?",
      options: ["১৯৪৭", "১৯৫২", "১৯৭১", "১৯৭৫"],
      correctIndex: 2,
      explanation: "১৯৭১ সালের ১৬ ডিসেম্বর বাংলাদেশ স্বাধীনতা লাভ করে।",
      difficulty: "easy",
    },
    {
      questionText: "বাংলাদেশের জাতীয় ফুল কোনটি?",
      options: ["গোলাপ", "শাপলা", "জবা", "পদ্ম"],
      correctIndex: 1,
      explanation: "শাপলা বাংলাদেশের জাতীয় ফুল।",
      difficulty: "easy",
    },
  ]);

  add("International Affairs", [
    {
      questionText: "জাতিসংঘের সদর দপ্তর কোথায় অবস্থিত?",
      options: ["জেনেভা", "নিউইয়র্ক", "প্যারিস", "লন্ডন"],
      correctIndex: 1,
      explanation: "জাতিসংঘের সদর দপ্তর নিউইয়র্কে।",
      difficulty: "easy",
    },
    {
      questionText: "WHO এর পূর্ণরূপ কী?",
      options: ["World Health Organization", "World Hospital Organization", "World Health Office", "World Help Organization"],
      correctIndex: 0,
      explanation: "WHO = World Health Organization",
      difficulty: "easy",
    },
  ]);

  add("Science & Technology", [
    {
      questionText: "AI এর পূর্ণরূপ কী?",
      options: ["Automatic Intelligence", "Artificial Intelligence", "Auto Internet", "Advanced Internet"],
      correctIndex: 1,
      explanation: "AI = Artificial Intelligence",
      difficulty: "easy",
    },
    {
      questionText: "পৃথিবীর প্রথম কম্পিউটার প্রোগ্রামার কে?",
      options: ["এলান টুরিং", "অ্যাডা লাভলেস", "চার্লস ব্যাবেজ", "জন ভন নিউম্যান"],
      correctIndex: 1,
      explanation: "অ্যাডা লাভলেসকে প্রথম কম্পিউটার প্রোগ্রামার বলা হয়।",
      difficulty: "medium",
    },
  ]);

  // Build flat list with chapter IDs
  const allQuestions: QSeed[] = [];
  for (const ch of insertedChapters) {
    const subjectName = insertedSubjects.find((s) => s.id === ch.subjectId)?.name;
    let key = ch.name;
    if (subjectName === "English" && ch.name === "Grammar") key = "English-Grammar";
    const list = questionBank[key];
    if (list) {
      for (const q of list) {
        allQuestions.push({ ...q, chapterId: ch.id });
      }
    }
  }
  const insertedQuestions = await db.insert(questions).values(allQuestions).returning();

  // Create model tests by sampling questions per subject
  const subjectTestPlans = [
    { subj: "Physics", titleBn: "পদার্থবিজ্ঞান মডেল টেস্ট ১", title: "Physics Model Test 1", duration: 25, difficulty: "medium", desc: "পদার্থবিজ্ঞানের সব অধ্যায় থেকে নির্বাচিত প্রশ্ন।" },
    { subj: "Chemistry", titleBn: "রসায়ন মডেল টেস্ট ১", title: "Chemistry Model Test 1", duration: 20, difficulty: "medium", desc: "রসায়নের গুরুত্বপূর্ণ অধ্যায় থেকে।" },
    { subj: "Mathematics", titleBn: "গণিত দ্রুত পরীক্ষা", title: "Math Quick Test", duration: 15, difficulty: "easy", desc: "মৌলিক গাণিতিক ধারণা যাচাই।" },
    { subj: "Biology", titleBn: "জীববিজ্ঞান মডেল টেস্ট", title: "Biology Model Test", duration: 20, difficulty: "medium", desc: "কোষ, জিনতত্ত্ব ও শারীরবৃত্ত।" },
    { subj: "ICT", titleBn: "ICT সাধারণ পরীক্ষা", title: "ICT General Test", duration: 15, difficulty: "easy", desc: "তথ্য প্রযুক্তির মৌলিক বিষয়।" },
    { subj: "General Knowledge", titleBn: "সাধারণ জ্ঞান চ্যালেঞ্জ", title: "GK Challenge", duration: 15, difficulty: "easy", desc: "বাংলাদেশ ও বিশ্ব বিষয়াবলী।" },
  ];

  const testRows = [];
  for (const plan of subjectTestPlans) {
    const subj = insertedSubjects.find((s) => s.name === plan.subj);
    if (!subj) continue;
    const subjChapterIds = insertedChapters.filter((c) => c.subjectId === subj.id).map((c) => c.id);
    const subjQuestions = insertedQuestions.filter((q) => subjChapterIds.includes(q.chapterId));
    const sampled = subjQuestions.slice(0, Math.min(10, subjQuestions.length)).map((q) => q.id);
    if (sampled.length === 0) continue;
    testRows.push({
      title: plan.title,
      titleBn: plan.titleBn,
      description: plan.desc,
      durationMinutes: plan.duration,
      difficulty: plan.difficulty,
      subjectName: subj.nameBn,
      questionIds: sampled,
    });
  }

  // Mixed test
  const mixedSample = insertedQuestions.slice(0, 15).map((q) => q.id);
  testRows.push({
    title: "Mixed Subject Test",
    titleBn: "মিশ্র বিষয়ের পরীক্ষা",
    description: "সব বিষয়ের একটি সম্মিলিত পরীক্ষা।",
    durationMinutes: 30,
    difficulty: "medium",
    subjectName: "মিশ্র",
    questionIds: mixedSample,
  });

  await db.insert(tests).values(testRows);

  console.log(`Seeded ${insertedSubjects.length} subjects, ${insertedChapters.length} chapters, ${insertedQuestions.length} questions, ${testRows.length} tests`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
