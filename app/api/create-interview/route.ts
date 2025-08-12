import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      console.log('Unauthorized - no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      console.error('Supabase admin client not available');
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { jobTitle, jobDescription, jobSummary, mentorId } = requestBody;

    console.log('Create interview request:', { jobTitle, jobDescription, jobSummary, mentorId, userId });

    if (!jobTitle || !jobSummary) {
      console.log('Missing required fields:', { jobTitle: !!jobTitle, jobSummary: !!jobSummary });
      return NextResponse.json(
        {
          error: 'Job title and job summary are required',
        },
        { status: 400 }
      );
    }

    // Get user profile for resume summary
    console.log('Fetching user profile for user:', userId);
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('resume_summary')
      .eq('user_id', userId)
      .single();

    console.log('User profile result:', { userProfile, profileError });

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        {
          error: `Error fetching user profile: ${profileError.message}`,
        },
        { status: 500 }
      );
    }

    if (!userProfile) {
      console.log('No user profile found');
      return NextResponse.json(
        {
          error: 'User profile not found. Please upload your resume first.',
        },
        { status: 404 }
      );
    }

    if (!userProfile.resume_summary) {
      console.log('No resume summary found in user profile');
      return NextResponse.json(
        {
          error: 'Resume summary not found. Please upload your resume first.',
        },
        { status: 404 }
      );
    }

    // Prepare interview data
    const interviewData = {
      user_id: userId,
      job_title: jobTitle,
      job_description: jobDescription || null,
      user_summary: userProfile.resume_summary,
      job_summary: jobSummary,
      mentor_id: mentorId || null,
      status: 'scheduled' as const
      // Let Supabase handle created_at and updated_at automatically
    };

    console.log('Creating interview with data:', interviewData);

    // Create interview session in Supabase
    const { data: interview, error: interviewError } = await supabaseAdmin
      .from('interviews')
      .insert(interviewData)
      .select()
      .single();

    console.log('Interview creation result:', { 
      interview: interview ? { id: interview.id, status: interview.status } : null, 
      error: interviewError ? {
        message: interviewError.message,
        details: interviewError.details,
        hint: interviewError.hint,
        code: interviewError.code
      } : null 
    });

    if (interviewError) {
      console.error('Error creating interview:', interviewError);
      return NextResponse.json(
        { 
          error: 'Failed to create interview',
          details: interviewError.message,
          code: interviewError.code
        },
        { status: 500 }
      );
    }

    if (!interview) {
      console.error('No interview data returned after creation');
      return NextResponse.json(
        { error: 'Failed to create interview - no data returned' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error('Error creating interview:', error);
    
    // Provide more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create interview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
