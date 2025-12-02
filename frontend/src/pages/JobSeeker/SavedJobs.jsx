import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaBookmark, FaTrash, FaBuilding, FaMapMarkerAlt, FaMoneyBillWave, FaClock, FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "react-router";

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to view saved jobs");
        setLoading(false);
        return;
      }

      const response = await axios.get("http://localhost:9000/auth/saved-jobs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSavedJobs(response.data.savedJobs || []);
    } catch (error) {
      console.error("Failed to fetch saved jobs:", error);
      setError("Failed to load saved jobs");
      toast.error("Failed to load saved jobs");
    } finally {
      setLoading(false);
    }
  };

  const removeSavedJob = async (jobId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:9000/auth/saved-jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      setSavedJobs(prev => prev.filter(item => item.job?._id !== jobId));
      toast.success("Job removed from bookmarks");
    } catch (error) {
      console.error("Remove bookmark error:", error);
      toast.error("Failed to remove bookmark");
    }
  };

  const formatSalary = (salary) => {
    if (!salary || !salary.min) return "Not specified";
    
    let formatted = `${salary.currency || 'USD'} ${salary.min}`;
    if (salary.max) formatted += ` - ${salary.max}`;
    return formatted;
  };

  const formatJobType = (type) => {
    return type?.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || "";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <Link 
            to="/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium"
          >
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  if (savedJobs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Saved Jobs</h1>
        <div className="text-center py-12">
          <FaBookmark className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">No saved jobs yet</h2>
          <p className="text-gray-500 mb-6">Start browsing jobs and save them for later!</p>
          <Link 
            to="/jobs" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Saved Jobs</h1>
        <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          {savedJobs.length} {savedJobs.length === 1 ? 'job' : 'jobs'} saved
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {savedJobs.map((savedJob) => {
          const job = savedJob.job;
          if (!job) return null; // Skip if job data is missing

          return (
            <div key={savedJob._id || job._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100">
              <div className="p-6">
                {/* Header with title and remove button */}
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-800 pr-2">{job.title}</h2>
                  <button
                    onClick={() => removeSavedJob(job._id)}
                    className="text-red-500 hover:text-red-600 transition-colors p-1"
                    title="Remove from saved jobs"
                  >
                    <FaTrash className="text-lg" />
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
                {job.skills && job.skills.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Required Skills:</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.slice(0, 4).map((skill, index) => (
                        <span 
                          key={index} 
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.skills.length > 4 && (
                        <span className="text-gray-500 text-xs">
                          +{job.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer with saved date and actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    <div>Saved on: {formatDate(savedJob.savedAt)}</div>
                    {job.deadline && (
                      <div className="text-xs">
                        Deadline: {formatDate(job.deadline)}
                        {new Date(job.deadline) > new Date() ? 
                          ` (${Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24))} days left)` : 
                          " - Expired"}
                      </div>
                    )}
                  </div>
                  
                  {/* <div className="flex space-x-2">
                    <Link
                      to={`/jobs/${job._id}`}
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                      title="View job details"
                    >
                      <FaExternalLinkAlt className="mr-1" />
                      View Details
                    </Link>
                    <button
                      onClick={() => removeSavedJob(job._id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div> */}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk actions */}
      {savedJobs.length > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to clear all saved jobs?")) {
                // Implement bulk remove if needed
                toast.info("Bulk remove feature coming soon!");
              }
            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition font-medium"
          >
            Clear All Saved Jobs
          </button>
        </div>
      )}
    </div>
  );
};

export default SavedJobs;