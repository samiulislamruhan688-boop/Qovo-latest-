import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { useState, useCallback } from "react";

import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";
import { SplashScreen } from "@/components/SplashScreen";

import Home from "@/pages/home";
import Subjects from "@/pages/subjects/index";
import SubjectDetail from "@/pages/subjects/[id]";
import Practice from "@/pages/practice/[id]";
import MultiPractice from "@/pages/practice/multi";
import Tests from "@/pages/tests/index";
import TestTaking from "@/pages/tests/[id]/index";
import TestResult from "@/pages/tests/[id]/result";
import Progress from "@/pages/progress";
import Leaderboard from "@/pages/leaderboard";
import ChatList from "@/pages/chat/index";
import Chat from "@/pages/chat/[id]";
import ImportPage from "@/pages/import";
import ReviewPage from "@/pages/review";
import SubjectTest from "@/pages/tests/subject/[subjectId]";
import ProfilePage from "@/pages/profile";
import SourcePage from "@/pages/source";
import AdminPage from "@/pages/admin";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/subjects" component={Subjects} />
      <Route path="/subjects/:subjectId" component={SubjectDetail} />
      <Route path="/practice/multi" component={MultiPractice} />
      <Route path="/practice/:chapterId" component={Practice} />
      <Route path="/tests" component={Tests} />
      <Route path="/tests/subject/:subjectId" component={SubjectTest} />
      <Route path="/tests/:testId" component={TestTaking} />
      <Route path="/tests/:testId/result" component={TestResult} />
      <Route path="/progress" component={Progress} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/chat" component={ChatList} />
      <Route path="/chat/:conversationId" component={Chat} />
      <Route path="/import" component={ImportPage} />
      <Route path="/review" component={ReviewPage} />
      <Route path="/source" component={SourcePage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(
    () =>
      sessionStorage.getItem("qovo-splash-seen") === "1" ||
      new URLSearchParams(window.location.search).has("nosplash"),
  );
  const handleSplashDone = useCallback(() => {
    sessionStorage.setItem("qovo-splash-seen", "1");
    setSplashDone(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!splashDone && <SplashScreen onDone={handleSplashDone} />}
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppLayout>
            <Router />
          </AppLayout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
