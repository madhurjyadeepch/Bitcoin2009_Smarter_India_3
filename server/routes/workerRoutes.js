const express = require("express");
const workerController = require("../controllers/workerControllers");

const router = express.Router();

router.get("/", workerController.getAllWorkers);
router.post("/", workerController.createWorker);
router.get("/department/:department", workerController.getWorkersByDepartment);
router.get("/:id", workerController.getWorkerById);
router.patch("/:id", workerController.updateWorker);
router.delete("/:id", workerController.deleteWorker);
router.post("/:workerId/assign/:reportId", workerController.assignReport);

module.exports = router;
