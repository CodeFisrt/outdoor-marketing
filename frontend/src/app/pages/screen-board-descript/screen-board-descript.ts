import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Search } from '../../SearchServices/search';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MaskPricePipe } from "../../mask-pipes/mask-price-pipe";
import { BiddingService, Bid } from '../../ApiServices/CallApis/bidding-service';


@Component({
  selector: 'app-screen-board-descript',
  standalone: true,
  imports: [CommonModule, FormsModule, MaskPricePipe],
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
  /** True when user came from inventory map "Book Now" — "Back to Details" returns to map */
  cameFromMap = false;
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

  // 💰 Bidding Data
  bids: Bid[] = [];
  nextBidAmount: number = 0;
  highestBidAmount: number = 0;
  userId: string | null = null;
  productType: 'hoarding' | 'society' | 'screen' = 'hoarding';
  productId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private searchService: Search,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private sanitizer: DomSanitizer,
    private biddingService: BiddingService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  minDate: string = '';
  mapUrl!: SafeResourceUrl;

  ngOnInit(): void {
    this.checkLoginStatus();
    this.cameFromMap = this.route.snapshot.queryParamMap.get('from') === 'map';

    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      const type = params.get('service_type');

      if (id && type) {
        this.productId = id;
        this.productType = this.getBidProductType(type) as any;
        this.loadBoardDetails(type, id);
        this.setupBidding(this.productType, id);
      }
    });
  }

  getBidProductType(type: string): string {
    const rawType = type.toLowerCase();
    if (rawType === 'hoarding' || rawType === 'hoardings') return 'hoarding';
    if (rawType === 'society' || rawType === 'society_marketing') return 'society';
    if (rawType === 'digital_screen' || rawType === 'led_screen' || rawType === 'screen' || rawType === 'outdoormarketingscreens') return 'screen';
    return type;
  }

  setupBidding(type: string, id: number) {
    if (!isPlatformBrowser(this.platformId)) return;

    this.userId = localStorage.getItem('userId');

    // Join room
    this.biddingService.joinProductRoom(type, id);

    // Fetch initial bids
    this.biddingService.getBids(type, id).subscribe({
      next: (bids) => {
        this.bids = bids;
        this.updateHighestBid();
        this.cdr.detectChanges();
      }
    });

    // Listen for new bids
    this.biddingService.getNewBidObservable().subscribe((bid) => {
      if (bid.product_type === type && bid.product_id.toString() === id.toString()) {
        // Add to list and sort
        this.bids.unshift(bid);
        this.bids.sort((a, b) => b.amount - a.amount);
        this.updateHighestBid();
        this.cdr.detectChanges();
      }
    });
  }

  updateHighestBid() {

    if (this.bids.length > 0) {
      this.highestBidAmount = Number(this.bids[0].amount) || 0;
      const roundedAmount = Math.round(this.highestBidAmount);
      this.nextBidAmount = roundedAmount + 100;
    } else {
      const basePrice = this.board
        ? parseFloat(String(this.board.price).replace(/[^0-9.]/g, ''))
        : 0;
      this.highestBidAmount = 0;
      this.nextBidAmount = basePrice > 0
        ? Math.round(basePrice)
        : 100;
    }
  }

  placeBid() {
    if (!this.isLoggedIn) {
      alert("Please login to place a bid.");
      this.router.navigate(['/signin']);
      return;
    }



    if (!this.userId) return;

    if (this.nextBidAmount < this.highestBidAmount + 100) {
      alert(`Minimum next bid must be ${this.highestBidAmount + 100}`);
      return;
    }

    const bid: Bid = {
      product_type: this.productType,
      product_id: this.productId,
      user_id: this.userId,
      amount: this.nextBidAmount
    };

    this.biddingService.placeBid(bid).subscribe({
      next: (res) => {
        alert("Bid placed successfully!");
        // Room broadcast will update the list
      },
      error: (err) => {
        alert(err.error?.message || "Failed to place bid");
      }
    });
  }

  handleBidClick() {
    if (!this.isLoggedIn) {
      alert("Please login to place a bid.");
      this.router.navigate(['/signin']);
    } else {
      this.showSection('bidding');
    }
  }

  /** Map route service_type (e.g. from inventory map) to API type expected by getServiceDetails */
  private mapRouteTypeToApiType(type: string): string {
    const map: { [key: string]: string } = {
      hoarding: 'hoardings',
      digital_screen: 'outdoormarketingscreens',
      led_screen: 'outdoormarketingscreens',
      society: 'society_marketing',
    };
    return map[type] ?? type;
  }

  loadBoardDetails(type: string, id: number) {
    this.loading = true;
    this.board = null; // Clear previous board data
    const apiType = this.mapRouteTypeToApiType(type);

    this.searchService.getServiceDetails(apiType, id).subscribe({
      next: (res: any) => {
        let data = res.data ? res.data : res;

        this.board = this.normalizeData(data, apiType);

        // Fetch PDF AFTER board is loaded
        if (apiType === 'hoardings' && this.board?.h_id) {
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
        // If navigated from map "Book Now", open the Book this Service section
        const openSection = this.route.snapshot.queryParamMap.get('open');
        if (openSection === 'book') {
          this.currentSection = 'book';
        }
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

  /** From Book this Service: go back to details on this page, or to inventory map if we came from map */
  backFromBookSection() {
    if (this.cameFromMap) {
      const id = this.route.snapshot.paramMap.get('id');
      const type = this.route.snapshot.paramMap.get('service_type');
      if (id && type) {
        this.router.navigate(['/inventory-map'], { queryParams: { open: id, type } });
      } else {
        this.router.navigate(['/inventory-map']);
      }
    } else {
      this.showSection('details');
    }
  }

  goBack() {
    if (this.cameFromMap) {
      this.router.navigate(['/inventory-map']);
    } else {
      history.back();
    }
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
    if (!isPlatformBrowser(this.platformId)) return;
    const token = localStorage.getItem('token');
    this.isLoggedIn = !!token;
  }

}

