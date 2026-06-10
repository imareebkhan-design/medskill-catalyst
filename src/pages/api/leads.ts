import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { getServiceClient } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verification passcode
  const passcode = req.headers["x-admin-passcode"] || req.query.passcode;
  if (passcode !== "medskills2026" && passcode !== "admin") {
    return res.status(401).json({ error: "Unauthorized. Invalid passcode." });
  }

  try {
    let leads: any[] = [];

    // 1. Read local leads from data/leads.json
    const filePath = path.join(process.cwd(), "data", "leads.json");
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      leads = JSON.parse(fileContent || "[]");
    }

    // 2. Fetch from Supabase as well (if configured)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = getServiceClient();
        const { data, error } = await supabase
          .from("webinar_registrations")
          .select("*");

        if (error) {
          console.error("Supabase read error in dashboard API:", error);
        } else if (data && data.length > 0) {
          // Merge Supabase leads and local leads, filtering duplicates by email
          const emailMap = new Map();
          
          // Add local leads first
          leads.forEach((l) => emailMap.set(l.email, l));
          
          // Add Supabase leads
          data.forEach((sLead: any) => {
            const mapped = {
              id: sLead.id || Math.random().toString(36).substring(2, 9),
              full_name: sLead.full_name || "",
              email: sLead.email || "",
              mobile: sLead.mobile || "",
              user_type: sLead.user_type || "professional",
              company_name: sLead.company_name || "",
              college_name: sLead.college_name || "",
              created_at: sLead.created_at || new Date().toISOString()
            };
            emailMap.set(mapped.email, mapped);
          });
          
          leads = Array.from(emailMap.values());
        }
      } catch (supabaseError) {
        console.error("Supabase read error in dashboard API:", supabaseError);
      }
    }

    // Sort leads by created_at descending
    leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.status(200).json(leads);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
