import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Vehicle } from '../../Model/model';
import { CommonModule, NgClass } from '@angular/common';

@Component({
  selector: 'app-vehicle-ads',
  imports: [NgClass, FormsModule, CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './vehicle-ads.html',
  styleUrls: ['./vehicle-ads.css']
})
export class VehicleAds {

  vehicleList: Vehicle[] = [];
  filteredList: Vehicle[] = [];
  paginatedList: Vehicle[] = [];
  searchTerm: string = "";

  vehicleForm!: FormGroup;
  apiUrl = "http://localhost:8080/vehicles";

  // Pagination
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;

  constructor(
    private router: Router,
    private http: HttpClient,
    private toaster: ToastrService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // Init form
    this.vehicleForm = this.fb.group({
      v_id: [0],
      v_type: ['', Validators.required],
      v_number: ['', Validators.required],
      v_area: [''],
      v_city: [''],
      v_start_date: [''],
      v_end_date: [''],
      v_duration_days: [0],
      expected_crowd: [0],
      v_contact_person_name: [''],
      v_contact_num: [''],
      v_cost: [''],
      payment_status: ['Pending'],
      remarks: [''],
      featured: [false]
    });

    // Load vehicles
    this.getAllVehicle();

    // Auto duration calc
    this.vehicleForm.valueChanges.subscribe(() => {
      this.calculateDuration();
      this.cdr.detectChanges();
    });
  }

  // ========================
  // FILTER / SEARCH
  // ========================
  filterVehicle() {
    const term = this.searchTerm.toLowerCase();
    this.filteredList = this.vehicleList.filter(v =>
      v.v_type.toLowerCase().includes(term) ||
      v.v_number.toString().includes(term) ||
      v.v_city.toLowerCase().includes(term) ||
      v.v_cost.toString().includes(term)
    );

    this.currentPage = 1;
    this.buildPagination();
  }

  applySearch() {
    this.filterVehicle();
  }

  // ========================
  // PAGINATION LOGIC
  // ========================
  buildPagination() {
    const total = this.filteredList.length;
    this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));

    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedList = this.filteredList.slice(start, end);
    this.cdr.detectChanges();
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    if (pages[0] !== 1) pages.unshift(1);
    if (pages[pages.length - 1] !== total) pages.push(total);
    return Array.from(new Set(pages));
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.buildPagination();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.buildPagination();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.buildPagination();
    }
  }

  changePageSize(size: number) {
    this.pageSize = +size;
    this.currentPage = 1;
    this.buildPagination();
  }

  get showingFrom() {
    if (!this.filteredList.length) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo() {
    const to = this.currentPage * this.pageSize;
    return Math.min(to, this.filteredList.length);
  }

  // ========================
  // CRUD METHODS
  // ========================
  getAllVehicle() {
    this.http.get<Vehicle[]>(this.apiUrl).subscribe(res => {
      this.vehicleList = res;
      this.filteredList = res;
      this.currentPage = 1;
      this.buildPagination();
    });
  }

  addVehicle() {
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      this.toaster.error("Please fix form errors before submitting");
      return;
    }

    this.http.post(this.apiUrl, this.vehicleForm.value).subscribe(() => {
      this.toaster.success("Vehicle added successfully");
      this.getAllVehicle();
      this.vehicleForm.reset();
    });
  }

  updateVehicle() {
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      this.toaster.error("Please fix form errors before updating");
      return;
    }

    this.http.put(`${this.apiUrl}/${this.vehicleForm.value.v_id}`, this.vehicleForm.value)
      .subscribe(() => {
        this.toaster.success("Vehicle updated successfully");
        this.getAllVehicle();
        this.vehicleForm.reset();
      });
  }

  deleteVehicle(id: number) {
    if (confirm("Are you sure to delete?")) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
        this.toaster.success("Vehicle deleted successfully");
        this.getAllVehicle();
      });
    }
  }

  editVehicle(vehicleId: number) {
    this.router.navigateByUrl("/dashboard/vehicle-Ads-Form/" + vehicleId);
    this.toaster.info("Edit Vehicle data loaded into form");
  }

  calculateDuration() {
    const start = this.vehicleForm.get('v_start_date')?.value;
    const end = this.vehicleForm.get('v_end_date')?.value;

    if (start && end) {
      const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      this.vehicleForm.get('v_duration_days')?.setValue(diff > 0 ? diff : 0, { emitEvent: false });
    }
  }

}
