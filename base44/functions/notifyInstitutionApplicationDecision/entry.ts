import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
    }

    const { applicant_email, institution_name, status, feedback } = await req.json();

    if (!applicant_email || !institution_name || !status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subject = status === 'approved' 
      ? `Institution Dashboard Approved: ${institution_name}`
      : `Institution Dashboard Application Update: ${institution_name}`;

    const body = status === 'approved'
      ? `Hello,\n\nGreat news! Your Institution Dashboard application for "${institution_name}" has been approved. You can now access your institution dashboard to manage members, groups, and activities.\n\nThank you for your commitment to our community.\n\nBest regards,\nGeneration LightMode Team`
      : `Hello,\n\nThank you for submitting your Institution Dashboard application for "${institution_name}". After review, we have decided not to approve this application at this time.\n\n${feedback ? `Feedback: ${feedback}` : 'Please contact our support team if you have any questions.'}\n\nBest regards,\nGeneration LightMode Team`;

    await base44.integrations.Core.SendEmail({
      to: applicant_email,
      subject,
      body
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});