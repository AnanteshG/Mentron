import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      console.error('Supabase admin client not available');
      console.error('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    console.log('Using supabaseAdmin for upload. Service role key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);

    const formData = await req.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create a unique file name
    const fileName = `${userId}-${Date.now()}-${file.name}`;
    
    // Upload file to Supabase Storage
    const { error: storageError } = await supabaseAdmin
      .storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file);

    if (storageError) {
      console.error('Error uploading file to storage:', storageError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get file URL
    const { data: publicUrlData } = supabaseAdmin
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    const fileUrl = publicUrlData.publicUrl;

    // Read file content for AI processing
    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString('utf-8');

    // Generate resume summary using Gemini
    const { text: resumeSummary } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `Please analyze this resume and provide a concise summary (2-3 sentences) highlighting the candidate's key skills, experience, and qualifications:\n\n${fileContent}`,
    });

    // Save/update user profile in Supabase
    const timestamp = new Date().toISOString();
    
    // Check if user profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { data: userProfile, error: updateError } = await supabaseAdmin
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

      return NextResponse.json({
        success: true,
        fileUrl,
        resumeSummary,
        userProfile,
      });
    } else {
      // Create new profile
      const { data: userProfile, error: insertError } = await supabaseAdmin
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

      return NextResponse.json({
        success: true,
        fileUrl,
        resumeSummary,
        userProfile,
      });
    }
  } catch (error) {
    console.error('Error uploading resume:', error);
    return NextResponse.json(
      { error: 'Failed to upload resume' },
      { status: 500 }
    );
  }
}
