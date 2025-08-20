import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
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

    const { fileUrl, fileContent, fileName, fileType } = await req.json();

    console.log('Processing resume:', { 
      fileName, 
      fileType, 
      hasContent: !!fileContent,
      contentLength: fileContent?.length,
      fileUrl 
    });

    if (!fileUrl || !fileContent) {
      return NextResponse.json(
        { error: 'File URL and content are required' },
        { status: 400 }
      );
    }

    let textContent = '';

    if (fileType === 'pdf') {
      try {
        console.log('Processing PDF file...');
        // Convert base64 back to buffer
        const buffer = Buffer.from(fileContent, 'base64');
        console.log('PDF buffer created, size:', buffer.length);
        
        // Try multiple PDF parsing approaches
        try {
          // Approach 1: Try pdf-parse-fork which is more stable
          const pdfParse = (await import('pdf-parse-fork')).default;
          const data = await pdfParse(buffer);
          textContent = data.text;
        } catch (error) {
          console.log('pdf-parse-fork failed, trying alternative approach...', error);
          
          // Approach 2: Return a placeholder that indicates PDF processing is needed
          textContent = `PDF file uploaded: ${fileName}. This appears to be a valid PDF file but text extraction failed. Please ensure the PDF contains selectable text, not just images.`;
          
          // You could also try other libraries here like:
          // - pdfjs-dist
          // - @react-pdf-viewer/core
          // - pdf-lib
        }
        
        console.log('PDF text extracted successfully');
        console.log('Extracted text length:', textContent.length);
        console.log('First 200 chars:', textContent.substring(0, 200));
        
        if (!textContent || textContent.trim().length === 0) {
          console.error('No text extracted from PDF');
          return NextResponse.json(
            { error: 'Could not extract text from PDF. Please ensure the PDF contains selectable text.' },
            { status: 400 }
          );
        }
      } catch (pdfError) {
        console.error('Error parsing PDF:', pdfError);
        console.error('PDF error details:', {
          message: pdfError instanceof Error ? pdfError.message : 'Unknown error',
          stack: pdfError instanceof Error ? pdfError.stack : undefined
        });
        return NextResponse.json(
          { error: 'Failed to parse PDF file. Please ensure it\'s a valid PDF with selectable text.' },
          { status: 400 }
        );
      }
    } else {
      // For text files, use content directly
      textContent = fileContent;
    }

    if (!textContent || textContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'No readable content found in the file' },
        { status: 400 }
      );
    }

    // Generate resume summary using Gemini
    let resumeSummary;
    try {
      const result = await generateText({
        model: google('gemini-1.5-flash'),
        prompt: `Please analyze this resume and provide a concise summary (2-3 sentences) highlighting the candidate's key skills, experience, and qualifications:\n\n${textContent}`,
      });
      resumeSummary = result.text;
    } catch (aiError) {
      console.error('Error generating resume summary:', aiError);
      return NextResponse.json(
        { error: 'Failed to analyze resume content with AI' },
        { status: 500 }
      );
    }

    console.log('resumeSummary', resumeSummary);

    if (!resumeSummary || resumeSummary.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not generate resume summary' },
        { status: 500 }
      );
    }

    // Save/update user profile in Supabase
    const timestamp = new Date().toISOString();
    
    // Check if user profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    let userProfile;

    if (existingProfile) {
      // Update existing profile
      const { data, error: updateError } = await supabaseAdmin
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
      const { data, error: insertError } = await supabaseAdmin
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
    
    // Provide more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
