import jsPDF from "jspdf";

interface Education {
  school: string;
  degree: string;
  field: string;
  start_year: string;
  end_year: string;
}

interface Experience {
  company: string;
  position: string;
  description: string;
  start_date: string;
  end_date: string;
  current: boolean;
}

interface CvData {
  full_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  skills: string[] | null;
  cv_education: Education[];
  cv_experience: Experience[];
  cv_languages: string[];
}

const PRIMARY = [0, 100, 62]; // green-ish
const DARK = [30, 30, 30];
const GRAY = [100, 100, 100];
const LIGHT_BG = [245, 247, 250];

export function generateCvPdf(data: CvData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  const checkPage = (need: number) => {
    if (y + need > 280) {
      doc.addPage();
      y = 20;
    }
  };

  // Header band
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.rect(0, 0, pageW, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(data.full_name, marginL, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const contactParts = [data.email, data.phone, data.location].filter(Boolean) as string[];
  doc.text(contactParts.join("  |  "), marginL, 28);

  if (data.bio) {
    doc.setFontSize(9);
    const bioLines = doc.splitTextToSize(data.bio, contentW);
    doc.text(bioLines.slice(0, 2), marginL, 35);
  }

  y = 48;
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);

  const drawSectionTitle = (title: string) => {
    checkPage(14);
    doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
    doc.rect(marginL, y - 4, contentW, 9, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(title, marginL + 2, y + 2);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    y += 10;
  };

  // Skills
  if (data.skills && data.skills.length > 0) {
    drawSectionTitle("COMPÉTENCES");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const skillsText = data.skills.join("  •  ");
    const skillLines = doc.splitTextToSize(skillsText, contentW);
    checkPage(skillLines.length * 5);
    doc.text(skillLines, marginL, y);
    y += skillLines.length * 5 + 4;
  }

  // Experience
  if (data.cv_experience.length > 0) {
    drawSectionTitle("EXPÉRIENCE PROFESSIONNELLE");
    for (const exp of data.cv_experience) {
      checkPage(22);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(exp.position, marginL, y);
      y += 5;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
      const period = `${exp.start_date} – ${exp.current ? "Présent" : exp.end_date}`;
      doc.text(`${exp.company}  |  ${period}`, marginL, y);
      doc.setTextColor(DARK[0], DARK[1], DARK[2]);
      y += 5;

      if (exp.description) {
        doc.setFontSize(9);
        const descLines = doc.splitTextToSize(exp.description, contentW - 4);
        checkPage(descLines.length * 4);
        doc.text(descLines, marginL + 2, y);
        y += descLines.length * 4 + 2;
      }
      y += 3;
    }
  }

  // Education
  if (data.cv_education.length > 0) {
    drawSectionTitle("FORMATION");
    for (const edu of data.cv_education) {
      checkPage(14);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${edu.degree}${edu.field ? ` — ${edu.field}` : ""}`, marginL, y);
      y += 5;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
      doc.text(`${edu.school}  |  ${edu.start_year} – ${edu.end_year || "En cours"}`, marginL, y);
      doc.setTextColor(DARK[0], DARK[1], DARK[2]);
      y += 8;
    }
  }

  // Languages
  if (data.cv_languages.length > 0) {
    drawSectionTitle("LANGUES");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(data.cv_languages.join("  •  "), marginL, y);
    y += 8;
  }

  return doc;
}
