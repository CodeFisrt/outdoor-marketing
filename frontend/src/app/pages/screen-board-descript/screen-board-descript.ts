import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Search } from '../../SearchServices/search';
import { FormsModule } from '@angular/forms';

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

  constructor(private route: ActivatedRoute, private searchService: Search, private cdr: ChangeDetectorRef) { }

  minDate: string = '';

  ngOnInit(): void {
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
        // API might return { result: true, data: {...} } or just {...}
        let data = res;
        if (res.data) data = res.data;

        this.board = this.normalizeData(data, type);
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

      b.attributes.push({ label: 'Size', value: data.size });
      b.attributes.push({ label: 'Owner', value: data.owner_name });
      b.attributes.push({ label: 'Contract End', value: data.contract_end_date });

    } else if (type === 'society_marketing') {
      b.hoardingType = data.s_name || 'Society Ad';
      b.location = `${data.s_area || ''}, ${data.s_city || ''}`;
      b.price = data.expected_cost;
      b.description = data.remarks;
      b.district = data.s_city;

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

      b.attributes.push({ label: 'Size', value: data.b_size });
      b.attributes.push({ label: 'Type', value: data.b_type });
      b.attributes.push({ label: 'Height', value: data.b_height + ' ft' });
      b.attributes.push({ label: 'Duration', value: data.b_duration_days + ' Days' });

    } else if (type === 'outdoormarketingscreens') {
      b.hoardingType = data.ScreenName || 'Digital Screen';
      b.location = data.Location;
      b.price = data.RentalCost;
      b.description = data.Notes;

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

    return b;
  }

  // change section
  showSection(section: string) {
    this.currentSection = section;
  }

  goBack() {
    history.back();
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

    // Call Backend API
    this.searchService.bookService(this.bookingDetails).subscribe({
      next: (res) => {
        console.log('API Response:', res);
        alert('Booking Submitted Successfully!');

        // Optional: Reset form or navigate away
        // this.showSection('details'); 
        // Or reset bookingDetails object...
      },
      error: (err) => {
        console.error('API Error:', err);
        alert('Failed to submit booking. Please try again.');
      }
    });
  }
}
