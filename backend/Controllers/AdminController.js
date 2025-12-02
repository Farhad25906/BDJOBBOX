const UserModel = require("../Models/User");
const JobModel = require("../Models/Job");
const ReportModel = require("../Models/Report");
const ApplicationModel = require("../Models/Application");
const NotificationModel = require("../Models/Notification");

const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find().select("-password");
    res.status(200).json({
      message: "Users retrieved successfully",
      success: true,
      users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "User status updated successfully",
      success: true,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const getAllJobs = async (req, res) => {
  try {
    const jobs = await JobModel.find();
    res.status(200).json({
      message: "Jobs retrieved successfully",
      success: true,
      jobs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const getPendingReports = async (req, res) => {
  try {
    const reports = await ReportModel.find({ status: "pending" })
      .populate("reporter", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Pending reports retrieved successfully",
      success: true,
      reports,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, resolutionNotes } = req.body;

    const report = await ReportModel.findById(reportId);
    if (!report) {
      return res.status(404).json({
        message: "Report not found",
        success: false,
      });
    }

    report.status = "resolved";
    report.resolutionNotes = resolutionNotes;
    report.resolvedBy = req.user.id;
    report.resolvedAt = new Date();
    await report.save();

    if (action === "disableUser") {
      await UserModel.findByIdAndUpdate(report.reportedItem, {
        isActive: false,
      });
    } else if (action === "removeContent") {
      if (report.reportedItemType === "job") {
        await JobModel.findByIdAndDelete(report.reportedItem);
      }
    }

    res.status(200).json({
      message: "Report resolved successfully",
      success: true,
      report,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const approveJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { action, employerEmail } = req.body;
    console.log(req.body);
    

    console.log("Received request:", { jobId, action, employerEmail });

    const job = await JobModel.findById(jobId);
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    // CRITICAL FIX: Handle missing employerEmail
    if (!job.employerEmail) {
      if (employerEmail) {
        // Use the email from the request body
        job.employerEmail = employerEmail;
      } else {
        // Fallback: Set a default email or use employer's email from user collection
        const employerUser = await UserModel.findById(job.employer);
        if (employerUser) {
          job.employerEmail = employerUser.email;
        } else {
          job.employerEmail = "admin@default.com"; // Final fallback
        }
      }
    }

    if (action === "approve") {
      job.status = "approved";
    } else if (action === "reject") {
      job.status = "rejected";
    } else {
      return res.status(400).json({
        message: "Invalid action",
        success: false,
      });
    }

    await job.save();

    // Create notification for employer
    const notification = new NotificationModel({
      user: job.employer,
      message: `Your job "${job.title}" has been ${
        action === "approve" ? "approved" : "rejected"
      }`,
      type: action === "approve" ? "job_approved" : "job_rejected",
      relatedItem: job._id,
    });
    await notification.save();

    res.status(200).json({
      message: `Job ${action}d successfully`,
      success: true,
      job,
    });
  } catch (err) {
    console.error("Error in approveJob:", err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (req.user.id === userId) {
      return res.status(400).json({
        message: "You cannot delete your own account",
        success: false,
      });
    }

    await UserModel.findByIdAndDelete(userId);

    if (user.role === "employer") {
      await JobModel.deleteMany({ employer: userId });
    }

    if (user.role === "jobseeker") {
      await ApplicationModel.deleteMany({ applicant: userId });
    }

    res.status(200).json({
      message: "User deleted successfully",
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

module.exports = {
  getAllUsers,
  updateUserStatus,
  getAllJobs,
  getPendingReports,
  resolveReport,
  approveJob,
  deleteUser,
};
