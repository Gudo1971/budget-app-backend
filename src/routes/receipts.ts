import { Router } from "express";
import baseRoutes from "./receipts/index";
import extractRoutes from "./receipts/extract";
import matchRoutes from "./receipts/match";
import linkRoutes from "./receipts/link";
console.log("Loading receipts router");
const router = Router();

router.use("/", extractRoutes);
router.use("/", matchRoutes);
router.use("/", linkRoutes);
router.use("/", baseRoutes);

export default router;
