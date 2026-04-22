export type VisitType = "First-Time" | "Returning";
export type Gender = "Male" | "Female" | "Other";

export interface ReasonCategory {
  name: string;
  items: string[];
}

export interface FormOptions {
  reasons: ReasonCategory[];
  sources: string[];
}

export interface PatientSubmission {
  fullName: string;
  mobileNumber: string;
  visitType?: VisitType;
  age?: string;
  gender?: Gender | string;
  address?: string;
  selectedCategory?: string;
  reason?: string;
  leadSource?: string;
  otherSourceDetails?: string;
  adAttribution?: string;
}

export const DEFAULT_FORM_OPTIONS: FormOptions = {
  reasons: [
    { name: "Medical Retina", items: ["Surgery", "Non Surgery"] },
    { name: "Glaucoma Management", items: ["Surgery", "Non Surgery"] },
    { name: "Uveitis Treatment", items: ["Surgery", "Non Surgery"] },
    { name: "Optical Services", items: ["Surgery", "Non Surgery"] },
    { name: "Prescription Glasses", items: ["Surgery", "Non Surgery"] },
    { name: "Contact Lenses", items: ["Surgery", "Non Surgery"] },
    { name: "Refractive Error Correction", items: ["Surgery", "Non Surgery"] },
    { name: "Cataract Surgery", items: ["Surgery", "Non Surgery"] },
    { name: "Retina Injections", items: ["Surgery", "Non Surgery"] }
  ],
  sources: [
    "Google Search",
    "Google Ads",
    "Instagram",
    "Facebook",
    "Practo",
    "Google Maps",
    "Friend / Family",
    "Walk-in",
    "Other"
  ]
};
