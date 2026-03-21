import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import dashboardRouter from "./dashboard.js";
import topupRouter from "./topup.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);
router.use("/topup", topupRouter);
router.use("/admin", adminRouter);

export default router;
