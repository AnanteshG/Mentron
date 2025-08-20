'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Award, TrendingUp, CheckCircle, AlertCircle, Star } from 'lucide-react';

interface InterviewResults {
    id: string;
    job_title: string;
    job_description: string | null;
    status: string;
    start_date_time: string | null;
    end_date_time: string | null;
    duration_minutes: number | null;
    overall_score: number | null;
    technical_score: number | null;
    communication_score: number | null;
    problem_solving_score: number | null;
    feedback: string | null;
    strengths: string[] | null;
    improvements: string[] | null;
    key_highlights: string[] | null;
    created_at: string;
}

export default function InterviewResultsPage() {
    const params = useParams();
    const router = useRouter();
    const [interview, setInterview] = useState<InterviewResults | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const response = await fetch(`/api/interview/${params.id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch interview results');
                }
                const data = await response.json();
                setInterview(data.interview);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchResults();
        }
    }, [params.id]);

    const getScoreColor = (score: number | null) => {
        if (!score) return 'text-gray-500';
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBadgeColor = (score: number | null) => {
        if (!score) return 'secondary';
        if (score >= 80) return 'default';
        if (score >= 60) return 'secondary';
        return 'destructive';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Loading your interview results...</p>
                </div>
            </div>
        );
    }

    if (error || !interview) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error || 'Interview not found'}</p>
                        <Button onClick={() => router.push('/')} className="mt-4">
                            Go Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (minutes: number | null) => {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Interview Results
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Your performance analysis for {interview.job_title}
                    </p>
                </div>

                {/* Status Badge */}
                <div className="text-center mb-8">
                    <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {interview.status === 'completed' ? 'Interview Completed' : interview.status}
                    </Badge>
                </div>

                {/* Main Results Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Overall Score */}
                    <Card className="lg:col-span-1">
                        <CardHeader className="text-center">
                            <CardTitle className="flex items-center justify-center gap-2">
                                <Award className="w-5 h-5" />
                                Overall Score
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <div className={`text-6xl font-bold mb-4 ${getScoreColor(interview.overall_score)}`}>
                                {interview.overall_score || 'N/A'}
                                {interview.overall_score && <span className="text-2xl">/100</span>}
                            </div>
                            <Progress value={interview.overall_score || 0} className="mb-4" />
                            <Badge variant={getScoreBadgeColor(interview.overall_score)}>
                                {interview.overall_score && interview.overall_score >= 80 ? 'Excellent' :
                                    interview.overall_score && interview.overall_score >= 60 ? 'Good' : 'Needs Improvement'}
                            </Badge>
                        </CardContent>
                    </Card>

                    {/* Interview Details */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Interview Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Position</p>
                                    <p className="font-semibold">{interview.job_title}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                                    <p className="font-semibold">{formatDate(interview.start_date_time)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                                    <p className="font-semibold flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {formatDuration(interview.duration_minutes)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                                    <Badge variant="outline">{interview.status}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Skill Scores */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Skill Assessment
                        </CardTitle>
                        <CardDescription>
                            Breakdown of your performance across different areas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">Technical Skills</span>
                                    <span className={`font-bold ${getScoreColor(interview.technical_score)}`}>
                                        {interview.technical_score || 'N/A'}/100
                                    </span>
                                </div>
                                <Progress value={interview.technical_score || 0} className="mb-2" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">Communication</span>
                                    <span className={`font-bold ${getScoreColor(interview.communication_score)}`}>
                                        {interview.communication_score || 'N/A'}/100
                                    </span>
                                </div>
                                <Progress value={interview.communication_score || 0} className="mb-2" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">Problem Solving</span>
                                    <span className={`font-bold ${getScoreColor(interview.problem_solving_score)}`}>
                                        {interview.problem_solving_score || 'N/A'}/100
                                    </span>
                                </div>
                                <Progress value={interview.problem_solving_score || 0} className="mb-2" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Feedback and Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Strengths */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-5 h-5" />
                                Strengths
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {interview.strengths && interview.strengths.length > 0 ? (
                                <ul className="space-y-2">
                                    {interview.strengths.map((strength, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <Star className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span>{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">Analysis pending...</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Areas for Improvement */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-600">
                                <AlertCircle className="w-5 h-5" />
                                Areas for Improvement
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {interview.improvements && interview.improvements.length > 0 ? (
                                <ul className="space-y-2">
                                    {interview.improvements.map((improvement, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <TrendingUp className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                            <span>{improvement}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">Analysis pending...</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Key Highlights */}
                {interview.key_highlights && interview.key_highlights.length > 0 && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Key Highlights</CardTitle>
                            <CardDescription>
                                Notable moments and observations from your interview
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {interview.key_highlights.map((highlight, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-300">{index + 1}</span>
                                        </div>
                                        <span>{highlight}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Detailed Feedback */}
                {interview.feedback && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Detailed Feedback</CardTitle>
                            <CardDescription>
                                Comprehensive analysis of your interview performance
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap">{interview.feedback}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="text-center space-x-4">
                    <Button onClick={() => router.push('/interview/new')} size="lg">
                        Schedule Another Interview
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/')} size="lg">
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}
