import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AppliedJobs = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedResume, setSelectedResume] = useState(null);

    useEffect(() => {
        fetchAppliedJobs();
    }, []);

    const fetchAppliedJobs = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:9000/applications/my-applications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setApplications(response.data.applications);
            } else {
                setError('Failed to fetch applications');
            }
        } catch (err) {
            setError('Error fetching applications. Please try again.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const viewResume = async (applicationId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:9000/applications/resume/${applicationId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            
            const file = new Blob([response.data], { type: response.headers['content-type'] });
            const fileURL = URL.createObjectURL(file);
            setSelectedResume(fileURL);
            
            // Open in new tab
            window.open(fileURL, '_blank');
        } catch (err) {
            setError('Failed to load resume');
            console.error('Error loading resume:', err);
        }
    };
   

    const downloadResume = async (applicationId, fileName) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:9000/applications/resume/${applicationId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'resume.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('Failed to download resume');
            console.error('Error downloading resume:', err);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'applied': return 'bg-blue-100 text-blue-800';
            case 'viewed': return 'bg-yellow-100 text-yellow-800';
            case 'shortlisted': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'hired': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading your applications...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-red-100 border border-red-400 text-red-700 px-8 py-6 rounded-lg text-center">
                    <h3 className="text-lg font-bold mb-2">Error</h3>
                    <p className="mb-4">{error}</p>
                    <button 
                        onClick={fetchAppliedJobs}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Job Applications</h1>
                    <p className="text-gray-600">You have applied for {applications.length} jobs</p>
                </div>

                {applications.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No applications yet</h3>
                        <p className="text-gray-500">You haven't applied to any jobs yet. Start applying to see them here!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {applications.map((application) => (
                            <div key={application._id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b border-gray-100">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {application.job?.title}
                                        </h3>
                                        <p className="text-blue-600 font-medium mb-1">
                                            {application.job?.employer?.company?.name || application.job?.employer?.name}
                                        </p>
                                        <p className="text-gray-500 text-sm">{application.job?.location}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(application.status)}`}>
                                            {application.status}
                                        </span>
                                        <p className="text-gray-400 text-xs mt-2">
                                            Applied on: {new Date(application.appliedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Content Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Cover Letter */}
                                    <div className="lg:col-span-1">
                                        <h4 className="font-semibold text-gray-900 mb-3">Cover Letter</h4>
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[120px]">
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {application.coverLetter || 'No cover letter provided'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Resume Actions */}
                                    <div className="lg:col-span-1">
                                        <h4 className="font-semibold text-gray-900 mb-3">Resume</h4>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button 
                                                onClick={() => viewResume(application._id)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                View Resume
                                            </button>
                                            <button 
                                                onClick={() => downloadResume(application._id, application.resume?.fileName)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                Download Resume
                                            </button>
                                        </div>
                                    </div>

                                    {/* Job Details */}
                                    <div className="lg:col-span-2">
                                        <h4 className="font-semibold text-gray-900 mb-3">Job Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center">
                                                <span className="text-gray-600 font-medium min-w-[100px]">Job Type:</span>
                                                <span className="text-gray-900">{application.job?.type}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-gray-600 font-medium min-w-[100px]">Salary:</span>
                                                <span className="text-gray-900">
                                                    ${application.job?.salary?.min} - ${application.job?.salary?.max}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-gray-600 font-medium min-w-[100px]">Deadline:</span>
                                                <span className="text-gray-900">
                                                    {new Date(application.job?.deadline).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-gray-600 font-medium min-w-[100px]">Skills:</span>
                                                <span className="text-gray-900">
                                                    {application.job?.skills?.join(', ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Employer Notes */}
                                    {application.notes && (
                                        <div className="lg:col-span-2">
                                            <h4 className="font-semibold text-gray-900 mb-3">Employer Notes</h4>
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <p className="text-yellow-800">{application.notes}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Resume Modal */}
                {selectedResume && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-4xl h-full max-h-[90vh] relative">
                            <button 
                                onClick={() => setSelectedResume(null)}
                                className="absolute top-4 right-4 bg-gray-600 hover:bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center z-10"
                            >
                                ×
                            </button>
                            <iframe 
                                src={selectedResume} 
                                title="Resume" 
                                className="w-full h-full rounded-lg"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppliedJobs;