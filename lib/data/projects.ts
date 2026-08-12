/**
 * ------------------------------------------------------------------
 * MOJATECH — projects
 * ------------------------------------------------------------------
 * IMPORTANT: The entries below are EDITABLE TEMPLATES, not real project
 * records. Each one is flagged `placeholder: true` and is clearly
 * labelled as a template on the website, so nothing is fabricated.
 *
 * To publish a real project:
 *   1. Duplicate an entry.
 *   2. Fill in real name, location, description, challenge/approach/
 *      solution and (only if verified) result.
 *   3. Set `placeholder: false`.
 *   4. Add real images and update `imageLabel` to describe them.
 *
 * Set `placeholder: false` only for verified, authorised projects.
 * Client names should only be added with the client's permission.
 * ------------------------------------------------------------------
 */

export interface Project {
  slug: string;
  name: string;
  category: string;
  serviceSlug: string;
  location: string;
  summary: string;
  imageLabel: string;
  placeholder: boolean;
  completed?: string; // e.g. "2025" — only when known
  client?: string; // only with authorisation
  challenge: string;
  approach: string;
  solution: string;
  result?: string; // only verified outcomes
}

export const projects: Project[] = [
  {
    slug: "commercial-electrical-installation",
    name: "Commercial Electrical Installation",
    category: "Electrical Engineering",
    serviceSlug: "electrical-engineering",
    location: "Lagos, Nigeria",
    summary:
      "Template for a completed commercial electrical installation — replace with a real MOJATECH project record.",
    imageLabel: "Commercial Electrical Installation Project Image",
    placeholder: true,
    challenge:
      "[EDIT: Describe the client's situation — e.g. an office building with unreliable distribution and undocumented wiring.]",
    approach:
      "[EDIT: Describe how MOJATECH assessed and planned the work — surveys, load analysis, phased installation plan.]",
    solution:
      "[EDIT: Describe what was installed or corrected — distribution boards, circuits, protection, documentation.]",
  },
  {
    slug: "solar-power-project",
    name: "Solar Power Project",
    category: "Solar Power",
    serviceSlug: "solar-power",
    location: "Lagos, Nigeria",
    summary:
      "Template for a completed solar installation — replace with a real MOJATECH project record.",
    imageLabel: "Solar Installation Project Image",
    placeholder: true,
    challenge:
      "[EDIT: Describe the client's power situation and goals before the project.]",
    approach:
      "[EDIT: Describe the consultation, load assessment and system design.]",
    solution:
      "[EDIT: Describe the installed system — panels, power system, integration with existing electrical work.]",
  },
  {
    slug: "security-system-installation",
    name: "Security System Installation",
    category: "Security & Safety",
    serviceSlug: "security-safety",
    location: "Lagos, Nigeria",
    summary:
      "Template for a completed security installation — replace with a real MOJATECH project record.",
    imageLabel: "Security System Installation Project Image",
    placeholder: true,
    challenge: "[EDIT: Describe the protection problem the client needed solved.]",
    approach: "[EDIT: Describe the site assessment and system planning.]",
    solution: "[EDIT: Describe the installed security/safety systems.]",
  },
  {
    slug: "building-facility-project",
    name: "Building Facility Project",
    category: "Facility Solutions",
    serviceSlug: "facility-management",
    location: "Lagos, Nigeria",
    summary:
      "Template for a facility management engagement — replace with a real MOJATECH project record.",
    imageLabel: "Building Facility Project Image",
    placeholder: true,
    challenge: "[EDIT: Describe the building's condition and management needs.]",
    approach: "[EDIT: Describe how MOJATECH organised systems and maintenance.]",
    solution: "[EDIT: Describe the ongoing management/support delivered.]",
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** Real (non-placeholder) projects, used to decide what to feature. */
export const realProjects = projects.filter((p) => !p.placeholder);
