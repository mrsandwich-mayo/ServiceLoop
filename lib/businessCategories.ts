export interface BusinessCategoryGroup {
  category: string;
  options: string[];
}

export const BUSINESS_CATEGORY_GROUPS: BusinessCategoryGroup[] = [
  {
    category: 'Healthcare, Dental & Wellness',
    options: [
      'Dental Clinic & Oral Care',
      'Medical Clinic & Doctor Practice',
      'Physiotherapy & Rehabilitation',
      'Diagnostic Lab & Pathology',
      'Veterinary & Pet Care Clinic',
      'Pharmacy & Medical Store',
    ],
  },
  {
    category: 'Painting, Finishing & Waterproofing',
    options: [
      'Painting & Wall Finishes',
      'Waterproofing & Damp Proofing',
      'Texture Painting & Stencil Work',
      'Wood Polishing & PU Coating',
      'Epoxy & Floor Coating',
    ],
  },
  {
    category: 'Electrical, Plumbing & HVAC',
    options: [
      'Electrical & Wiring Services',
      'Plumbing & Sanitary Works',
      'HVAC, AC Repair & Ducting',
      'Solar Panel Installation & Care',
      'Generator & Power Backup Services',
    ],
  },
  {
    category: 'Home & Construction Trades',
    options: [
      'Carpentry & Custom Furniture',
      'Interior Design & Renovation',
      'Flooring, Tiling & Marble Polishing',
      'Roofing, Waterproofing & Gutters',
      'Civil Contractor & Masonry',
      'Welding, Fabrication & Grills',
      'Glass, Aluminum & UPVC Glazing',
    ],
  },
  {
    category: 'Appliance & Facility Care',
    options: [
      'Appliance Service & Repair',
      'Deep Cleaning & Housekeeping',
      'Pest Control & Anti-Termite Treatment',
      'Disinfection & Sanitization Services',
      'Waste Management & Recycling',
    ],
  },
  {
    category: 'Automotive & Fleet',
    options: [
      'Automobile Garage & Mechanical Repair',
      'Car Detailing, Ceramic & Washing',
      'Two-Wheeler Service Center',
      'Towing & Roadside Assistance',
      'Tyre, Wheel Alignment & Battery Service',
    ],
  },
  {
    category: 'Personal Care, Beauty & Lifestyle',
    options: [
      'Salon, Hair & Beauty Parlour',
      'Spa, Massage & Wellness Center',
      'Fitness Gym & Personal Training',
      'Yoga & Holistic Health Studio',
      'Daycare & Childcare Center',
    ],
  },
  {
    category: 'Events, Creative & Food',
    options: [
      'Event Planning, Decor & Sound',
      'Catering & Food Services',
      'Photography & Videography Studio',
      'Floral & Balloon Decoration',
    ],
  },
  {
    category: 'IT, Security & Professional Services',
    options: [
      'IT Support & Computer Hardware Repair',
      'CCTV, Biometric & Security Systems',
      'Consulting, Legal & Tax Advisory',
      'Digital Marketing & Creative Agency',
      'Printing, Signage & Flex Banners',
      'Courier, Cargo & Logistics Services',
    ],
  },
  {
    category: 'Other Services',
    options: [
      'Other Service Business (Specify Below)',
    ],
  },
];

export const ALL_BUSINESS_TYPES: string[] = BUSINESS_CATEGORY_GROUPS.flatMap((g) => g.options);

export const QUICK_SERVICE_PRESETS = [
  { label: 'Dental Clinic', value: 'Dental Clinic & Oral Care', emoji: '🦷' },
  { label: 'Painting', value: 'Painting & Wall Finishes', emoji: '🎨' },
  { label: 'Electrical', value: 'Electrical & Wiring Services', emoji: '⚡' },
  { label: 'Plumbing', value: 'Plumbing & Sanitary Works', emoji: '🔧' },
  { label: 'HVAC / AC', value: 'HVAC, AC Repair & Ducting', emoji: '❄️' },
  { label: 'Auto Care', value: 'Automobile Garage & Mechanical Repair', emoji: '🚗' },
  { label: 'Deep Cleaning', value: 'Deep Cleaning & Housekeeping', emoji: '✨' },
  { label: 'Pest Control', value: 'Pest Control & Anti-Termite Treatment', emoji: '🛡️' },
  { label: 'Carpentry', value: 'Carpentry & Custom Furniture', emoji: '🪚' },
  { label: 'Salon / Spa', value: 'Salon, Hair & Beauty Parlour', emoji: '✂️' },
];
