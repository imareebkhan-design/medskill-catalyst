import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

function generateApplicationId(jobSlug: string): string {
  const prefix = jobSlug === "campus-ambassador" ? "AMB" : jobSlug.toUpperCase().slice(0, 3);
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `MSC-${prefix}-${year}-${rand}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // 1. Core Fields
    const jobSlug = formData.get("job_slug") as string;
    const fullName = formData.get("full_name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const whatsapp = formData.get("whatsapp") as string;
    const gender = formData.get("gender") as string || null;
    const dobStr = formData.get("dob") as string || null;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const country = formData.get("country") as string;
    const address = formData.get("address") as string || null;

    // Academic Info
    const university = formData.get("university") as string;
    const college = formData.get("college") as string || null;
    const degree = formData.get("degree") as string || null;
    const course = formData.get("course") as string || null;
    const currentYear = formData.get("current_year") as string || null;
    const graduationYear = formData.get("graduation_year") as string || null;
    const cgpa = formData.get("cgpa") as string || null;

    // Professional Background
    const previousInternship = formData.get("previous_internship") as string || null;
    const leadershipExperience = formData.get("leadership_experience") as string || null;
    const clubs = formData.get("clubs") as string || null;
    const volunteerWork = formData.get("volunteer_work") as string || null;
    const eventExperience = formData.get("event_experience") as string || null;

    // Skills
    const skillsRaw = formData.get("skills") as string || "[]";
    let skills: string[] = [];
    try {
      skills = JSON.parse(skillsRaw);
    } catch {
      skills = skillsRaw.split(",").map(s => s.trim()).filter(Boolean);
    }

    // Online Presence
    const linkedin = formData.get("linkedin") as string || null;
    const instagram = formData.get("instagram") as string || null;
    const portfolio = formData.get("portfolio") as string || null;
    const github = formData.get("github") as string || null;

    // Short Answers
    const whyJoin = formData.get("why_join") as string || null;
    const leadershipStory = formData.get("leadership_story") as string || null;
    const promotionPlan = formData.get("promotion_plan") as string || null;

    // Attribution
    const utmSource = formData.get("utm_source") as string || null;
    const utmMedium = formData.get("utm_medium") as string || null;
    const utmCampaign = formData.get("utm_campaign") as string || null;
    const utmContent = formData.get("utm_content") as string || null;
    const utmTerm = formData.get("utm_term") as string || null;
    const referrerUrl = formData.get("referrer_url") as string || null;

    // 2. Validate Inputs
    if (!jobSlug || !fullName || !email || !phone || !city || !state || !country || !university) {
      return NextResponse.json({ error: "Missing required form fields." }, { status: 400 });
    }

    const resume = formData.get("resume") as File | null;
    if (!resume) {
      return NextResponse.json({ error: "Resume file is required." }, { status: 400 });
    }

    // Validate size limit (5MB)
    if (resume.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Resume size exceeds the 5MB limit." }, { status: 400 });
    }

    // Validate type
    const resumeExt = resume.name.split(".").pop()?.toLowerCase();
    if (!resumeExt || !["pdf", "doc", "docx"].includes(resumeExt)) {
      return NextResponse.json({ error: "Invalid resume format. Only PDF, DOC, and DOCX are accepted." }, { status: 400 });
    }

    // 3. Supabase Client & Bucket Creation
    const supabase = getServiceClient();

    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some(b => b.name === "careers")) {
      const { error: bucketError } = await supabase.storage.createBucket("careers", {
        public: true,
        fileSizeLimit: 6 * 1024 * 1024,
      });
      if (bucketError) {
        console.error("Storage bucket creation error:", bucketError);
        return NextResponse.json({ error: "Failed to initialize upload storage." }, { status: 500 });
      }
    }

    // Upload Helper
    const uploadFile = async (file: File | null, folder: string, prefix: string): Promise<string> => {
      if (!file) return "";
      const ext = file.name.split(".").pop();
      const fileName = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;
      const filePath = `${folder}/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("careers")
        .upload(filePath, buffer, {
          contentType: file.type || "application/octet-stream",
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage.from("careers").getPublicUrl(filePath);
      return urlData.publicUrl;
    };

    // 4. Perform Uploads
    let resumeUrl = "";
    let certificatesUrl = "";
    let portfolioUrl = "";
    let achievementsUrl = "";

    try {
      resumeUrl = await uploadFile(resume, "resumes", "resume");
      
      const certFile = formData.get("certificates") as File | null;
      if (certFile && certFile.size > 0) {
        certificatesUrl = await uploadFile(certFile, "certificates", "cert");
      }

      const portFile = formData.get("portfolio_file") as File | null;
      if (portFile && portFile.size > 0) {
        portfolioUrl = await uploadFile(portFile, "portfolios", "port");
      }

      const achFile = formData.get("achievements") as File | null;
      if (achFile && achFile.size > 0) {
        achievementsUrl = await uploadFile(achFile, "achievements", "ach");
      }
    } catch (uploadErr: any) {
      console.error("File upload failure:", uploadErr);
      return NextResponse.json({ error: uploadErr.message || "Failed to upload files." }, { status: 500 });
    }

    // 5. Generate Application ID & Metadata
    const applicationId = generateApplicationId(jobSlug);
    const dob = dobStr ? new Date(dobStr).toISOString().slice(0, 10) : null;
    
    // Server-side parsed metadata
    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || null;

    let device = "Desktop";
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(userAgent)) {
      device = "Mobile";
    } else if (/Tablet|iPad/i.test(userAgent)) {
      device = "Tablet";
    }

    let browser = "Other";
    if (userAgent.includes("Chrome") && !userAgent.includes("Chromium")) {
      browser = "Chrome";
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      browser = "Safari";
    } else if (userAgent.includes("Firefox")) {
      browser = "Firefox";
    } else if (userAgent.includes("Edge")) {
      browser = "Edge";
    }

    // 6. Save Database Record
    const dbPayload = {
      application_id: applicationId,
      job_slug: jobSlug,
      full_name: fullName,
      email,
      phone,
      whatsapp,
      gender,
      dob,
      city,
      state,
      country,
      address,
      university,
      college,
      degree,
      course,
      current_year: currentYear,
      graduation_year: graduationYear,
      cgpa,
      previous_internship: previousInternship,
      leadership_experience: leadershipExperience,
      clubs,
      volunteer_work: volunteerWork,
      event_experience: eventExperience,
      skills,
      linkedin,
      instagram,
      portfolio,
      github,
      why_join: whyJoin,
      leadership_story: leadershipStory,
      promotion_plan: promotionPlan,
      resume_url: resumeUrl,
      certificates_url: certificatesUrl || null,
      portfolio_url: portfolioUrl || null,
      achievements_url: achievementsUrl || null,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      utm_term: utmTerm,
      referrer_url: referrerUrl,
      device,
      browser,
      ip_address: ipAddress
    };

    const { data: dbData, error: dbError } = await supabase
      .from("career_applications")
      .insert([dbPayload])
      .select();

    if (dbError) {
      console.error("Database insertion error:", dbError);
      return NextResponse.json({ error: "Failed to save application to database." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      application_id: applicationId,
      data: dbData[0]
    });
  } catch (err: any) {
    console.error("Critical apply API failure:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
