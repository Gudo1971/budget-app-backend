import { Router } from "express";
import baseRoutes from "./receipts/index";
import extractRoutes from "./receipts/extract";
import matchRoutes from "./receipts/match";

import archiveRoutes from "./receipts/archive";

console.log("Loading receipts router");
const router = Router();

router.use("/", extractRoutes);
router.use("/", matchRoutes);

router.use("/", baseRoutes);
router.use("/", archiveRoutes);
export default router;
