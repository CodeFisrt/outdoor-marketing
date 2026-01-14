import { CommonModule, NgClass, NgIf } from '@angular/common';
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
  selector: 'app-screen-form',
  imports: [NgClass, ReactiveFormsModule, CommonModule, RouterLink, NgIf],
  templateUrl: './screen-form.html',
  styleUrl: './screen-form.css'
})
export class ScreenForm {
  screenForm!: FormGroup;
  selectedScreenId: number = 0; // 0 = new screen, otherwise edit
  submitted = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private toaster: ToastrService,
    private fb: FormBuilder,
    private seo: SeoService
  ) { }

  ngOnInit(): void {
    this.initForm();

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      this.selectedScreenId = idParam ? +idParam : 0;

      if (this.selectedScreenId !== 0) {
        this.loadScreenData(this.selectedScreenId);
      } else {
        this.screenForm.reset({
          Status: 'Active',
          RentalCost: 0,
          PowerBackup: false,
          featured: false
        });
      }

      this.seo.updateSeo({
        title: 'Outdoor Advertising & Billboard Booking Platform in India',
        description: 'Find and book outdoor advertising like billboards, digital screens, vehicle and street ads across India with location-based search.',
        keywords: 'outdoor advertising, billboard advertising, digital screen advertising, hoarding ads, vehicle branding, street advertising, outdoor media booking, billboard booking platform, advertising in India',
        canonical: 'https://adonstreet.com/dashboard/digitalscreen/edit/' + this.selectedScreenId,
        robots: 'NOINDEX, NOFOLLOW',
        author: 'CodingEra',
        publisher: 'Adonstreet',
        lang: 'en-IN'
      });
    });
  }

  // ================= FORM INIT =================
  initForm() {
    this.screenForm = this.fb.group(
      {
        ScreenName: ['', [Validators.required, Validators.minLength(3)]],
        Location: ['', Validators.required],
        City: ['', Validators.required],
        State: ['', Validators.required],
        Latitude: [null, [Validators.required, this.latitudeValidator]],
        Longitude: [null, [Validators.required, this.longitudeValidator]],
        ScreenType: ['', Validators.required],
        Size: ['', Validators.required],
        Resolution: ['', Validators.required],
        OwnerName: ['', Validators.required],
        ContactPerson: ['', Validators.required],
        ContactNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
        OnboardingDate: ['', Validators.required],
        Status: ['Active', Validators.required],
        RentalCost: [0, [Validators.required, Validators.min(0)]],
        ContractStartDate: ['', Validators.required],
        ContractEndDate: ['', Validators.required],
        PowerBackup: [false],
        InternetConnectivity: ['', Validators.required],
        Notes: [''],
        featured: [false]
      },
      {
        validators: [
          this.dateRangeValidator('OnboardingDate', 'ContractEndDate', 'screenDateRangeInvalid'),
          this.dateRangeValidator('ContractStartDate', 'ContractEndDate', 'contractDateRangeInvalid')
        ]
      }
    );
  }

  // ================= VALIDATION HELPERS =================
  isInvalid(controlName: string): boolean {
    const c = this.screenForm.get(controlName);
    return !!(c && c.invalid && (c.touched || this.submitted));
  }

  hasFormError(errorKey: string): boolean {
    return !!(
      this.screenForm.errors &&
      this.screenForm.errors[errorKey] &&
      (this.submitted || this.anyDateTouched())
    );
  }

  private anyDateTouched(): boolean {
    const fields = ['OnboardingDate', 'ContractStartDate', 'ContractEndDate'];
    return fields.some(f => this.screenForm.get(f)?.touched);
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

  // ================= LOAD DATA =================
  loadScreenData(id: number) {
    this.http.get<any>(`http://localhost:8080/screens/${id}`).subscribe({
      next: res => {
        const data = res?.data ?? res;
        this.screenForm.patchValue({
          ...data,
          OnboardingDate: data.OnboardingDate?.split('T')[0],
          ContractStartDate: data.ContractStartDate?.split('T')[0],
          ContractEndDate: data.ContractEndDate?.split('T')[0],
          featured: data.featured === 1 || data.featured === true
        });
        this.toaster.success("Screen data loaded ✅");
      },
      error: err => {
        console.error(err);
        this.toaster.error("Failed to load screen details ❌");
      }
    });
  }

  // ================= SAVE =================
  addOrUpdateScreen() {
    this.submitted = true;

    if (this.screenForm.invalid) {
      this.screenForm.markAllAsTouched();
      return;
    }

    const payload = { ...this.screenForm.value, featured: this.screenForm.value.featured ? 1 : 0 };

    if (this.selectedScreenId === 0) {
      this.http.post("http://localhost:8080/screens/", payload).subscribe({
        next: () => {
          this.toaster.success("New Screen Added Successfully ✅");
          this.resetForm();
          this.router.navigateByUrl("/dashboard/digitalscreen");
        },
        error: err => {
          console.error(err);
          this.toaster.error("Error Creating Screen ❌");
        }
      });
    } else {
      this.http.put(`http://localhost:8080/screens/${this.selectedScreenId}`, payload).subscribe({
        next: () => {
          this.toaster.success("Screen Updated Successfully ✅");
          this.resetForm();
          this.router.navigateByUrl("/dashboard/digitalscreen");
          this.selectedScreenId = 0;
        },
        error: err => {
          console.error(err);
          this.toaster.error("Error Updating Screen ❌");
        }
      });
    }
  }

  // ================= RESET / CANCEL =================
  resetForm() {
    if (this.selectedScreenId !== 0) {
      this.loadScreenData(this.selectedScreenId);
      this.submitted = false;
      return;
    }

    this.screenForm.reset({
      Status: 'Active',
      RentalCost: 0,
      PowerBackup: false,
      featured: false
    });
    this.selectedScreenId = 0;
    this.submitted = false;
  }
}
