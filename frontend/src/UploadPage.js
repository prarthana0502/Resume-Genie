import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UploadPage.css';

const UploadPage = () => {
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescFile, setJobDescFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ resume: 0, jobDesc: 0 });
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      setUploadProgress(prev => ({ ...prev, [fileType]: 0 }));
      
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [fileType]: progress }));
        }
      };
      
      reader.onload = () => {
        if (fileType === "resume") {
          setResumeFile(file);
        } else if (fileType === "jobDesc") {
          setJobDescFile(file);
        }
        setUploadProgress(prev => ({ ...prev, [fileType]: 100 }));
      };
      
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile || !jobDescFile) {
      alert("Please upload both files.");
      return;
    }

    setLoading(true);
    try {
      // Here you would typically send the files to your backend
      // For now, we'll just navigate to the dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1>Upload Your Documents</h1>
        <p>Upload your resume and job description to get started</p>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <div className="file-input-container">
          <div className="file-input">
            <label htmlFor="resume">Upload Resume (.txt)</label>
            <div className="upload-box">
              <input
                id="resume"
                type="file"
                accept=".txt"
                onChange={(e) => handleFileChange(e, "resume")}
              />
              <div className="upload-preview">
                {resumeFile ? (
                  <div className="file-info">
                    <span className="file-name">{resumeFile.name}</span>
                    <span className="file-size">
                      {(resumeFile.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                ) : (
                  <span className="upload-placeholder">
                    Drag & drop or click to upload
                  </span>
                )}
              </div>
              {uploadProgress.resume > 0 && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress.resume}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="file-input">
            <label htmlFor="jobDesc">Upload Job Description (.txt)</label>
            <div className="upload-box">
              <input
                id="jobDesc"
                type="file"
                accept=".txt"
                onChange={(e) => handleFileChange(e, "jobDesc")}
              />
              <div className="upload-preview">
                {jobDescFile ? (
                  <div className="file-info">
                    <span className="file-name">{jobDescFile.name}</span>
                    <span className="file-size">
                      {(jobDescFile.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                ) : (
                  <span className="upload-placeholder">
                    Drag & drop or click to upload
                  </span>
                )}
              </div>
              {uploadProgress.jobDesc > 0 && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress.jobDesc}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <button 
          className="submit-button" 
          type="submit" 
          disabled={loading || !resumeFile || !jobDescFile}
        >
          {loading ? "Processing..." : "Analyze Documents"}
        </button>
      </form>
    </div>
  );
};

export default UploadPage; 