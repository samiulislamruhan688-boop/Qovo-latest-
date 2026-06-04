import { Router, type IRouter } from "express";
import healthRouter from "./health";
import subjectsRouter from "./subjects";
import practiceRouter from "./practice";
import questionsImportRouter from "./questionsImport";
import testsRouter from "./tests";
import progressRouter from "./progress";
import leaderboardRouter from "./leaderboard";
import anthropicRouter from "./anthropic";
import sourceNavRouter from "./sourceNav";

const router: IRouter = Router();

router.use(healthRouter);
router.use(subjectsRouter);
router.use(practiceRouter);
router.use(questionsImportRouter);
router.use(testsRouter);
router.use(progressRouter);
router.use(leaderboardRouter);
router.use(anthropicRouter);
router.use(sourceNavRouter);

export default router;
