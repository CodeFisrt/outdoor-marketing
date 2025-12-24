import { NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SeoService } from '../../ApiServices/Seo-Service/seo-service';

@Component({
  selector: 'app-vehicle-ads-form',
  imports: [NgClass,ReactiveFormsModule,RouterLink],
  templateUrl: './vehicle-ads-form.html',
  styleUrl: './vehicle-ads-form.css'
})
export class VehicleAdsForm {


  vehicleForm!: FormGroup;
  apiUrl = "http://localhost:8080/vehicles";
vehicleId: number = 0;
  constructor(
    private router: Router,
    private http: HttpClient,
     private route: ActivatedRoute,
    private toaster: ToastrService,
    private fb: FormBuilder,
    private seo:SeoService
  ) {
    this.vehicleForm = this.fb.group({
      v_id: [0],
      v_type: ['', Validators.required],
      v_number: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/)]], // MH12AB1234
      v_area: ['', Validators.required],
      v_city: ['', Validators.required],
      v_start_date: ['', Validators.required],
      v_end_date: ['', Validators.required],
      v_duration_days: [0],
      expected_crowd: [0, [Validators.required, Validators.min(1)]],
      v_contact_person_name: ['', Validators.required],
      v_contact_num: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]], // Indian 10-digit mobile
      v_cost: ['', [Validators.required, Validators.min(1)]],
      payment_status: ['Pending', Validators.required],
      remarks: ['']
    });
  }
ngOnInit(){
   this.vehicleForm.valueChanges.subscribe(() => {
      this.calculateDuration();
    });

    //to react activated route id
      this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.vehicleId = +idParam;
        if (this.vehicleId !== 0) {
          this.loadVehicleData(this.vehicleId);
        }
      }
    });
    this.seo.updateSeo({

      title: 'Add or Edit Vehicle Ads | AdonStreet Dashboard',
      description: 'Manage vehicle advertising campaigns by adding or editing vehicles in AdonStreet dashboard. Update vehicle type, location, cost, and campaign details easily.',
      keywords: 'vehicle advertising, add vehicle, edit vehicle, vehicle ad dashboard, AdonStreet management, vehicle ad cost, vehicle campaign management',
      canonical: 'https://adonstreet.com/dashboard/vehicle-ads',
      robots: 'NOINDEX, NOFOLLOW', // Prevent indexing of admin form pages
      author: 'AdonStreet',
      publisher: 'AdonStreet',
      lang: 'en-IN'
    })
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
  loadVehicleData(id:number){
 this.http.get<any>(`${this.apiUrl}/${id}`).subscribe({
      next: (data) => {
        this.vehicleForm.patchValue(data);
      },
      error: () => {
        this.toaster.error("Failed to load vehicle details");
      }
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
          this.router.navigateByUrl("/dashboard/vehicle-ads")
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
     this.router.navigateByUrl("/dashboard/vehicle-ads")
      this.vehicleForm.reset();
    });
  }

}
