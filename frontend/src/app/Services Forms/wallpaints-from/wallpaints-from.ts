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

@Component({
  selector: 'app-wallpaints-from',
  imports: [ReactiveFormsModule, NgClass, NgIf, RouterLink],
  templateUrl: './wallpaints-from.html',
  styleUrl: './wallpaints-from.css'
})
export class WallpaintsFrom {
  societyForm!: FormGroup;
  wallId: number = 0;
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
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.wallId = +idParam;
        if (this.wallId !== 0) {
          this.loadWallData(this.wallId);
        }
      }
    });

    this.seo.updateSeo({
      title: "",
      description: '',
      keywords: '',
      canonical: '',
      robots: '',
      author: '',
      publisher: '',
      lang: ''
    });
  }

  // ================= INIT FORM =================
  private initForm() {
    this.societyForm = this.fb.group(
      {
        s_id: [0],
        s_name: ['', [Validators.required, Validators.minLength(3)]],
        s_area: ['', Validators.required],
        s_city: ['', Validators.required],
        s_pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
        s_contact_person_name: ['', Validators.required],
        s_contact_num: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        s_no_flats: [0, [Validators.required, Validators.min(1)]],
        s_type: ['', Validators.required],
        s_event_type: ['', Validators.required],
        event_date: ['', Validators.required],
        event_time: ['', Validators.required],
        s_address: ['', Validators.required],
        s_lat: ['', [Validators.required, this.latitudeValidator]],
        s_long: ['', [Validators.required, this.longitudeValidator]],
        s_crowd: [0, [Validators.required, Validators.min(1)]],
        approval_status: ['Pending', Validators.required],
        event_status: ['Scheduled', Validators.required],
        expected_cost: ['', [Validators.required, Validators.min(1)]],
        actual_cost: ['0'],
        responsible_person: ['', Validators.required],
        follow_up_date: ['', Validators.required],
        remarks: [''],
        featured: [false]
      },
      {
        validators: [
          this.dateRangeValidator('event_date', 'follow_up_date', 'dateRangeInvalid')
        ]
      }
    );
  }

  // ================= VALIDATORS =================
  isInvalid(controlName: string): boolean {
    const c = this.societyForm.get(controlName);
    return !!(c && c.invalid && (c.touched || this.submitted));
  }

  hasFormError(errorKey: string): boolean {
    return !!(
      this.societyForm.errors &&
      this.societyForm.errors[errorKey] &&
      (this.submitted || this.anyDateTouched())
    );
  }

  private anyDateTouched(): boolean {
    return ['event_date', 'follow_up_date'].some(f =>
      this.societyForm.get(f)?.touched
    );
  }

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

  dateRangeValidator(startKey: string, endKey: string, errorKey: string) {
    return (group: AbstractControl): ValidationErrors | null => {
      const start = new Date(group.get(startKey)?.value);
      const end = new Date(group.get(endKey)?.value);

      if (!group.get(startKey)?.value || !group.get(endKey)?.value) return null;
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return { [errorKey]: true };
      if (end < start) return { [errorKey]: true };

      return null;
    };
  }

  // ================= LOAD DATA =================
  loadWallData(id: number) {
    this.http.get<any>(`http://localhost:8080/societies/${id}`).subscribe({
      next: data => {
        this.societyForm.patchValue({
          ...data,
          event_date: data.event_date?.split('T')[0],
          follow_up_date: data.follow_up_date?.split('T')[0],
          featured: data.featured === 1
        });
      },
      error: () => {
        this.toaster.error("Failed to load society details");
      }
    });
  }

  // ================= ADD =================
  add() {
    this.submitted = true;
    if (this.societyForm.invalid) {
      this.societyForm.markAllAsTouched();
      return;
    }

    const payload = { ...this.societyForm.value, featured: this.societyForm.value.featured ? 1 : 0 };

    this.http.post('http://localhost:8080/societies/', payload).subscribe({
      next: () => {
        this.toaster.success('Society Added');
        this.resetToDefaults();
        this.router.navigateByUrl("/dashboard/wall-painting");
      },
      error: () => this.toaster.error('Add failed')
    });
  }

  // ================= UPDATE =================
  update() {
    this.submitted = true;
    if (this.societyForm.invalid) {
      this.societyForm.markAllAsTouched();
      return;
    }

    const id = this.societyForm.value.s_id;
    if (!id) return;

    const payload = { ...this.societyForm.value, featured: this.societyForm.value.featured ? 1 : 0 };

    this.http.put(`http://localhost:8080/societies/${id}`, payload).subscribe({
      next: () => {
        this.toaster.success('Society Updated');
        this.resetToDefaults();
        this.router.navigateByUrl("/dashboard/wall-painting");
      },
      error: () => this.toaster.error('Update failed')
    });
  }

  // ================= RESET / CANCEL =================
  private resetToDefaults() {
    this.societyForm.reset({
      approval_status: 'Pending',
      event_status: 'Scheduled',
      featured: false
    });
    this.submitted = false;
  }

  cancel() {
    if (this.wallId) return;
    this.resetToDefaults();
  }

  resetForm() {
    if (this.wallId) {
      this.loadWallData(this.wallId);
      this.submitted = false;
      return;
    }
    this.resetToDefaults();
  }
}
