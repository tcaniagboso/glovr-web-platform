import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // HANDLE OPTIONS FIRST
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("FUNCTION HIT");

    // NOW safe to parse JSON
    const { email } = await req.json();

    const link = `https://tcaniagboso.github.io/glovr-web-platform/?email=${encodeURIComponent(email)}`;

    const response = await resend.emails.send({
      from: "GLOVR <onboarding@resend.dev>",
      to: email,
      subject: "You've been invited to GLOVR",
      html: `
      <h2>You’ve been invited to GLOVR</h2>

      <p>
        A licensed therapist has invited you to join <strong>GLOVR</strong>,
        a virtual reality hand rehabilitation platform designed to support
        your recovery and track your progress.
      </p>

      <p>Through GLOVR, you’ll be able to:</p>

      <ul>
        <li>Complete guided rehab sessions</li>
        <li>Track your progress over time</li>
        <li>Stay connected with your therapist</li>
      </ul>

      <p>
        <strong>Important:</strong> This invitation was sent to:
        <strong>${email}</strong>
      </p>

      <p>
        Use this link to sign up or log in and connect with your therapist.
      </p>

      <p>
        <a href="${link}" style="
          display: inline-block;
          padding: 10px 16px;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
        ">
          Accept your invite
        </a>
      </p>

      <p style="color: #6b7280; font-size: 14px;">
        If you did not expect this invitation, you can safely ignore this email.
      </p>

      <p style="margin-top: 20px;">
        Best,<br/>
        <strong>The GLOVR Team</strong>
      </p>
    `,
    });

    console.log("EMAIL RESPONSE:", response);

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (err) {
    console.error("ERROR:", err);

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});