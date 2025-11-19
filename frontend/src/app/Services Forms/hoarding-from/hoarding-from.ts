import { NgClass, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-hoarding-from',
  imports: [RouterLink, ReactiveFormsModule,NgClass,NgIf],
  templateUrl: './hoarding-from.html',
  styleUrl: './hoarding-from.css'
})
export class HoardingFrom {
  hoardingForm!: FormGroup;
  hoardingId?: number;
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) { }

   ngOnInit(): void {
    this.hoardingForm = this.fb.group({
      h_name: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      latitude: [''],
      longitude: [''],
      size: [''],
      owner_name: [''],
      contact_person: [''],
      contact_number: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      ad_start_date: [''],
      ad_end_date: [''],
      status: ['Available', Validators.required],
      rental_cost: ['', [Validators.required, Validators.min(0)]],
      contract_start_date: [''],
      contract_end_date: [''],
      notes: [''],
      created_at: [{ value: new Date().toISOString(), disabled: true }]
    });

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.hoardingId = +idParam;
        if (this.hoardingId !== 0) {
          this.loadHoardingsData(this.hoardingId);
        }
      }
    });
  }

  loadHoardingsData(id: number) {
    this.http.get(`http://localhost:8080/hoardings/${this.hoardingId}`).subscribe({
      next: (data) => {
        this.hoardingForm.patchValue(data);
      }
    })
  };

  save() {
    if (this.hoardingForm.invalid) return;

    if (this.hoardingId) {
      this.http.put(`http://localhost:8080/hoardings/${this.hoardingId}`, this.hoardingForm.value).subscribe({
        next: () => {
          this.router.navigateByUrl("/dashboard/hoarding")
          this.toastr.success('Hoarding updated successfully ✅');
          this.cancel();
        },
        error: () => this.toastr.error('Update failed ❌')
      });
    } else {
      this.http.post("http://localhost:8080/hoardings/", this.hoardingForm.value).subscribe({
        next: () => {
          this.router.navigateByUrl("/dashboard/hoarding")
          this.toastr.success('Hoarding added successfully 🎉');
          this.cancel();
        },
        error: () => this.toastr.error('Creation failed ❌')
      });
    }
  }
  cancel() {

    this.hoardingForm.reset();
  }
  resetForm() {

    this.hoardingForm.reset();
  }
}
