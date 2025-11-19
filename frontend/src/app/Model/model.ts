export interface Screen {
  ScreenID: number;
  ScreenName: string;
  Location: string;
  City: string;
  State: string;
  Latitude: string;
  Longitude: string;
  ScreenType: string;
  Size: string;
  Resolution: string;
  OwnerName: string;
  ContactPerson: string;
  ContactNumber: string;
  OnboardingDate: string;   // ISO Date string
  Status: string;
  RentalCost: string;       // could be number if always numeric
  ContractStartDate: string;
  ContractEndDate: string;
  PowerBackup: number;      // 1 = Yes, 0 = No
  InternetConnectivity: string;
  Notes: string;
}
export interface Vehicle {
  v_id: number;
  v_type: string;
  v_number: string;
  v_area: string;
  v_city: string;
  v_start_date: string; // ISO date string
  v_end_date: string;   // ISO date string
  v_duration_days: number;
  expected_crowd: number;
  v_contact_person_name: string;
  v_contact_num: string;
  v_cost: string; // keep as string if storing currency directly
  payment_status: "Paid" | "Pending";
  remarks: string;
  created_at: string; // ISO date string
}
export interface balloon {
  b_id: number;                     // Billboard ID
  b_location_name: string;           // Location name (e.g., "Central Mall")
  b_area: string;                    // Area (e.g., MG Road)
  b_city: string;                    // City (e.g., Pune)
  b_address: string;                 // Full address
  b_lat: string;                     // Latitude
  b_long: string;                    // Longitude
  b_size: string;                    // Size (Small, Medium, Large)
  b_type: string;                    // Billboard type (e.g., Sky, LED)
  b_height: number;                  // Height in feet/meters
  b_duration_days: number;           // Duration of booking in days
  b_start_date: string;              // Start date (ISO string)
  b_end_date: string;                // End date (ISO string)
  expected_crowd: number;            // Estimated crowd
  b_contact_person_name: string;     // Contact person name
  b_contact_num: string;             // Contact number
  b_cost: string;                    // Cost (can keep string if backend returns decimal as string)
  payment_status: 'Paid' | 'Pending';// Payment status
  remarks: string;                   // Extra notes
  created_at: string;                // Record created date (ISO string)
}
export interface Society {
  s_id: number;                        // Unique society/event ID
  s_name: string;                      // Society name (e.g., Green Valley Apartments)
  s_area: string;                      // Area (e.g., MG Road)
  s_city: string;                      // City (e.g., Pune)
  s_pincode: string;                   // Pincode (e.g., 411001)
  s_contact_person_name: string;       // Contact person name
  s_contact_num: string;               // Contact number
  s_no_flats: number;                  // No. of flats in the society
  s_type: string;                      // Type (Residential / Commercial)
  s_event_type: string;                // Event type (e.g., Ganesh Festival Campaign)
  event_date: string;                  // Event date (ISO string)
  event_time: string;                  // Event time (HH:mm:ss format)
  s_address: string;                   // Full address
  s_lat: string;                       // Latitude
  s_long: string;                      // Longitude
  s_crowd: number;                     // Expected crowd size
  approval_status: 'Approved' | 'Pending' | 'Rejected'; // Approval status
  event_status: 'Scheduled' | 'Completed' | 'Cancelled'; // Event status
  expected_cost: string;               // Expected campaign cost
  actual_cost: string;                 // Actual cost spent
  responsible_person: string;          // Person responsible
  follow_up_date: string;              // Follow-up date (ISO string)
  remarks: string;                     // Extra notes
  created_at: string;                  // Record created timestamp
  updated_at: string;                  // Record last updated timestamp
}
export interface Hoarding {
  h_id: number;
  h_name: string;
  address: string;
  city: string;
  state: string;
  latitude: number | string;       // Accept both string and number
  longitude: number | string;
  size: string;
  owner_name: string;
  contact_person: string;
  contact_number: string;
  ad_start_date: string;           // ISO date string
  ad_end_date: string;
  status: 'Available' | 'Occupied' | 'Under Maintenance' | 'Booked';
  rental_cost: number | string;
  contract_start_date: string;
  contract_end_date: string;
  notes?: string;
  created_at?: string;             // optional if auto-generated
}