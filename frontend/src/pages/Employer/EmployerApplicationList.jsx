import React, { useState, useEffect } from "react";
import axios from "axios";
import useCurrentUser from "../../hooks/useCurrentUser";
import toast from "react-hot-toast";

const EmployerApplicationList = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal states
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  
  const { user } = useCurrentUser();

  // Fetch all jobs posted by the current employer
  useEffect(() => {
    const fetchEmployerJobs = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:9000/jobs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            employerEmail: user?.email,
          },
        });

        setJobs(response.data.jobs || []);
      } catch (error) {
        toast.error("Failed to fetch jobs");
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployerJobs();
  }, []);

  // Fetch applications for a specific job
  const fetchJobApplications = async (jobId) => {
    try {
      setAppsLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `http://localhost:9000/applications/job/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            employerId: user?._id,
          },
        }
      );

      setApplications(response.data.applications || []);
    } catch (err) {
      console.error("Error fetching applications:", err);
      if (err.response?.status === 403) {
        setError(
          "You don't have permission to view applications for this job."
        );
        toast.error("Access denied. This job doesn't belong to you.");
      } else {
        setError("Failed to fetch applications. Please try again.");
        toast.error("Failed to fetch applications");
      }
      setApplications([]);
    } finally {
      setAppsLoading(false);
    }
  };

  // Handle job selection
  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setApplications([]);
    fetchJobApplications(job._id);
  };

  // Update application status
  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:9000/applications/status/${applicationId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh applications list
      fetchJobApplications(selectedJob._id);
      toast.success("Application status updated");
    } catch (err) {
      console.error("Error updating application status:", err);
      setError("Failed to update application status");
      toast.error("Failed to update status");
    }
  };

  // View resume in modal
  const viewResume = async (applicationId) => {
    try {
      setResumeLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        `http://localhost:9000/applications/resume/${applicationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob'
        }
      );

      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      setSelectedResume(pdfUrl);
      setShowResumeModal(true);
    } catch (error) {
      console.error("Error fetching resume:", error);
      toast.error("Failed to load resume");
    } finally {
      setResumeLoading(false);
    }
  };

  // View cover letter in modal
  const viewCoverLetter = (coverLetter, applicantName) => {
    setSelectedCoverLetter({
      content: coverLetter || "No cover letter provided",
      applicantName: applicantName || "Unknown Applicant"
    });
    setShowCoverLetterModal(true);
  };

  // Close modals and cleanup
  const closeResumeModal = () => {
    if (selectedResume) {
      URL.revokeObjectURL(selectedResume);
    }
    setSelectedResume(null);
    setShowResumeModal(false);
  };

  const closeCoverLetterModal = () => {
    setSelectedCoverLetter("");
    setShowCoverLetterModal(false);
  };

  // Filter applications based on search and status filter
  const filteredApplications = applications.filter((app) => {
    const applicantName = app.applicant?.name || "Unknown Applicant";
    const applicantEmail = app.applicant?.email || "No email provided";

    const matchesSearch =
      applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.coverLetter?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading your jobs...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Job Postings</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
          <button
            onClick={() => setError("")}
            className="absolute top-0 right-0 p-3 text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Jobs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div
              key={job._id}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                selectedJob?._id === job._id
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:shadow-md"
              }`}
              onClick={() => handleJobSelect(job)}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {job.title}
              </h3>
              <p className="text-gray-600 mb-2">
                {job.company?.name || "No company name"}
              </p>
              <p className="text-gray-500 text-sm mb-2">{job.location}</p>
              <div className="flex justify-between items-center">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    job.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : job.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : job.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {job.status?.charAt(0).toUpperCase() + job.status?.slice(1)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            No jobs found. Create your first job posting to get started.
          </div>
        )}
      </div>

      {/* Applications Section */}
      {selectedJob && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Applications for {selectedJob.title}
            </h2>
            <div className="flex space-x-4">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search applications..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Status Filter */}
              <select
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="applied">Applied</option>
                <option value="viewed">Viewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>
            </div>
          </div>

          {appsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">
                Loading applications...
              </span>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {applications.length === 0
                ? "No applications found for this job."
                : "No applications match your search criteria."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((application) => (
                    <tr key={application._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {application.applicant?.name ||
                                "Unknown Applicant"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {application.applicant?.email ||
                                "No email provided"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(application.appliedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={application.status}
                          onChange={(e) =>
                            updateApplicationStatus(
                              application._id,
                              e.target.value
                            )
                          }
                          className={`text-sm font-medium rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            application.status === "applied"
                              ? "bg-blue-100 text-blue-800"
                              : application.status === "viewed"
                              ? "bg-gray-100 text-gray-800"
                              : application.status === "shortlisted"
                              ? "bg-purple-100 text-purple-800"
                              : application.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          <option value="applied">Applied</option>
                          <option value="viewed">Viewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                          <option value="hired">Hired</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewResume(application._id)}
                          disabled={resumeLoading}
                          className="text-blue-600 hover:text-blue-900 mr-4 disabled:opacity-50"
                        >
                          {resumeLoading ? "Loading..." : "View Resume"}
                        </button>
                        <button
                          onClick={() => 
                            viewCoverLetter(
                              application.coverLetter,
                              application.applicant?.name
                            )
                          }
                          className="text-green-600 hover:text-green-900"
                        >
                          View Cover Letter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Resume Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Resume</h3>
              <button
                onClick={closeResumeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="flex-1 p-4 overflow-hidden">
              {selectedResume ? (
                <iframe
                  src={selectedResume}
                  className="w-full h-full border-0"
                  title="Resume PDF"
                />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Loading resume...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Modal */}
      {showCoverLetterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Cover Letter - {selectedCoverLetter.applicantName}
              </h3>
              <button
                onClick={closeCoverLetterModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedCoverLetter.content}
                </p>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={closeCoverLetterModal}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerApplicationList;