import { NgClass, NgIf } from '@angular/common';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { log } from 'node:console';
import { CaseStudyFormComponent } from "../case-study-form/case-study-form";

@Component({
  selector: 'app-hoarding-from',
  imports: [RouterLink, ReactiveFormsModule, NgClass, NgIf, MatCheckboxModule, CaseStudyFormComponent],
  templateUrl: './hoarding-from.html',
  styleUrl: './hoarding-from.css'
})
export class HoardingFrom {
  hoardingForm!: FormGroup;
  hoardingId?: number;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private seo: SeoService
  ) { }

  ngOnInit(): void {
    this.hoardingForm = this.fb.group(
      {
        h_name: ['', Validators.required],
        address: ['', Validators.required],
        city: ['', Validators.required],
        State: ['', Validators.required],

        latitude: ['', [Validators.required, this.latitudeValidator]],
        longitude: ['', [Validators.required, this.longitudeValidator]],

        size: ['', Validators.required],
        owner_name: ['', Validators.required],
        contact_person: ['', Validators.required],

        contact_number: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],

        ad_start_date: ['', Validators.required],
        ad_end_date: ['', Validators.required],

        status: ['Available', Validators.required],

        rental_cost: ['', [Validators.required, Validators.min(0)]],

        contract_start_date: ['', Validators.required],
        contract_end_date: ['', Validators.required],

        notes: ['', Validators.required],
        featured: [false] // ✅ boolean default
      },
      {
        validators: [
          this.dateRangeValidator('ad_start_date', 'ad_end_date', 'adDateRangeInvalid'),
          this.dateRangeValidator('contract_start_date', 'contract_end_date', 'contractDateRangeInvalid')
        ]
      }
    );

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.hoardingId = +id;
        this.loadHoardingsData(this.hoardingId);
      }
    });
  }

  // ✅ ADD THIS HERE (inside class)
  private resetToDefaults() {
    this.hoardingForm.reset({
      status: 'Available',
      featured: false
    });
    this.submitted = false;
  }
  // ✅ show errors only after submit OR touched
  isInvalid(controlName: string): boolean {
    const c = this.hoardingForm.get(controlName);
    return !!(c && c.invalid && (c.touched || this.submitted));
  }

  hasFormError(errorKey: string): boolean {
    return !!(this.hoardingForm.errors && this.hoardingForm.errors[errorKey] && (this.submitted || this.anyDateTouched()));
  }

  private anyDateTouched(): boolean {
    const fields = ['ad_start_date', 'ad_end_date', 'contract_start_date', 'contract_end_date'];
    return fields.some(f => this.hoardingForm.get(f)?.touched);
  }

  // ✅ Latitude: -90 to 90
  latitudeValidator(control: AbstractControl): ValidationErrors | null {
    const v = (control.value ?? '').toString().trim();
    if (v === '') return null;
    const n = Number(v);
    if (Number.isNaN(n) || n < -90 || n > 90) return { latInvalid: true };
    return null;
  }

  // ✅ Longitude: -180 to 180
  longitudeValidator(control: AbstractControl): ValidationErrors | null {
    const v = (control.value ?? '').toString().trim();
    if (v === '') return null;
    const n = Number(v);
    if (Number.isNaN(n) || n < -180 || n > 180) return { lngInvalid: true };
    return null;
  }

  /**
   * ✅ Date Scenarios Covered:
   * - both required (handled by Validators.required)
   * - invalid date string (safe parsing)
   * - end < start -> error
   * - same day allowed
   */
  dateRangeValidator(startKey: string, endKey: string, errorKey: string) {
    return (group: AbstractControl): ValidationErrors | null => {
      const startCtrl = group.get(startKey);
      const endCtrl = group.get(endKey);

      const startVal = startCtrl?.value;
      const endVal = endCtrl?.value;

      // if empty, required validator will show field-level errors
      if (!startVal || !endVal) {
        // clear existing range error if any
        if (group.errors?.[errorKey]) {
          const { [errorKey]: _, ...rest } = group.errors || {};
          return Object.keys(rest).length ? rest : null;
        }
        return null;
      }

      const s = new Date(startVal);
      const e = new Date(endVal);

      // invalid date scenario
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        return { [errorKey]: true };
      }

      // normalize (ignore time)
      s.setHours(0, 0, 0, 0);
      e.setHours(0, 0, 0, 0);

      if (e < s) {
        return { [errorKey]: true };
      }

      // valid -> remove errorKey but keep other errors
      if (group.errors?.[errorKey]) {
        const { [errorKey]: _, ...rest } = group.errors || {};
        return Object.keys(rest).length ? rest : null;
      }

      return null;
    };
  }

  loadHoardingsData(id: number) {

    this.http.get(`http://localhost:8080/hoardings/${id}`).subscribe({
      next: (data: any) => {
        this.hoardingForm.patchValue({
          ...data,
          ad_start_date: data.ad_start_date?.split('T')[0],
          ad_end_date: data.ad_end_date?.split('T')[0],
          contract_start_date: data.contract_start_date?.split('T')[0],
          contract_end_date: data.contract_end_date?.split('T')[0],
          featured: data.featured === 1
        });
        console.log(data);
      }
    });
  }

  save() {
    this.submitted = true;

    if (this.hoardingForm.invalid) {
      this.hoardingForm.markAllAsTouched(); // ✅ show all required errors
      return;
    }

    debugger;

    const payLoad = {
      ...this.hoardingForm.value,
      featured: this.hoardingForm.value.featured ? 1 : 0
    };


    console.log(payLoad);

    if (this.hoardingId) {
      this.http.put(`http://localhost:8080/hoardings/${this.hoardingId}`, payLoad).subscribe({
        next: () => {
          this.router.navigateByUrl('/dashboard/hoarding');
          this.toastr.success('Hoarding updated successfully ✅');
          // this.cancel();
        },
        error: () => this.toastr.error('Update failed ❌')
      });
    } else {
      this.http.post('http://localhost:8080/hoardings/', payLoad).subscribe({
        next: () => {
          // ✅ auto reset after submit
          this.resetForm();
          this.submitted = false;

          this.resetToDefaults(); // ✅ auto reset after Add
          this.router.navigateByUrl('/dashboard/hoarding');
          this.toastr.success('Hoarding added successfully 🎉');
        },
        error: () => this.toastr.error('Creation failed ❌')
      });
    }
  }

  // cancel() {
  //   this.hoardingForm.reset();
  //   this.submitted = false;
  // }

  // resetForm() {
  //   this.hoardingForm.reset({
  //     status: 'Available',
  //     featured: false
  //   });
  //   this.submitted = false;
  // }

  cancel() {
    // ✅ In edit mode, keep old data on form
    if (this.hoardingId) return;

    // ✅ In add mode, clear form
    this.resetToDefaults();
  }

  resetForm() {
    // ✅ In edit mode, reload existing data
    if (this.hoardingId) {
      this.loadHoardingsData(this.hoardingId);
      this.submitted = false;
      return;
    }

    // ✅ In add mode, clear form
    this.resetToDefaults();
  }



}
