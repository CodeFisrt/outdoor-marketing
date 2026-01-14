import { CommonModule, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SeoService } from '../../ApiServices/Seo-Service/seo-service';

@Component({
  selector: 'app-vehicle-ads-form',
  imports: [NgClass, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './vehicle-ads-form.html',
  styleUrl: './vehicle-ads-form.css'
})
export class VehicleAdsForm {

  vehicleForm!: FormGroup;
  apiUrl = "http://localhost:8080/vehicles";
  vehicleId: number = 0;
  submitted = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private route: ActivatedRoute,
    private toaster: ToastrService,
    private fb: FormBuilder,
    private seo: SeoService
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.vehicleForm.valueChanges.subscribe(() => this.calculateDuration());

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
      robots: 'NOINDEX, NOFOLLOW',
      author: 'AdonStreet',
      publisher: 'AdonStreet',
      lang: 'en-IN'
    });
  }

  // ================= INIT FORM =================
  initForm() {
    this.vehicleForm = this.fb.group(
      {
        v_id: [0],
        v_type: ['', [Validators.required, Validators.minLength(2)]],
        v_number: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/)]], // MH12AB1234
        v_area: ['', Validators.required],
        v_city: ['', Validators.required],
        v_start_date: ['', Validators.required],
        v_end_date: ['', Validators.required],
        v_duration_days: [0],
        expected_crowd: [0, [Validators.required, Validators.min(1)]],
        v_contact_person_name: ['', Validators.required],
        v_contact_num: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
        v_cost: ['', [Validators.required, Validators.min(1)]],
        payment_status: ['Pending', Validators.required],
        remarks: [''],
        featured: [false]
      },
      {
        validators: [
          this.dateRangeValidator('v_start_date', 'v_end_date', 'dateRangeInvalid')
        ]
      }
    );
  }

  // ================= VALIDATION HELPERS =================
  isInvalid(controlName: string): boolean {
    const c = this.vehicleForm.get(controlName);
    return !!(c && c.invalid && (c.touched || this.submitted));
  }

  hasFormError(errorKey: string): boolean {
    return !!(
      this.vehicleForm.errors &&
      this.vehicleForm.errors[errorKey] &&
      (this.submitted || this.anyDateTouched())
    );
  }

  private anyDateTouched(): boolean {
    return ['v_start_date', 'v_end_date'].some(f => this.vehicleForm.get(f)?.touched);
  }

  // ================= DATE RANGE VALIDATOR =================
  dateRangeValidator(startKey: string, endKey: string, errorKey: string) {
    return (group: AbstractControl): ValidationErrors | null => {
      const startVal = group.get(startKey)?.value;
      const endVal = group.get(endKey)?.value;
      if (!startVal || !endVal) return null;

      const s = new Date(startVal);
      const e = new Date(endVal);

      if (isNaN(s.getTime()) || isNaN(e.getTime())) return { [errorKey]: true };
      if (e < s) return { [errorKey]: true };
      return null;
    };
  }

  // ================= DURATION CALCULATION =================
  calculateDuration() {
    const start = this.vehicleForm.get('v_start_date')?.value;
    const end = this.vehicleForm.get('v_end_date')?.value;
    if (start && end) {
      const s = new Date(start);
      const e = new Date(end);
      const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      this.vehicleForm.get('v_duration_days')?.setValue(diff > 0 ? diff : 0, { emitEvent: false });
    }
  }

  // ================= LOAD EXISTING DATA =================
  loadVehicleData(id: number) {
    this.http.get<any>(`${this.apiUrl}/${id}`).subscribe({
      next: (data) => {
        this.vehicleForm.patchValue({
          ...data,
          v_start_date: data.v_start_date?.split('T')[0],
          v_end_date: data.v_end_date?.split('T')[0],
          featured: data.featured === 1
        });
      },
      error: () => this.toaster.error("Failed to load vehicle details")
    });
  }

  // ================= CREATE / UPDATE =================
  addVehicle() {
    this.submitted = true;
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      this.toaster.error("Please fix form errors before submitting");
      return;
    }

    const payload = { ...this.vehicleForm.value, featured: this.vehicleForm.value.featured ? 1 : 0 };
    this.http.post(this.apiUrl, payload).subscribe(() => {
      this.toaster.success("Vehicle added successfully");
      this.resetToDefaults();
      this.router.navigateByUrl("/dashboard/vehicle-ads");
    });
  }

  updateVehicle() {
    this.submitted = true;
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      this.toaster.error("Please fix form errors before updating");
      return;
    }

    const payload = { ...this.vehicleForm.value, featured: this.vehicleForm.value.featured ? 1 : 0 };
    this.http.put(`${this.apiUrl}/${payload.v_id}`, payload).subscribe(() => {
      this.toaster.success("Vehicle updated successfully");
      this.resetToDefaults();
      this.router.navigateByUrl("/dashboard/vehicle-ads");
    });
  }

  // ================= RESET / CANCEL =================
  resetToDefaults() {
    this.vehicleForm.reset({
      payment_status: 'Pending',
      featured: false
    });
    this.submitted = false;
  }

  cancel() {
    if (this.vehicleId) return;
    this.resetToDefaults();
  }

  resetForm() {
    if (this.vehicleId) {
      this.loadVehicleData(this.vehicleId);
      this.submitted = false;
      return;
    }
    this.resetToDefaults();
  }
}
