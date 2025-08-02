import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUrl, fileContent, fileName } = await req.json();

    if (!fileUrl || !fileContent) {
      return NextResponse.json(
        { error: 'File URL and content are required' },
        { status: 400 }
      );
    }

    // Generate resume summary using Gemini
    const { text: resumeSummary } = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: `Please analyze this resume and provide a concise summary (2-3 sentences) highlighting the candidate's key skills, experience, and qualifications:\n\n${fileContent}`,
    });

    console.log('resumeSummary', resumeSummary);

    // Save/update user profile in Supabase
    const timestamp = new Date().toISOString();
    
    // Check if user profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    let userProfile;

    if (existingProfile) {
      // Update existing profile
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          resume_url: fileUrl,
          resume_summary: resumeSummary,
          updated_at: timestamp
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        return NextResponse.json(
          { error: 'Failed to update user profile' },
          { status: 500 }
        );
      }

      userProfile = data;
    } else {
      // Create new profile
      const { data, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          resume_url: fileUrl,
          resume_summary: resumeSummary,
          created_at: timestamp,
          updated_at: timestamp
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user profile:', insertError);
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }

      userProfile = data;
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      resumeSummary,
      userProfile,
      fileName,
    });
  } catch (error) {
    console.error('Error processing resume:', error);
    return NextResponse.json(
      { error: 'Failed to process resume' },
      { status: 500 }
    );
  }
}
