import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get interview from Supabase
    const { data: interview, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Check if user owns this interview
    if (interview.user_id !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if interview is in-progress and startDateTime is older than 5 minutes
    if (interview.status === 'in-progress' && interview.start_date_time) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const startDateTime = new Date(interview.start_date_time);
      
      if (startDateTime < fiveMinutesAgo) {
        // Mark as completed if it's been more than 5 minutes
        const { error: updateError } = await supabase
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
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await req.json();

    if (
      !status ||
      !['scheduled', 'in-progress', 'completed'].includes(status)
    ) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get interview from Supabase
    const { data: interview, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Check if user owns this interview
    if (interview.user_id !== userId) {
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

    const { data: updatedInterview, error: updateError } = await supabase
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
