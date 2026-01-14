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

@Component({
  selector: 'app-poll-kisok-form',
  imports: [ReactiveFormsModule, NgIf, NgClass, RouterLink],
  templateUrl: './poll-kisok-form.html',
  styleUrl: './poll-kisok-form.css'
})
export class PollKisokForm {
  balloonForm!: FormGroup;
  editingId?: number;
  submitted = false;

  apiUrl = 'http://localhost:8080/balloons';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.initForm();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.editingId = +id;
        this.loadPollKisokData(this.editingId);
      }
    });
  }

  // ================= FORM INIT =================
  initForm() {
    this.balloonForm = this.fb.group(
      {
        b_location_name: ['', [Validators.required, Validators.minLength(3)]],
        b_area: ['', Validators.required],
        b_city: ['', Validators.required],
        b_address: [''],

        b_lat: ['', [Validators.required, this.latitudeValidator]],
        b_long: ['', [Validators.required, this.longitudeValidator]],

        b_size: ['', Validators.required],
        b_type: ['', Validators.required],

        b_height: ['', [Validators.required, Validators.min(1)]],
        b_duration_days: ['', [Validators.required, Validators.min(1)]],

        b_start_date: ['', Validators.required],
        b_end_date: ['', Validators.required],

        expected_crowd: ['', [Validators.required, Validators.min(1)]],

        b_contact_person_name: ['', Validators.required],
        b_contact_num: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],

        b_cost: ['', [Validators.required, Validators.min(0)]],
        payment_status: ['', Validators.required],

        remarks: [''],
        featured: [false]
      },
      {
        validators: [
          this.dateRangeValidator('b_start_date', 'b_end_date', 'dateRangeInvalid')
        ]
      }
    );
  }

  // ================= VALIDATION HELPERS =================
  isInvalid(controlName: string): boolean {
    const c = this.balloonForm.get(controlName);
    return !!(c && c.invalid && (c.touched || this.submitted));
  }

  hasFormError(errorKey: string): boolean {
    return !!(
      this.balloonForm.errors &&
      this.balloonForm.errors[errorKey] &&
      (this.submitted || this.anyDateTouched())
    );
  }

  private anyDateTouched(): boolean {
    return ['b_start_date', 'b_end_date'].some(f =>
      this.balloonForm.get(f)?.touched
    );
  }

  // ================= LAT / LNG =================
  latitudeValidator(control: AbstractControl): ValidationErrors | null {
    const n = Number(control.value);
    if (isNaN(n) || n < -90 || n > 90) return { latInvalid: true };
    return null;
  }

  longitudeValidator(control: AbstractControl): ValidationErrors | null {
    const n = Number(control.value);
    if (isNaN(n) || n < -180 || n > 180) return { lngInvalid: true };
    return null;
  }

  // ================= DATE RANGE =================
  dateRangeValidator(startKey: string, endKey: string, errorKey: string) {
    return (group: AbstractControl): ValidationErrors | null => {
      const s = new Date(group.get(startKey)?.value);
      const e = new Date(group.get(endKey)?.value);

      if (!group.get(startKey)?.value || !group.get(endKey)?.value) return null;
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return { [errorKey]: true };
      if (e < s) return { [errorKey]: true };

      return null;
    };
  }

  // ================= LOAD DATA =================
  loadPollKisokData(id: number) {
    this.http.get<any>(`${this.apiUrl}/${id}`).subscribe({
      next: data => {
        this.balloonForm.patchValue({
          ...data,
          b_start_date: data.b_start_date?.split('T')[0],
          b_end_date: data.b_end_date?.split('T')[0],
          featured: data.featured === 1
        });
      }
    });
  }

  // ================= SAVE =================
  save() {
    this.submitted = true;

    if (this.balloonForm.invalid) {
      this.balloonForm.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.balloonForm.value,
      featured: this.balloonForm.value.featured ? 1 : 0
    };

    if (this.editingId) {
      this.http.put(`${this.apiUrl}/${this.editingId}`, payload).subscribe({
        next: () => {
          this.toastr.success('Balloon updated successfully ✅');
          this.router.navigateByUrl('/dashboard/poll-kiosk');
        },
        error: () => this.toastr.error('Update failed ❌')
      });
    } else {
      this.http.post(this.apiUrl, payload).subscribe({
        next: () => {
          this.toastr.success('Balloon added successfully 🎉');
          this.resetToDefaults();
          this.router.navigateByUrl('/dashboard/poll-kiosk');
        },
        error: () => this.toastr.error('Creation failed ❌')
      });
    }
  }

  // ================= RESET / CANCEL =================
  private resetToDefaults() {
    this.balloonForm.reset({
      featured: false
    });
    this.submitted = false;
  }

  cancel() {
    if (this.editingId) return;
    this.resetToDefaults();
  }

  resetForm() {
    if (this.editingId) {
      this.loadPollKisokData(this.editingId);
      this.submitted = false;
      return;
    }
    this.resetToDefaults();
  }
}
