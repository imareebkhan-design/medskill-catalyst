import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { getServiceClient } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { full_name, email, mobile, user_type, company_name, college_name } = req.body;

    // Validate request
    if (!email || !full_name) {
      return res.status(422).json({ error: "Name and email are required." });
    }

    const leadId = Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();

    const newLead = {
      id: leadId,
      full_name,
      email,
      mobile: mobile || "",
      user_type: user_type || "professional",
      company_name: company_name || "",
      college_name: college_name || "",
      created_at: createdAt
    };

    // 1. Save to local data/leads.json
    try {
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const filePath = path.join(dataDir, "leads.json");
      let leads = [];
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf8");
        leads = JSON.parse(fileContent || "[]");
      }
      leads.push(newLead);
      fs.writeFileSync(filePath, JSON.stringify(leads, null, 2), "utf8");
      console.log(`[Local Database] Saved lead successfully to data/leads.json: ${email}`);
    } catch (dbError) {
      console.error("Local storage save error:", dbError);
    }

    // 2. Save to Supabase (if keys are configured in environment)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = getServiceClient();
        const { error } = await supabase
          .from("webinar_registrations")
          .upsert({
            full_name,
            email,
            mobile: mobile || "",
            user_type: user_type || "professional",
            company_name: company_name || "",
            college_name: college_name || "",
            course: "N/A",
            graduation_year: "2026",
            job_title: "N/A",
            experience: "1-3"
          }, { onConflict: "email" });

        if (error) {
          console.error("Supabase write error:", error);
        } else {
          console.log(`[Supabase Database] Saved lead successfully: ${email}`);
        }
      } catch (supabaseError) {
        console.error("Supabase client init/write error:", supabaseError);
      }
    }

    // 3. Scaffold email dispatch
    console.log(`[Email Dispatch] Triggering welcome/guide email to: ${email}`);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
