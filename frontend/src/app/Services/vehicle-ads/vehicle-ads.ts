import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Vehicle } from '../../Model/model';
import { CommonModule, NgClass } from '@angular/common';
import { VehicleService } from '../../ApiServices/CallApis/vehicle-service';

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
  searchTerm: string = '';

  vehicleForm!: FormGroup;

  // Pagination
  pageSize = 5;
  currentPage = 1;
  totalPages = 1;

  constructor(
    private router: Router,
    private vehicleService: VehicleService,
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

    // Load vehicles (cached)
    this.loadVehicles();

    // Auto duration calc
    this.vehicleForm.valueChanges.subscribe(() => {
      this.calculateDuration();
      this.cdr.detectChanges();
    });
  }

  // ========================
  // LOAD VEHICLES
  // ========================
  loadVehicles() {
    this.vehicleService.getAllVehicles().subscribe({
      next: (res: Vehicle[]) => {
        this.vehicleList = res || [];
        this.filteredList = [...this.vehicleList];
        this.currentPage = 1;
        this.buildPagination();
      }
    });
  }

  // ========================
  // FILTER / SEARCH
  // ========================
  filterVehicle() {
    const term = this.searchTerm.toLowerCase();

    this.filteredList = this.vehicleList.filter(v =>
      v.v_type?.toLowerCase().includes(term) ||
      v.v_number?.toString().includes(term) ||
      v.v_city?.toLowerCase().includes(term) ||
      v.v_cost?.toString().includes(term)
    );

    this.currentPage = 1;
    this.buildPagination();
  }

  applySearch() {
    this.filterVehicle();
  }

  // ========================
  // PAGINATION
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
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) pages.push(i);
    if (pages[0] !== 1) pages.unshift(1);
    if (pages[pages.length - 1] !== this.totalPages) pages.push(this.totalPages);

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
    return this.filteredList.length
      ? (this.currentPage - 1) * this.pageSize + 1
      : 0;
  }

  get showingTo() {
    return Math.min(this.currentPage * this.pageSize, this.filteredList.length);
  }

  // ========================
  // CRUD
  // ========================
  addVehicle() {
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      this.toaster.error('Please fix form errors');
      return;
    }

    this.vehicleService.addVehicle(this.vehicleForm.value).subscribe(() => {
      this.toaster.success('Vehicle added successfully');
      this.vehicleService.refreshVehicles();
      this.loadVehicles();
      this.vehicleForm.reset();
    });
  }

  updateVehicle() {
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      this.toaster.error('Please fix form errors');
      return;
    }

    const id = this.vehicleForm.value.v_id;

    this.vehicleService.updateVehicle(id, this.vehicleForm.value).subscribe(() => {
      this.toaster.success('Vehicle updated successfully');
      this.vehicleService.refreshVehicles();
      this.loadVehicles();
      this.vehicleForm.reset();
    });
  }

  deleteVehicle(id: number) {
    if (!confirm('Are you sure to delete?')) return;

    this.vehicleService.deleteVehicle(id).subscribe(() => {
      this.toaster.success('Vehicle deleted successfully');
      this.vehicleService.refreshVehicles();
      this.loadVehicles();
    });
  }

  editVehicle(vehicleId: number) {
    this.router.navigateByUrl('/dashboard/vehicle-Ads-Form/' + vehicleId);
    this.toaster.info('Edit Vehicle data loaded into form');
  }

  // ========================
  // UTIL
  // ========================
  calculateDuration() {
    const start = this.vehicleForm.get('v_start_date')?.value;
    const end = this.vehicleForm.get('v_end_date')?.value;

    if (start && end) {
      const diff =
        Math.ceil(
          (new Date(end).getTime() - new Date(start).getTime()) /
          (1000 * 60 * 60 * 24)
        ) + 1;

      this.vehicleForm
        .get('v_duration_days')
        ?.setValue(diff > 0 ? diff : 0, { emitEvent: false });
    }
  }
}
