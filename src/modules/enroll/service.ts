import { db } from "@/src/lib/db";
import { LinkStatus, ActivityType, EnrollmentStatus, DocKind } from "@/src/generated/prisma/enums";
import type { EnrollmentApplication } from "./schemas";

export class EnrollError extends Error {}

/**
 * Loads and advances an enrollment link for the public /enroll/[token] page.
 * SENT → OPENED on first view; SENT/OPENED past expiry → EXPIRED.
 */
export async function getEnrollmentLink(token: string) {
  if (!/^[a-zA-Z0-9_-]{20,}$/.test(token)) return null;

  const link = await db.enrollmentLink.findUnique({
    where: { token },
    include: {
      lead: { select: { id: true, full_name: true, email: true, mobile: true } },
      batch: { include: { course: true } },
      enrollment: { select: { id: true, status: true } },
    },
  });
  if (!link) return null;

  const open = link.status === LinkStatus.SENT || link.status === LinkStatus.OPENED;
  if (open && link.expires_at < new Date()) {
    await db.enrollmentLink.update({
      where: { id: link.id },
      data: { status: LinkStatus.EXPIRED },
    });
    return { ...link, status: LinkStatus.EXPIRED };
  }

  if (link.status === LinkStatus.SENT) {
    await db.enrollmentLink.update({
      where: { id: link.id },
      data: { status: LinkStatus.OPENED },
    });
    await db.activity.create({
      data: {
        type: ActivityType.SYSTEM,
        body: `Enrollment link opened (${link.batch.course.name} · ${link.batch.name})`,
        lead_id: link.lead_id,
      },
    });
    return { ...link, status: LinkStatus.OPENED };
  }

  return link;
}

/**
 * Funnel step 7: student completes the full application. Creates Student +
 * Enrollment (PAYMENT_PENDING) atomically, records uploaded documents, and marks
 * the link COMPLETED. Idempotent per token.
 */
export async function completeEnrollment(token: string, form: EnrollmentApplication) {
  const fullName = `${form.first_name} ${form.last_name}`.trim();
  const email = form.email.toLowerCase();

  // A short human summary for the Student.qualification column.
  const qualification =
    form.is_student && form.degree
      ? [form.degree, form.course].filter(Boolean).join(" · ")
      : form.is_working_professional && form.designation
        ? [form.designation, form.company_name].filter(Boolean).join(" @ ")
        : null;

  // Everything the Student table has no dedicated column for lives here.
  const profile = {
    gender: form.gender,
    address: form.address,
    country: form.country,
    zip_code: form.zip_code,
    nationality: form.nationality,
    is_student: form.is_student,
    is_working_professional: form.is_working_professional,
    academic: form.is_student
      ? {
          university: form.university,
          college: form.college || null,
          degree: form.degree,
          course: form.course,
          year_of_study: form.year_of_study,
          graduation_year: form.graduation_year,
        }
      : null,
    professional: form.is_working_professional
      ? {
          company_name: form.company_name,
          designation: form.designation,
          experience: form.experience || null,
        }
      : null,
    linkedin: form.linkedin || null,
    medical_registration_number: form.medical_registration_number || null,
    resume: form.resume,
    consent: {
      accepted: form.consent,
      accepted_at: new Date().toISOString(),
    },
  };

  return db.$transaction(async (tx) => {
    const link = await tx.enrollmentLink.findUnique({
      where: { token },
      include: { batch: { include: { course: true } } },
    });
    if (!link) throw new EnrollError("This enrollment link is not valid.");
    if (link.status === LinkStatus.COMPLETED && link.enrollment_id) {
      return { enrollmentId: link.enrollment_id, alreadyCompleted: true };
    }
    if (link.status === LinkStatus.REVOKED) {
      throw new EnrollError("This enrollment link has been withdrawn. Please contact us.");
    }
    if (link.expires_at < new Date()) {
      throw new EnrollError("This enrollment link has expired. Please ask us for a fresh one.");
    }

    const student = await tx.student.upsert({
      where: { email },
      create: {
        full_name: fullName,
        email,
        phone: form.phone,
        whatsapp: form.whatsapp || form.phone,
        city: form.city,
        state: form.state,
        qualification,
        extra: profile,
      },
      update: {
        full_name: fullName,
        phone: form.phone,
        whatsapp: form.whatsapp || form.phone,
        city: form.city,
        state: form.state,
        qualification,
        extra: profile,
      },
    });

    const enrollment = await tx.enrollment.upsert({
      where: {
        student_id_batch_id: { student_id: student.id, batch_id: link.batch_id },
      },
      create: {
        student_id: student.id,
        batch_id: link.batch_id,
        status: EnrollmentStatus.PAYMENT_PENDING,
        price_paise: link.price_paise,
        discount_paise: link.discount_paise,
        source_lead_id: link.lead_id,
      },
      update: {},
    });

    // Register the résumé as a Document row (owner = the student).
    const uploads: Array<{ kind: DocKind; doc: { key: string; mime: string; size: number } }> = [
      { kind: DocKind.OTHER, doc: form.resume },
    ];

    await tx.document.createMany({
      data: uploads.map(({ kind, doc }) => ({
        owner_type: "student",
        owner_id: student.id,
        kind,
        r2_key: doc.key,
        mime: doc.mime,
        size_bytes: doc.size,
      })),
    });

    await tx.enrollmentLink.update({
      where: { id: link.id },
      data: { status: LinkStatus.COMPLETED, enrollment_id: enrollment.id },
    });

    await tx.lead.update({
      where: { id: link.lead_id },
      data: { converted_student_id: student.id, updated_at: new Date() },
    });

    await tx.activity.create({
      data: {
        type: ActivityType.SYSTEM,
        body: `Enrollment form completed — ${link.batch.course.name} · ${link.batch.name}. Awaiting payment.`,
        lead_id: link.lead_id,
        student_id: student.id,
        enrollment_id: enrollment.id,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "enrollment.form_completed",
        entity_type: "enrollment",
        entity_id: enrollment.id,
        after: { student_id: student.id, batch_id: link.batch_id, price_paise: link.price_paise },
      },
    });

    return { enrollmentId: enrollment.id, alreadyCompleted: false };
  });
}
