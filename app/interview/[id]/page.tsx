'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { StreamingAvatarProvider } from '@/components/logic';
import Interview from '@/components/interview';
import LoadingSkeleton from '@/components/loading-skeleton';
import InterviewComplete from '@/components/interview-complete';
import Link from 'next/link';

interface Interview {
  id: string;
  user_id: string;
  job_title: string;
  job_description?: string;
  user_summary: string;
  job_summary: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  start_date_time?: string;
  created_at: string;
  updated_at: string;
  mentor_id: string;
}

export default function InterviewPage() {
  const params = useParams();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Start interview
  const startInterview = useCallback(
    async (interviewData: Interview) => {
      if (interviewData.status !== 'scheduled') return interviewData;

      try {
        console.log('Starting interview:', interviewId);
        const response = await fetch(`/api/interview/${interviewId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'in-progress',
          }),
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok && data.success) {
          return data.interview;
        } else {
          console.error('Failed to start interview:', data.error || `HTTP ${response.status}`);
          setError(`Failed to start interview: ${data.error || `HTTP ${response.status}`}`);
          return interviewData;
        }
      } catch (error) {
        console.error('Error starting interview:', error);
        setError(`Error starting interview: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return interviewData;
      }
    },
    [interviewId]
  );

  // Fetch interview data
  const fetchInterview = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/interview/${interviewId}`);
      const data = await response.json();

      if (data.success) {
        // First set the interview data, then conditionally start it
        let interviewData = data.interview;

        // Auto-start if scheduled
        if (interviewData.status === 'scheduled') {
          interviewData = await startInterview(interviewData);
        }

        setInterview(interviewData);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch interview');
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
      setError('Failed to fetch interview');
    } finally {
      setLoading(false);
    }
  }, [interviewId, startInterview]);

  // Auto-complete interview after 5 minutes
  const completeInterview = useCallback(async () => {
    if (!interview || interview.status !== 'in-progress') return;

    try {
      const response = await fetch(`/api/interview/${interviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setInterview(data.interview);
      }
    } catch (error) {
      console.error('Error completing interview:', error);
    }
  }, [interview, interviewId]);

  // Calculate time remaining for in-progress interviews
  useEffect(() => {
    if (
      !interview ||
      interview.status !== 'in-progress' ||
      !interview.start_date_time
    ) {
      return;
    }

    const startTime = new Date(interview.start_date_time).getTime();
    const threeMinutes = 3 * 60 * 1000; // 3 minutes in milliseconds

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, threeMinutes - elapsed);

      // Auto-complete when time is up
      if (remaining === 0) {
        completeInterview();
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [interview, completeInterview]);

  // Fetch interview on component mount
  useEffect(() => {
    if (interviewId) {
      fetchInterview();
    }
  }, [interviewId, fetchInterview]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchInterview} variant="outline">
            <Link href="/interview/new">Start New Interview</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Interview Not Found</h2>
          <p className="text-gray-600">
            The requested interview could not be found.
          </p>
        </Card>
      </div>
    );
  }

  if (interview.status === 'completed') {
    // Redirect to results page for completed interviews
    if (typeof window !== 'undefined') {
      window.location.href = `/interview/${interviewId}/results`;
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Redirecting to your results...</p>
          </div>
        </div>
      );
    }
    return <InterviewComplete />;
  }

  return (
    <StreamingAvatarProvider basePath={process.env.NEXT_PUBLIC_BASE_API_URL}>
      <Interview
        mentorId={interview.mentor_id}
        role={interview.job_title}
        interviewId={interviewId}
      />
    </StreamingAvatarProvider>
  );
}
