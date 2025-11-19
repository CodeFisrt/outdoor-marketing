import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Vehicle } from '../../Model/model';
import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-vehicle-ads',
  imports: [NgClass,FormsModule,CommonModule,ReactiveFormsModule,RouterLink],
  templateUrl: './vehicle-ads.html',
  styleUrl: './vehicle-ads.css'
})
export class VehicleAds {
  vehicleList: Vehicle[] = [];
  vehicleForm!: FormGroup;
  apiUrl = "http://localhost:8080/vehicles";
   filteredList: any[] = [];   // 👈 for search results
  searchTerm: string = "";       // 👈 bound to input 

  constructor(
    private router: Router,
    private http: HttpClient,
    private toaster: ToastrService,
    private fb: FormBuilder
  ) {
   
  }
ngOnInit(){
  this.getAllVechile();
   this.vehicleForm.valueChanges.subscribe(() => {
      this.calculateDuration();
    });
}

filterVechile() {
    const term = this.searchTerm.toLowerCase();
    this.filteredList = this.vehicleList.filter(s =>
      s.v_type.toLowerCase().includes(term) ||
      s.v_number.toString().includes(term) ||
      s.v_city.toLowerCase().includes(term) ||
      s.v_cost.toString().includes(term)
    );
  }
calculateDuration() {
    const start = this.vehicleForm.get('v_start_date')?.value;
    const end = this.vehicleForm.get('v_end_date')?.value;

    if (start && end) {
      const s = new Date(start);
      const e = new Date(end);
      const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (diff > 0) {
        this.vehicleForm.get('v_duration_days')?.setValue(diff, { emitEvent: false });
      } else {
        this.vehicleForm.get('v_duration_days')?.setValue(0, { emitEvent: false });
      }
    }
  }
  // 🔹 READ
  getAllVechile() {
    this.http.get<Vehicle[]>(this.apiUrl).subscribe((res: any) => {
      this.vehicleList = res;
    });
  }

  // 🔹 CREATE
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
    });
  }

  // 🔹 UPDATE
  updateVehicle() {
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      this.toaster.error("Please fix form errors before updating");
      return;
    }
    this.http.put(`${this.apiUrl}/${this.vehicleForm.value.v_id}`, this.vehicleForm.value).subscribe(() => {
      this.toaster.success("Vehicle updated successfully");
      this.getAllVechile();
      this.vehicleForm.reset();
    });
  }

  // 🔹 DELETE
  deleteVehicle(id: number) {
    if (confirm("Are you sure to delete?")) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
        this.toaster.success("Vehicle deleted successfully");
        this.getAllVechile();
      });
    }
  }

  // 🔹 EDIT
  editVehicle(vehicleId: number) {
    // this.vehicleForm.patchValue(vehicle);
this.router.navigateByUrl("/dashboard/vehicle-Ads-Form/"+vehicleId)
    this.toaster.info("Edit Vehicle data loaded into form");
  }
}
