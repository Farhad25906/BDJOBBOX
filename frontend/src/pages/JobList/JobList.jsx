// JobList.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ApplyJobModal from "./components/ApplyJobModal";
import { FaBookmark, FaRegBookmark, FaBuilding, FaMapMarkerAlt, FaMoneyBillWave, FaClock } from "react-icons/fa";

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [bookmarkedJobs, setBookmarkedJobs] = useState(new Set());

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get("http://localhost:9000/jobs", {
          params: {
            status: "approved"
          }
        });
        setJobs(response.data.jobs);
        
        // Fetch user's bookmarked jobs if logged in
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const userResponse = await axios.get("http://localhost:9000/auth/current-user", {
              headers: { Authorization: `Bearer ${token}` }
            });
            const savedJobs = userResponse.data.user.savedJobs || [];
            setBookmarkedJobs(new Set(savedJobs.map(job => job.job?._id || job.job)));
          } catch (error) {
            console.error("Failed to fetch user bookmarks:", error);
          }
        }
      } catch (error) {
        console.log(error);
        
        toast.error("Failed to fetch jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleApply = (job) => {
    setSelectedJob(job);
    setIsApplyModalOpen(true);
  };

  const toggleBookmark = async (jobId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to bookmark jobs");
        return;
      }

      const isCurrentlyBookmarked = bookmarkedJobs.has(jobId);
      
      if (isCurrentlyBookmarked) {
        // Remove bookmark
        await axios.delete(`http://localhost:9000/auth/saved-jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookmarkedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        toast.success("Job removed from bookmarks");
      } else {
        // Add bookmark
        await axios.post(`http://localhost:9000/auth/saved-jobs/${jobId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookmarkedJobs(prev => new Set(prev).add(jobId));
        toast.success("Job bookmarked successfully");
      }
    } catch (error) {
      console.error("Bookmark error:", error);
      toast.error("Failed to update bookmark");
    }
  };

  const formatSalary = (salary) => {
    if (!salary || !salary.min) return "Not specified";
    
    let formatted = `${salary.currency || 'USD'} ${salary.min}`;
    if (salary.max) formatted += ` - ${salary.max}`;
    return formatted;
  };

  const formatJobType = (type) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Available Jobs</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div key={job._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100">
            <div className="p-6">
              {/* Header with title and bookmark button */}
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-800 pr-2">{job.title}</h2>
                <button
                  onClick={() => toggleBookmark(job._id)}
                  className="text-yellow-500 hover:text-yellow-600 transition-colors p-1"
                  title={bookmarkedJobs.has(job._id) ? "Remove bookmark" : "Bookmark job"}
                >
                  {bookmarkedJobs.has(job._id) ? (
                    <FaBookmark className="text-xl" />
                  ) : (
                    <FaRegBookmark className="text-xl" />
                  )}
                </button>
              </div>

              {/* Company info */}
              {job.employer?.company?.name && (
                <div className="flex items-center mb-3 text-gray-600">
                  <FaBuilding className="mr-2" />
                  <span>{job.employer.company.name}</span>
                </div>
              )}

              {/* Location */}
              <div className="flex items-center mb-3 text-gray-600">
                <FaMapMarkerAlt className="mr-2" />
                <span>{job.location}</span>
              </div>

              {/* Job type and salary */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FaClock className="mr-2" />
                  <span>{formatJobType(job.type)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaMoneyBillWave className="mr-2" />
                  <span>{formatSalary(job.salary)}</span>
                </div>
              </div>

              {/* Description preview */}
              <p className="text-gray-700 mb-4 line-clamp-3 text-sm">
                {job.description}
              </p>

              {/* Skills */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Required Skills:</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills?.slice(0, 4).map((skill, index) => (
                    <span 
                      key={index} 
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills?.length > 4 && (
                    <span className="text-gray-500 text-xs">
                      +{job.skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Requirements preview */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Requirements:</h3>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {job.requirements.slice(0, 2).map((req, index) => (
                      <li key={index} className="truncate">{req}</li>
                    ))}
                    {job.requirements.length > 2 && (
                      <li className="text-gray-500">+{job.requirements.length - 2} more requirements</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Footer with deadline and apply button */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  <div>Deadline: {new Date(job.deadline).toLocaleDateString()}</div>
                  <div className="text-xs">
                    {new Date(job.deadline) > new Date() ? 
                      `${Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24))} days left` : 
                      "Expired"}
                  </div>
                </div>
                <button
                  onClick={() => handleApply(job)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
                  disabled={new Date(job.deadline) < new Date()}
                >
                  {new Date(job.deadline) < new Date() ? "Expired" : "Apply Now"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No jobs available at the moment.</p>
        </div>
      )}

      {isApplyModalOpen && selectedJob && (
        <ApplyJobModal
          job={selectedJob}
          onClose={() => setIsApplyModalOpen(false)}
        />
      )}
    </div>
  );
};

export default JobList;