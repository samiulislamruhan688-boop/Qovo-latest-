import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Switch, Route, Router as WouterRouter } from "wouter";

import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";

import Home from "@/pages/home";
import Subjects from "@/pages/subjects/index";
import SubjectDetail from "@/pages/subjects/[id]";
import Practice from "@/pages/practice/[id]";
import Tests from "@/pages/tests/index";
import TestTaking from "@/pages/tests/[id]/index";
import TestResult from "@/pages/tests/[id]/result";
import Progress from "@/pages/progress";
import Leaderboard from "@/pages/leaderboard";
import ChatList from "@/pages/chat/index";
import Chat from "@/pages/chat/[id]";
import ImportPage from "@/pages/import";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/subjects" component={Subjects} />
      <Route path="/subjects/:subjectId" component={SubjectDetail} />
      <Route path="/practice/:chapterId" component={Practice} />
      <Route path="/tests" component={Tests} />
      <Route path="/tests/:testId" component={TestTaking} />
      <Route path="/tests/:testId/result" component={TestResult} />
      <Route path="/progress" component={Progress} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/chat" component={ChatList} />
      <Route path="/chat/:conversationId" component={Chat} />
      <Route path="/import" component={ImportPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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
