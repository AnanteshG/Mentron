'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Upload,
  FileText,
  Briefcase,
  CheckCircle,
  Loader2,
  User,
} from 'lucide-react';
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
import Navbar from '@/components/navbar';
import { cn } from '@/lib/utils';
import { mentors } from '@/components/mentors';

interface UserProfile {
  id?: string;
  user_id?: string;
  resume_url?: string;
  resume_summary?: string;
  created_at?: string;
  updated_at?: string;
}

interface ResumePayload {
  fileUrl: string;
  fileContent: string;
  fileName: string;
  fileType: string;
}

interface ErrorResponse {
  error?: string;
  [key: string]: any;
}

export default function NewInterviewPage() {
  const router = useRouter();
  const uploadInProgress = useRef(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Step 1: Resume Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeSummary, setResumeSummary] = useState('');
  const [useExistingResume, setUseExistingResume] = useState(false);

  // Step 2: Job Details
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobSummary, setJobSummary] = useState('');

  // Step 3: Mentor Selection
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch('/api/user-profile');
      const data = await response.json();

      if (data.success && data.userProfile) {
        setUserProfile(data.userProfile);
        // Set resume summary and useExistingResume only if we don't have them yet
        if (data.userProfile.resume_summary && !resumeSummary) {
          setResumeSummary(data.userProfile.resume_summary);
          setUseExistingResume(true);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  // Fetch existing user profile on mount
  useEffect(() => {
    fetchUserProfile();
    // Force reset upload state on mount
    uploadInProgress.current = false;
    setUploadLoading(false);
  }, []); // Only run once on mount

  const resetUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user-profile', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Reset local state
        setUserProfile(null);
        setResumeSummary('');
        setUseExistingResume(false);
        setSelectedFile(null);
        alert('Resume data cleared successfully. Please upload your resume again.');
      } else {
        alert('Failed to reset resume data: ' + data.error);
      }
    } catch (error) {
      console.error('Error resetting user profile:', error);
      alert('Failed to reset resume data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUseExistingResume(false);
    }
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById(
      'resume-upload'
    ) as HTMLInputElement;
    fileInput?.click();
  };

  const resetUploadState = () => {
    uploadInProgress.current = false;
    setUploadLoading(false);
    setSelectedFile(null);
    console.log('Upload state reset');
  };

  const uploadResume = async (): Promise<boolean> => {
    // Immediate return if conditions not met
    if (!selectedFile || uploadInProgress.current || uploadLoading) {
      return false;
    }

    // Set blocking flags immediately
    uploadInProgress.current = true;
    setUploadLoading(true);

    let success = false;

    try {
      // Generate unique file nameF
      const ext = selectedFile.name.split('.').pop() || 'pdf';
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileName = `resume_${uniqueId}.${ext}`;
      const filePath = `resumes/${fileName}`;

      // Step 1: Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Step 2: Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      // Step 3: Prepare content for processing
      let fileContent: string;
      let fileType: string;

      if (selectedFile.type === 'application/pdf') {
        const arrayBuffer = await selectedFile.arrayBuffer();
        // Convert ArrayBuffer to base64 in chunks to avoid stack overflow
        const uint8Array = new Uint8Array(arrayBuffer);
        let binaryString = '';
        const chunkSize = 8192; // Process in 8KB chunks

        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, i + chunkSize);
          binaryString += String.fromCharCode.apply(null, Array.from(chunk));
        }

        fileContent = btoa(binaryString);
        fileType = 'pdf';
      } else {
        fileContent = await selectedFile.text();
        fileType = 'text';
      }

      // Step 4: Send to processing API
      const response = await fetch('/api/process-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: urlData.publicUrl,
          fileContent,
          fileName: selectedFile.name,
          fileType,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Processing failed');
      }

      // Step 5: Update UI state
      setResumeSummary(result.resumeSummary);
      setUserProfile(result.userProfile);
      setUseExistingResume(false);

      success = true;

    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      success = false;
    } finally {
      // Always clean up
      uploadInProgress.current = false;
      setUploadLoading(false);
    }

    return success;
  };

  const processJobDetails = async () => {
    if (!jobTitle) {
      alert('Please enter a job title');
      return false;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/process-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle,
          jobDescription,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setJobSummary(data.jobSummary);
        return true;
      } else {
        alert('Failed to process job details: ' + data.error);
        return false;
      }
    } catch (error) {
      console.error('Error processing job details:', error);
      alert('Failed to process job details');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createInterview = async () => {
    console.log('Creating interview with:', {
      jobTitle: jobTitle?.trim(),
      jobDescription: jobDescription?.trim(),
      jobSummary: jobSummary?.trim(),
      resumeSummary: resumeSummary?.trim(),
      useExistingResume,
      selectedMentor
    });

    // Validate required fields
    if (!jobTitle?.trim()) {
      alert('Please enter a job title');
      return;
    }

    if (!jobSummary?.trim()) {
      alert('Please process the job details in step 2');
      return;
    }

    if (!resumeSummary?.trim()) {
      if (useExistingResume) {
        alert('No existing resume found. Please upload a new resume.');
      } else {
        alert('Please upload your resume in step 1');
      }
      return;
    }

    if (!selectedMentor) {
      alert('Please select a mentor to continue');
      return;
    }

    setLoading(true);

    try {
      console.log('Sending create interview request...');

      const requestBody = {
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription?.trim() || '',
        jobSummary: jobSummary.trim(),
        mentorId: selectedMentor,
      };

      console.log('Request body:', requestBody);

      const response = await fetch('/api/create-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      console.log('Response status:', response.status);

      if (!response.ok) {
        // Try to get error details from response
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `HTTP ${response.status}` };
        }

        console.error('Failed to create interview:', errorData);
        alert('Failed to create interview: ' + (errorData.error || `HTTP ${response.status}`));
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success && data.interview?.id) {
        // Redirect to interview page
        console.log('Interview created successfully, redirecting to:', `/interview/${data.interview.id}`);
        router.push(`/interview/${data.interview.id}`);
      } else {
        console.error('Invalid response format:', data);
        alert('Failed to create interview: Invalid response from server');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating interview:', error);
      alert('Failed to create interview: ' + (error instanceof Error ? error.message : 'Network error'));
      setLoading(false);
    }
  };

  const handleNextStep = async (): Promise<void> => {
    // Prevent execution if upload is in progress
    if (uploadInProgress.current || uploadLoading) {
      return;
    }

    if (currentStep === 1) {
      // Handle existing resume case
      if (useExistingResume) {
        if (resumeSummary) {
          setCurrentStep(2);
          return;
        }
        if (userProfile?.resume_summary) {
          setResumeSummary(userProfile.resume_summary);
          setCurrentStep(2);
          return;
        }
        alert('No existing resume found. Please upload a new resume.');
        return;
      }

      // Handle new file upload case
      if (!selectedFile) {
        alert('Please upload a resume or use your existing one');
        return;
      }

      // Call upload and wait for result
      const uploadSuccess = await uploadResume();
      if (uploadSuccess) {
        setCurrentStep(2);
      }
      return;
    }

    if (currentStep === 2) {
      const jobSuccess = await processJobDetails();
      if (jobSuccess) {
        setCurrentStep(3);
      }
      return;
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Navbar />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Setup Your Interview
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete the steps below to start your mock interview
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
                  }`}
              >
                {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-sm font-medium">Resume</span>
            </div>
            <div
              className={`w-8 h-px ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'
                }`}
            />
            <div
              className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
                  }`}
              >
                {currentStep > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="text-sm font-medium">Job Details</span>
            </div>
            <div
              className={`w-8 h-px ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'
                }`}
            />
            <div
              className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
                  }`}
              >
                3
              </div>
              <span className="text-sm font-medium">Start Interview</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                  <FileText className="" />
                  Upload Your Resume
                </h2>
                <p className="text-muted-foreground">
                  Upload your resume to get personalized interview questions
                </p>
              </div>

              {userProfile?.resume_summary && (
                <div className={`border rounded-lg p-4 ${userProfile.resume_summary.includes('PDF, not a text-based resume')
                  ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800'
                  : 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                  }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {userProfile.resume_summary.includes('PDF, not a text-based resume') ? (
                      <>
                        <FileText className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800 dark:text-yellow-200">
                          Resume Needs Re-processing
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800 dark:text-green-200">
                          Previous Resume Found
                        </span>
                      </>
                    )}
                  </div>
                  <p className={`text-sm mb-3 ${userProfile.resume_summary.includes('PDF, not a text-based resume')
                    ? 'text-yellow-700 dark:text-yellow-300'
                    : 'text-green-700 dark:text-green-300'
                    }`}>
                    {userProfile.resume_summary.includes('PDF, not a text-based resume')
                      ? 'Your PDF resume was uploaded but not properly processed. Click "Re-process Resume" to extract text with our improved PDF parser.'
                      : userProfile.resume_summary
                    }
                  </p>
                  <div className="flex space-x-2">
                    {userProfile.resume_summary.includes('PDF, not a text-based resume') ? (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={resetUserProfile}
                          disabled={loading || uploadLoading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Resetting...
                            </>
                          ) : (
                            'Re-process Resume'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUseExistingResume(false);
                            setResumeSummary('');
                          }}
                        >
                          Upload New Resume
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant={useExistingResume ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            console.log('Use Existing Resume clicked:', {
                              userProfile: !!userProfile,
                              resumeSummary: userProfile?.resume_summary?.length
                            });
                            setUseExistingResume(true);
                            setSelectedFile(null); // Clear any selected file
                            if (userProfile?.resume_summary) {
                              setResumeSummary(userProfile.resume_summary);
                              console.log('Resume summary set from user profile');
                            } else {
                              console.warn('No resume summary found in user profile');
                            }
                          }}
                        >
                          Use Existing Resume
                        </Button>
                        <Button
                          variant={!useExistingResume ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            console.log('Upload New Resume clicked');
                            setUseExistingResume(false);
                            setResumeSummary(''); // Clear existing resume summary
                          }}
                        >
                          Upload New Resume
                        </Button>
                      </>
                    )}
                  </div>
                  {useExistingResume && resumeSummary && !userProfile.resume_summary.includes('PDF, not a text-based resume') && (
                    <div className="mt-3 p-2 bg-green-100 dark:bg-green-800/20 rounded text-sm">
                      <span className="text-green-600 dark:text-green-400 font-medium">✓ Ready to proceed with existing resume</span>
                    </div>
                  )}
                </div>
              )}

              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Choose a file or drag it here
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="resume-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={triggerFileInput}
                    className="cursor-pointer"
                  >
                    Upload Resume
                  </Button>
                  {selectedFile && (
                    <span className="block mt-2 text-xs text-muted-foreground">
                      Selected: {selectedFile.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                  <Briefcase />
                  Job Details
                </h2>
                <p className="text-muted-foreground">
                  Provide details about the position you&apos;re interviewing for
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Job Title *
                  </label>
                  <Input
                    placeholder="e.g., Senior Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Job Description
                  </label>
                  <textarea
                    className="w-full min-h-[120px] px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Paste the job description here for more targeted interview questions..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>
              </div>

              {jobSummary && (
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Job Summary:</h3>
                  <p className="text-sm text-muted-foreground">{jobSummary}</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                  <User />
                  Choose Your Mentor
                </h2>
                <p className="text-muted-foreground">
                  Select an AI mentor to conduct your interview
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className={cn(
                      'relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md',
                      selectedMentor === mentor.id
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    )}
                    onClick={() => setSelectedMentor(mentor.id)}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="relative w-full h-32 overflow-hidden rounded-md">
                        <img
                          src={mentor.image}
                          alt={mentor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="font-medium text-center">{mentor.name}</p>
                    </div>
                    {selectedMentor === mentor.id && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedMentor && (
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Ready to Start!
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Everything is set up for your mock interview with{' '}
                    {mentors.find((m) => m.id === selectedMentor)?.name}
                  </p>

                  <Button
                    onClick={createInterview}
                    disabled={loading}
                    size="lg"
                    className="w-full md:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting Interview...
                      </>
                    ) : (
                      'Start Interview'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 3 && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Back
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={
                  loading ||
                  uploadLoading ||
                  (currentStep === 1 && !useExistingResume && !selectedFile) ||
                  (currentStep === 1 && useExistingResume && !userProfile?.resume_summary)
                }
              >
                {(loading || uploadLoading) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploadLoading ? 'Uploading...' : 'Processing...'}
                  </>
                ) : (
                  'Next'
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
