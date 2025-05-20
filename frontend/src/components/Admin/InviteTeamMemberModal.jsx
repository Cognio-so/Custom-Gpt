import React, { useState, useEffect, useRef } from 'react';
import { FiMail, FiX, FiSend, FiCheckCircle, FiUpload, FiFile } from 'react-icons/fi';
import { axiosInstance } from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';

const InviteTeamMemberModal = ({ isOpen, onClose, onInviteSent }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [inviteMethod, setInviteMethod] = useState('single'); // 'single' or 'csv'
  const [csvFile, setCsvFile] = useState(null);
  const [csvResults, setCsvResults] = useState(null);
  const fileInputRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setError('');
      setSuccess(false);
      setLoading(false);
      setInviteMethod('single');
      setCsvFile(null);
      setCsvResults(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (inviteMethod === 'single') {
        const response = await axiosInstance.post(
          `/api/auth/invite`,
          { email },
          { withCredentials: true }
        );

        if (response.data.success) {
          setSuccess(true);
          toast.success(`Invitation sent successfully to ${email}!`);
          if (onInviteSent) {
            onInviteSent({ email });
          }
        } else {
          const message = response.data.message || 'Failed to send invitation';
          setError(message);
          toast.error(message);
        }
      } else if (inviteMethod === 'csv') {
        if (!csvFile) {
          setError('Please select a CSV file');
          toast.error('Please select a CSV file');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('csvFile', csvFile);

        const response = await axiosInstance.post(
          `/api/auth/invite-csv`,
          formData,
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (response.data.success) {
          setCsvResults(response.data.results);
          setSuccess(true);
          toast.success(`CSV process completed: ${response.data.results.sent} invitations sent`);
          if (onInviteSent) {
            onInviteSent({ batchProcessed: true });
          }
        } else {
          const message = response.data.message || 'Failed to process CSV';
          setError(message);
          toast.error(message);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'An error occurred sending the invitation';
      setError(message);
      toast.error(message);
      console.error('Invitation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleMethodChange = (method) => {
    setInviteMethod(method);
    setError('');
  };

  const handleClose = () => {
    setSuccess(false);
    onClose();
  };

  const handleSendAnother = () => {
    setSuccess(false);
    setEmail('');
    setError('');
    setCsvFile(null);
    setCsvResults(null);
  };

  if (!isOpen) return null;

  const downloadTemplate = () => {
    const csvContent = "ID/Name,Email Address\n1,john@example.com\n2,anna@example.com";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'invitation_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-xl transform transition-transform duration-300 scale-100">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FiMail className="mr-2" /> Invite Team Members
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white focus:outline-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiX size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <FiCheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Invitation{inviteMethod === 'csv' ? 's' : ''} Sent!</h4>
            
            {inviteMethod === 'single' ? (
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                An invitation has been sent to <strong className="text-gray-800 dark:text-gray-100">{email}</strong>.
              </p>
            ) : (
              <div className="text-gray-600 dark:text-gray-300 mb-6">
                <p className="mb-2">CSV Processing Results:</p>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-left mb-3">
                  <p>Total processed: <strong>{csvResults?.total || 0}</strong></p>
                  <p>Successfully sent: <strong className="text-green-600 dark:text-green-400">{csvResults?.sent || 0}</strong></p>
                  <p>Skipped (already exists): <strong className="text-yellow-600 dark:text-yellow-400">{csvResults?.skipped || 0}</strong></p>
                  <p>Failed: <strong className="text-red-600 dark:text-red-400">{csvResults?.failed || 0}</strong></p>
                </div>
                {csvResults?.errors && csvResults.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-700 p-2 rounded text-left text-xs">
                    <p className="font-semibold mb-1">Errors:</p>
                    <ul className="list-disc pl-5">
                      {csvResults.errors.map((err, idx) => (
                        <li key={idx} className="text-red-600 dark:text-red-400">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-center gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                Close
              </button>
              <button
                onClick={handleSendAnother}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm flex items-center"
              >
                <FiSend className="mr-1.5" size={14} /> Send Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-5">
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleMethodChange('single')}
                  className={`flex-1 py-2 px-4 text-sm font-medium ${
                    inviteMethod === 'single'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  } transition-colors`}
                >
                  Single Invite
                </button>
                <button
                  type="button"
                  onClick={() => handleMethodChange('csv')}
                  className={`flex-1 py-2 px-4 text-sm font-medium ${
                    inviteMethod === 'csv'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  } transition-colors`}
                >
                  Bulk CSV Upload
                </button>
              </div>

              {inviteMethod === 'single' ? (
                <div>
                  <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="invite-email"
                      type="email"
                      required={inviteMethod === 'single'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="colleague@company.com"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      CSV File with Emails
                    </label>
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Download Template
                    </button>
                  </div>
                  <div 
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {csvFile ? (
                      <div className="flex items-center justify-center text-sm">
                        <FiFile className="mr-2 text-blue-500" size={20} />
                        <span className="text-gray-800 dark:text-gray-200 font-medium">
                          {csvFile.name}
                        </span>
                        <span className="ml-2 text-gray-500 dark:text-gray-400">
                          ({Math.round(csvFile.size / 1024)} KB)
                        </span>
                      </div>
                    ) : (
                      <div>
                        <FiUpload className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">CSV files only (max 1MB)</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Format: CSV with email in the second column (column B)
                  </p>
                </div>
              )}

              {error && (
                <div className="text-red-500 dark:text-red-400 text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800/30">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (inviteMethod === 'single' && !email) || (inviteMethod === 'csv' && !csvFile)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm flex items-center justify-center min-w-[130px]"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {inviteMethod === 'single' ? 'Sending...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <FiSend className="mr-1.5" size={14} /> 
                      {inviteMethod === 'single' ? 'Send Invitation' : 'Process CSV'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default InviteTeamMemberModal; 