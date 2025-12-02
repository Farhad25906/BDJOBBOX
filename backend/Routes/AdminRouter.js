const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  updateUserStatus,
  getAllJobs,
  getPendingReports,
  resolveReport,
  approveJob,
  deleteUser
} = require("../Controllers/AdminController");
const ensureAuthenticated = require("../Middlewares/Auth");
const checkRole = require("../Middlewares/RoleCheck");

router.get("/users", ensureAuthenticated, getAllUsers);
router.put("/users/:userId", ensureAuthenticated, updateUserStatus);
router.get("/jobs", ensureAuthenticated, getAllJobs);
router.get("/reports/pending", ensureAuthenticated, getPendingReports);
router.put("/jobs/:jobId", ensureAuthenticated, approveJob);
router.put("/reports/resolve/:reportId", ensureAuthenticated, resolveReport);
router.delete("/users/:userId", ensureAuthenticated, deleteUser);
// router.get('/admin/jobs', ensureAuthenticated, checkRole(['admin']), getAllJobs);
// router.put('/admin/jobs/:jobId', ensureAuthenticated, checkRole(['admin']), adminController.approveJob);
// router.post('/applications/:jobId', ensureAuthenticated, checkRole(['jobseeker']), applicationController.applyForJob);

module.exports = router;