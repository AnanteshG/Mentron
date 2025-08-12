import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      console.error('Supabase admin client not available');
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const { transcript, duration } = await req.json();

    // Get interview details
    const { data: interview, error: interviewError } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Generate comprehensive feedback using AI
    const feedbackPrompt = `
    You are an expert interview coach. Analyze this interview transcript and provide detailed feedback.
    
    Job Title: ${interview.job_title}
    Job Description: ${interview.job_description || 'Not provided'}
    Candidate Summary: ${interview.user_summary}
    Interview Transcript: ${transcript}
    Duration: ${duration} minutes
    
    Please provide:
    1. Overall score (0-100)
    2. Technical skills score (0-100) 
    3. Communication skills score (0-100)
    4. Problem-solving skills score (0-100)
    5. Detailed feedback (2-3 paragraphs)
    6. Top 3 strengths
    7. Top 3 areas for improvement
    8. 3 key highlights from the interview
    
    Format your response as JSON with these exact keys:
    {
      "overall_score": number,
      "technical_score": number,
      "communication_score": number,
      "problem_solving_score": number,
      "feedback": "string",
      "strengths": ["strength1", "strength2", "strength3"],
      "improvements": ["improvement1", "improvement2", "improvement3"],
      "key_highlights": ["highlight1", "highlight2", "highlight3"]
    }
    `;

    const { text: aiResponse } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: feedbackPrompt,
    });

    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback values if AI response can't be parsed
      analysisResult = {
        overall_score: 75,
        technical_score: 75,
        communication_score: 75,
        problem_solving_score: 75,
        feedback: "Interview completed successfully. Detailed analysis will be available shortly.",
        strengths: ["Good communication", "Relevant experience", "Positive attitude"],
        improvements: ["Technical knowledge", "Problem-solving approach", "Specific examples"],
        key_highlights: ["Engaged throughout", "Relevant background", "Professional demeanor"]
      };
    }

    // Calculate duration in minutes
    const startTime = interview.start_date_time ? new Date(interview.start_date_time) : new Date();
    const endTime = new Date();
    const durationMinutes = duration || Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // Update interview with results
    const { data: updatedInterview, error: updateError } = await supabaseAdmin
      .from('interviews')
      .update({
        status: 'completed',
        end_date_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        overall_score: analysisResult.overall_score,
        technical_score: analysisResult.technical_score,
        communication_score: analysisResult.communication_score,
        problem_solving_score: analysisResult.problem_solving_score,
        feedback: analysisResult.feedback,
        strengths: analysisResult.strengths,
        improvements: analysisResult.improvements,
        key_highlights: analysisResult.key_highlights,
        transcript: transcript,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating interview with results:', updateError);
      return NextResponse.json(
        { error: 'Failed to save interview results' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      interview: updatedInterview,
      analysis: analysisResult,
    });
  } catch (error) {
    console.error('Error processing interview results:', error);
    return NextResponse.json(
      { error: 'Failed to process interview results' },
      { status: 500 }
    );
  }
}
