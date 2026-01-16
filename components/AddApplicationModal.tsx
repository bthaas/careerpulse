import React, { useState } from 'react';
import { AppStatus } from '../types';

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (application: NewApplication) => void;
}

export interface NewApplication {
  company: string;
  role: string;
  location: string;
  dateApplied: string;
  status: AppStatus;
  source: string;
  salary?: string;
  remotePolicy?: string;
  notes?: string;
}

const AddApplicationModal: React.FC<AddApplicationModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<NewApplication>({
    company: '',
    role: '',
    location: '',
    dateApplied: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    status: 'Applied',
    source: 'LinkedIn',
    salary: '',
    remotePolicy: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof NewApplication, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NewApplication, string>> = {};

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }
    if (!formData.role.trim()) {
      newErrors.role = 'Job title is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
      // Reset form
      setFormData({
        company: '',
        role: '',
        location: '',
        dateApplied: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        status: 'Applied',
        source: 'LinkedIn',
        salary: '',
        remotePolicy: '',
        notes: '',
      });
      setErrors({});
      onClose();
    }
  };

  const handleChange = (field: keyof NewApplication, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCancel = () => {
    setFormData({
      company: '',
      role: '',
      location: '',
      dateApplied: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      status: 'Applied',
      source: 'LinkedIn',
      salary: '',
      remotePolicy: '',
      notes: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <div 
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Application</h2>
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-colors ${
                  errors.company ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="e.g., Google, Microsoft, Startup Inc"
              />
              {errors.company && (
                <p className="mt-1 text-sm text-red-500">{errors.company}</p>
              )}
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-colors ${
                  errors.role ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="e.g., Senior Software Engineer, Product Manager"
              />
              {errors.role && (
                <p className="mt-1 text-sm text-red-500">{errors.role}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-colors ${
                  errors.location ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="e.g., San Francisco, CA or Remote"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-500">{errors.location}</p>
              )}
            </div>

            {/* Status and Source Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-colors"
                >
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => handleChange('source', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-colors"
                >
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Indeed">Indeed</option>
                  <option value="Glassdoor">Glassdoor</option>
                  <option value="Direct">Direct/Company Website</option>
                  <option value="Referrer">Referral</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Salary and Remote Policy Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Salary Range (Optional)
                </label>
                <input
                  type="text"
                  value={formData.salary}
                  onChange={(e) => handleChange('salary', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-colors"
                  placeholder="e.g., $120k - $150k"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Remote Policy (Optional)
                </label>
                <input
                  type="text"
                  value={formData.remotePolicy}
                  onChange={(e) => handleChange('remotePolicy', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-colors"
                  placeholder="e.g., Remote, Hybrid, On-site"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-colors resize-none"
                placeholder="Add any additional notes about this application..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-primary hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                Add Application
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddApplicationModal;
