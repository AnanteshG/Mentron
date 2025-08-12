import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    console.log('GET /api/interview/[id] - User ID:', userId, 'Interview ID:', id);

    if (!userId) {
      console.log('Unauthorized: No user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      console.error('Supabase admin client not available');
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Get interview from Supabase
    console.log('Fetching interview from database...');
    const { data: interview, error } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('id', id)
      .single();

    console.log('Database query result:', { interview: !!interview, error });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!interview) {
      console.log('Interview not found');
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Check if user owns this interview
    if (interview.user_id !== userId) {
      console.log('Access denied: User does not own this interview');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if interview is in-progress and startDateTime is older than 5 minutes
    if (interview.status === 'in-progress' && interview.start_date_time) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const startDateTime = new Date(interview.start_date_time);
      
      if (startDateTime < fiveMinutesAgo) {
        // Mark as completed if it's been more than 5 minutes
        const { error: updateError } = await supabaseAdmin
          .from('interviews')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (!updateError) {
          interview.status = 'completed';
        }
      }
    }

    return NextResponse.json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error('Error fetching interview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    
    console.log('PATCH /api/interview/[id] - User ID:', userId, 'Interview ID:', id);
    
    if (!userId) {
      console.log('Unauthorized: No user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      console.error('Supabase admin client not available');
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Parse request body with better error handling
    let body;
    try {
      const rawBody = await req.text();
      console.log('Raw request body:', rawBody);
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { status } = body;
    console.log('Requested status change:', status);

    if (!status) {
      console.log('Missing status in request body');
      return NextResponse.json({ 
        error: 'Status is required in request body' 
      }, { status: 400 });
    }

    if (!['scheduled', 'in-progress', 'completed'].includes(status)) {
      console.log('Invalid status provided:', status);
      return NextResponse.json({ 
        error: `Invalid status: ${status}. Must be one of: scheduled, in-progress, completed` 
      }, { status: 400 });
    }

    // Get interview from Supabase
    console.log('Fetching interview from database...');
    const { data: interview, error } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('id', id)
      .single();

    console.log('Database query result:', { interview: !!interview, error });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!interview) {
      console.log('Interview not found');
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Check if user owns this interview
    if (interview.user_id !== userId) {
      console.log('Access denied: User does not own this interview');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update status and set startDateTime if starting interview
    const updateData: {
      status: string;
      updated_at: string;
      start_date_time?: string;
    } = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'in-progress') {
      updateData.start_date_time = new Date().toISOString();
    }

    const { data: updatedInterview, error: updateError } = await supabaseAdmin
      .from('interviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating interview:', updateError);
      return NextResponse.json(
        { error: 'Failed to update interview' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      interview: updatedInterview,
    });
  } catch (error) {
    console.error('Error updating interview:', error);
    return NextResponse.json(
      { error: 'Failed to update interview' },
      { status: 500 }
    );
  }
}
