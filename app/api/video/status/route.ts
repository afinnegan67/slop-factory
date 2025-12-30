import { NextResponse } from 'next/server';
import { getVideoEditingJob } from '@/lib/video-editor';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');
    const manifestId = searchParams.get('manifest_id');

    // Get specific job by ID
    if (jobId) {
      const job = await getVideoEditingJob(jobId);
      
      if (!job) {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        job: {
          id: job.id,
          manifest_id: job.manifest_id,
          status: job.status,
          progress: job.progress,
          current_step: job.current_step,
          final_video_url: job.final_video_url,
          error_message: job.error_message,
          started_at: job.started_at,
          completed_at: job.completed_at
        }
      });
    }

    // Get jobs for a manifest
    if (manifestId) {
      const { data: jobs, error } = await supabase
        .from('video_editing_jobs')
        .select('*')
        .eq('manifest_id', manifestId)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        jobs: jobs || []
      });
    }

    // List recent jobs
    const { data: jobs, error } = await supabase
      .from('video_editing_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobs: jobs || []
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to cancel a job (if still queued)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'job_id is required' },
        { status: 400 }
      );
    }

    // Check if job exists and is cancellable
    const job = await getVideoEditingJob(jobId);
    
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status === 'complete') {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel completed job' },
        { status: 400 }
      );
    }

    // Mark as failed/cancelled
    const { error } = await supabase
      .from('video_editing_jobs')
      .update({
        status: 'failed',
        error_message: 'Cancelled by user'
      })
      .eq('id', jobId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Job cancelled'
    });

  } catch (error) {
    console.error('Cancel job error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

