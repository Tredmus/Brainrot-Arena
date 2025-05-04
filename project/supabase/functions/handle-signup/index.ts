import { createClient } from 'npm:@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Configure custom email template
    await supabaseAdmin.auth.admin.updateConfig({
      email_template: {
        confirmation: {
          subject: 'Welcome to Brain Rot Arena - Confirm Your Account',
          content: `
            <h2>Welcome to Brain Rot Arena!</h2>
            <p>You're just one step away from joining the ultimate battle arena. Click the button below to confirm your account and begin your adventure!</p>
            <p>
              <a href="{{ .ConfirmationURL }}" style="
                display: inline-block;
                padding: 12px 24px;
                background: #9333ea;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
              ">
                Confirm Account
              </a>
            </p>
            <p>Or copy and paste this link:</p>
            <p>{{ .ConfirmationURL }}</p>
          `,
          redirect_to: 'https://brainrot-arena.netlify.app/'
        }
      }
    });

    return new Response(
      JSON.stringify({ message: 'Email template updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});