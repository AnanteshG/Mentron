import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
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

    // Get user profile from Supabase
    const { data: userProfile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    // If no profile exists, create one
    if (!userProfile) {
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: userId,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        userProfile: newProfile,
      });
    }

    return NextResponse.json({
      success: true,
      userProfile,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
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

    // Reset user profile resume data
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        resume_url: null,
        resume_summary: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting user profile:', error);
      return NextResponse.json(
        { error: 'Failed to reset user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User profile reset successfully'
    });
  } catch (error) {
    console.error('Error resetting user profile:', error);
    return NextResponse.json(
      { error: 'Failed to reset user profile' },
      { status: 500 }
    );
  }
}
