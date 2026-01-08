import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Vehicle } from '../../Model/model';
import { CommonModule, NgClass } from '@angular/common';
import { NgxSkeletonLoaderComponent } from "ngx-skeleton-loader";

@Component({
  selector: 'app-vehicle-ads',
  imports: [NgClass, FormsModule, CommonModule, ReactiveFormsModule, RouterLink, NgxSkeletonLoaderComponent],
  templateUrl: './vehicle-ads.html',
  styleUrl: './vehicle-ads.css'
})
export class VehicleAds {

  vehicleList: Vehicle[] = [];
  vehicleForm!: FormGroup;                 // declared
  apiUrl = "http://localhost:8080/vehicles";
  filteredList: any[] = [];
  searchTerm: string = "";

  constructor(
    private router: Router,
    private http: HttpClient,
    private toaster: ToastrService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {

    // ✅✅✅ FIX 1: FORM INITIALIZATION (THIS WAS MISSING)
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

    // existing logic (kept exactly)
    this.getAllVechile();

    // existing logic (kept exactly)
    setTimeout(() => {
      this.vehicleForm.valueChanges.subscribe(() => {
        this.calculateDuration();
        this.cdr.detectChanges();
      });
    });
  }

  filterVehicle() {
    const term = this.searchTerm.toLowerCase();
    this.filteredList = this.vehicleList.filter(s =>
      s.v_type.toLowerCase().includes(term) ||
      s.v_number.toString().includes(term) ||
      s.v_city.toLowerCase().includes(term) ||
      s.v_cost.toString().includes(term)
    );

    this.cdr.detectChanges();
  }

  // 🔍 Search triggered by icon click (ADDED)
  applySearch() {
    this.filterVehicle(); // reuse existing logic
  }

  calculateDuration() {
    const start = this.vehicleForm.get('v_start_date')?.value;
    const end = this.vehicleForm.get('v_end_date')?.value;

    if (start && end) {
      const s = new Date(start);
      const e = new Date(end);
      const diff = Math.ceil(
        (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      this.vehicleForm.get('v_duration_days')?.setValue(
        diff > 0 ? diff : 0,
        { emitEvent: false }
      );

      this.cdr.detectChanges();
    }
  }

  // READ
  getAllVechile() {
    this.http.get<Vehicle[]>(this.apiUrl).subscribe((res: any) => {
      this.vehicleList = res;
      this.filteredList = res;
      this.cdr.detectChanges();
    });
  }

  // CREATE
  addVehicle() {
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      this.toaster.error("Please fix form errors before submitting");
      return;
    }

    this.http.post(this.apiUrl, this.vehicleForm.value).subscribe(() => {
      this.toaster.success("Vehicle added successfully");
      this.getAllVechile();
      this.vehicleForm.reset();
      this.cdr.detectChanges();
    });
  }

  // UPDATE
  updateVehicle() {
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      this.toaster.error("Please fix form errors before updating");
      return;
    }

    this.http.put(
      `${this.apiUrl}/${this.vehicleForm.value.v_id}`,
      this.vehicleForm.value
    ).subscribe(() => {
      this.toaster.success("Vehicle updated successfully");
      this.getAllVechile();
      this.vehicleForm.reset();
      this.cdr.detectChanges();
    });
  }

  // DELETE
  deleteVehicle(id: number) {
    if (confirm("Are you sure to delete?")) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
        this.toaster.success("Vehicle deleted successfully");
        this.getAllVechile();
        this.cdr.detectChanges();
      });
    }
  }

  // EDIT
  editVehicle(vehicleId: number) {
    this.router.navigateByUrl("/dashboard/vehicle-Ads-Form/" + vehicleId);
    this.toaster.info("Edit Vehicle data loaded into form");
    this.cdr.detectChanges();
  }
}
