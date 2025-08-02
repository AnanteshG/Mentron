import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobTitle, jobDescription, jobSummary, mentorId } = await req.json();

    if (!jobTitle || !jobSummary) {
      return NextResponse.json(
        {
          error: 'Job title and job summary are required',
        },
        { status: 400 }
      );
    }

    // Get user profile for resume summary
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('resume_summary')
      .eq('user_id', userId)
      .single();

    if (profileError || !userProfile || !userProfile.resume_summary) {
      return NextResponse.json(
        {
          error: 'User profile with resume summary not found',
        },
        { status: 404 }
      );
    }

    const timestamp = new Date().toISOString();

    // Create interview session in Supabase
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .insert({
        user_id: userId,
        job_title: jobTitle,
        job_description: jobDescription,
        user_summary: userProfile.resume_summary,
        job_summary: jobSummary,
        mentor_id: mentorId,
        status: 'scheduled',
        created_at: timestamp,
        updated_at: timestamp
      })
      .select()
      .single();

    if (interviewError) {
      console.error('Error creating interview:', interviewError);
      return NextResponse.json(
        { error: 'Failed to create interview' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error('Error creating interview:', error);
    return NextResponse.json(
      { error: 'Failed to create interview' },
      { status: 500 }
    );
  }
}
