import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Search } from '../../SearchServices/search';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-screen-board-descript',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './screen-board-descript.html',
  styleUrl: './screen-board-descript.css'
})
export class ScreenBoardDescript implements OnInit {

  board: any = null;
  loading: boolean = true;
  imageBaseUrl: string = 'http://localhost:8080/uploads/';

  pdfUrl: SafeResourceUrl | null = null;
  pdfBlobUrl: string | null = null; // store raw blob URL

  isLoggedIn: boolean = false;


  // ⬅️ THIS VARIABLE WILL CONTROL WHICH UI TO SHOW
  currentSection: string = "details";         //// details | book | schedule | bidding
  nearBoards: any[] = [];

  // 📝 Booking Form Data
  bookingDetails = {
    fullName: '',
    email: '',
    phone: '',
    designReady: 'Yes', // 'Yes' | 'No'
    needDesignService: 'No', // 'Yes' | 'No'
    startDate: '',
    endDate: '',
    paymentCompleted: 'No', // 'Yes' | 'No'
    agreedToTerms: false,
    repeatService: 'No' // 'Yes' | 'No'
  };

  constructor(
    private route: ActivatedRoute,
    private searchService: Search,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private sanitizer: DomSanitizer //add for map url
  ) { }

  minDate: string = '';
  mapUrl!: SafeResourceUrl;

  ngOnInit(): void {
    this.checkLoginStatus();

    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      const type = params.get('service_type');

      if (id && type) {
        this.loadBoardDetails(type, id);
      }
    });
  }

  loadBoardDetails(type: string, id: number) {
    this.loading = true;
    this.board = null; // Clear previous board data

    this.searchService.getServiceDetails(type, id).subscribe({
      next: (res: any) => {
        let data = res.data ? res.data : res;

        this.board = this.normalizeData(data, type);

        // Fetch PDF AFTER board is loaded
        if (type === 'hoardings' && this.board?.h_id) {
          this.searchService.getHoardingPdf(this.board.h_id).subscribe({
            next: (blob) => {
              // Revoke old blob URL if exists
              if (this.pdfBlobUrl) {
                URL.revokeObjectURL(this.pdfBlobUrl);
              }
              // Create new blob URL
              this.pdfBlobUrl = URL.createObjectURL(blob);
              this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfBlobUrl); // only for template bindings if needed
              this.cdr.detectChanges(); // ensure template updates buttons
            },
            error: (err) => {
              console.warn('No PDF found for this hoarding', err);
              this.pdfBlobUrl = null;
              this.pdfUrl = null;
              this.cdr.detectChanges(); // update template
            }
          });
        } else {
          this.pdfBlobUrl = null;
          this.pdfUrl = null;
        }
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update to ensure image renders
      },
      error: (err) => {
        console.error('Error fetching details', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

  }

  normalizeData(data: any, type: string) {
    let b: any = { ...data };


    // Image handling
    if (data.image) {
      b.image = this.imageBaseUrl + data.image;
    } else {
      b.image = 'assets/billboardimg.jpg';
    }

    // Common Mappings
    b.state = data.State || data.state;
    b.district = data.District || data.city || data.City;
    b.taluka = data.Tehsil || data.taluka;
    b.village = data.Village || data.village;

    // Type specific overrides & Attributes Gathering
    b.attributes = []; // Store key-value pairs for the UI grid

    if (type === 'vehicle_marketing') {
      b.hoardingType = data.v_type || 'Vehicle Ad';
      b.location = `${data.v_area || ''}, ${data.v_city || ''}`;
      b.price = data.v_cost;
      b.description = data.remarks;
      b.district = data.v_city;

      b.attributes.push({ label: 'Vehicle No', value: data.v_number });
      b.attributes.push({ label: 'Duration', value: data.v_duration_days + ' Days' });
      b.attributes.push({ label: 'Expected Crowd', value: data.expected_crowd });
      b.attributes.push({ label: 'Start Date', value: data.v_start_date });

    } else if (type === 'hoardings') {
      b.hoardingType = data.h_name || 'Hoarding';
      b.location = data.address;
      b.price = data.rental_cost;
      b.description = data.notes;
      b.latitude = data.latitude;
      b.longitude = data.longitude;

      b.attributes.push({ label: 'Size', value: data.size });
      b.attributes.push({ label: 'Owner', value: data.owner_name });
      b.attributes.push({ label: 'Contract End', value: data.contract_end_date });

    } else if (type === 'society_marketing') {
      b.hoardingType = data.s_name || 'Society Ad';
      b.location = `${data.s_area || ''}, ${data.s_city || ''}`;
      b.price = data.expected_cost;
      b.description = data.remarks;
      b.district = data.s_city;
      b.latitude = data.s_lat;
      b.longitude = data.s_long;

      b.attributes.push({ label: 'Flats', value: data.s_no_flats });
      b.attributes.push({ label: 'Crowd', value: data.s_crowd });
      b.attributes.push({ label: 'Event', value: data.s_event_type });
      b.attributes.push({ label: 'Date', value: data.event_date });

    } else if (type === 'balloon_marketing') {
      b.hoardingType = data.b_location_name || 'Balloon Ad';
      b.location = `${data.b_area || ''}, ${data.b_city || ''}`;
      b.price = data.b_cost;
      b.description = data.remarks;
      b.district = data.b_city;
      b.latitude = data.b_lat;
      b.longitude = data.b_long;

      b.attributes.push({ label: 'Size', value: data.b_size });
      b.attributes.push({ label: 'Type', value: data.b_type });
      b.attributes.push({ label: 'Height', value: data.b_height + ' ft' });
      b.attributes.push({ label: 'Duration', value: data.b_duration_days + ' Days' });

    } else if (type === 'outdoormarketingscreens') {
      b.hoardingType = data.ScreenName || 'Digital Screen';
      b.location = data.Location;
      b.price = data.RentalCost;
      b.description = data.Notes;
      b.latitude = data.Latitude;
      b.longitude = data.Longitude;

      b.attributes.push({ label: 'Resolution', value: data.Resolution });
      b.attributes.push({ label: 'Size', value: data.Size });
      b.attributes.push({ label: 'Screen Type', value: data.ScreenType });
      b.attributes.push({ label: 'Power Backup', value: data.PowerBackup ? 'Yes' : 'No' });
    }

    // Defaults
    b.hoardingType = b.hoardingType || 'Outdoor Service';
    b.location = b.location || 'Unknown Location';
    b.price = b.price || 'Contact for Price';
    b.availability = b.status || b.Status || 'Available';
    b.contactName = data.contact_person || data.v_contact_person_name || data.s_contact_person_name || data.b_contact_person_name || data.ContactPerson;
    b.contactNum = data.contact_number || data.v_contact_num || data.s_contact_num || data.b_contact_num || data.ContactNumber;



    // 🌍 Latitude & Longitude (ALL SERVICES)
    b.lat =
      data.b_lat ||
      data.h_lat ||
      data.Latitude ||
      data.latitude;

    b.lng =
      data.b_long ||
      data.h_long ||
      data.Longitude ||
      data.longitude;

    // 🗺️ Google Map Embed (SAFE)
    if (b.lat && b.lng) {
      const url = `https://www.google.com/maps?q=${b.lat},${b.lng}&z=16&output=embed`;
      this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    return b;
  }

  // change section
  showSection(section: string) {
    this.currentSection = section;
  }

  goBack() {
    history.back();
  }

  // 💰 Total Cost Calculation
  totalCost: number = 0;
  durationDays: number = 0;

  calculateTotalCost() {
    if (this.bookingDetails.startDate && this.bookingDetails.endDate && this.board?.price) {
      const start = new Date(this.bookingDetails.startDate);
      const end = new Date(this.bookingDetails.endDate);

      // Calculate difference in time
      const timeDiff = end.getTime() - start.getTime();

      // Calculate difference in days (divide by 1000 * 3600 * 24)
      const days = timeDiff / (1000 * 3600 * 24);

      if (days > 0) {
        this.durationDays = Math.ceil(days);
        // clean price string (remove '₹', commas, spaces)
        const cleanPrice = String(this.board.price).replace(/[^0-9.]/g, '');
        const unitPrice = parseFloat(cleanPrice) || 0;

        this.totalCost = this.durationDays * unitPrice;
      } else {
        this.durationDays = 0;
        this.totalCost = 0;
      }
    } else {
      this.durationDays = 0;
      this.totalCost = 0;
    }
  }

  submitBooking() {
    console.log('Booking Submission:', this.bookingDetails);

    // Validate Full Name
    if (!this.bookingDetails.fullName || this.bookingDetails.fullName.trim() === '') {
      alert("Please enter your full name.");
      return;
    }

    // Validate Email
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!this.bookingDetails.email || !emailPattern.test(this.bookingDetails.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Validate Contact Number (10 Digits)
    const phonePattern = /^[0-9]{10}$/;
    if (!this.bookingDetails.phone || !phonePattern.test(this.bookingDetails.phone)) {
      alert("Please enter a valid 10-digit contact number.");
      return;
    }

    if (!this.bookingDetails.agreedToTerms) {
      alert("Please agree to the terms and conditions to proceed.");
      return;
    }

    if (this.bookingDetails.paymentCompleted === 'No') {
      alert("Please complete the payment to proceed.");
      return;
    }

    // Prepare Payload with calculated cost
    const payload = {
      ...this.bookingDetails,
      totalCost: this.totalCost,
      durationDays: this.durationDays,
      serviceType: this.board.hoardingType,
      boardId: this.board.id // Ensure ID is passed if available
    };

    // Call Backend API
    this.searchService.bookService(payload).subscribe({
      next: (res) => {
        console.log('API Response:', res);
        alert('Booking Submitted Successfully!');
      },
      error: (err) => {
        console.error('API Error:', err);
        alert('Failed to submit booking. Please try again.');
      }
    });
  }

  // Open PDF in new tab
  previewHoardingPdf() {
    if (!this.pdfBlobUrl) return;
    window.open(this.pdfBlobUrl, '_blank'); // raw blob URL works here
  }

  // Download PDF
  downloadHoardingPdf() {
    if (!this.pdfBlobUrl || !this.board?.h_id) return;

    const a = document.createElement('a');
    a.href = this.pdfBlobUrl;
    a.download = `case-study-${this.board.h_id}.pdf`;
    a.click();
  }

  // 3d view 

  view3D(lat: number, lng: number) {
    this.router.navigate(['/map-3d', lat, lng]);
  }

  checkLoginStatus() {
    // ✅ Change key name based on your auth logic
    const token = localStorage.getItem('token');
    this.isLoggedIn = !!token;
  }

}

