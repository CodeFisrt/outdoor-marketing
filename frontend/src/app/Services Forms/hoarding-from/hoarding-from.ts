import { NgClass, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SeoService } from '../../ApiServices/Seo-Service/seo-service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { log } from 'node:console';

@Component({
  selector: 'app-hoarding-from',
  imports: [RouterLink, ReactiveFormsModule, NgClass, MatCheckboxModule],
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
    private toastr: ToastrService,
    private seo: SeoService
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
      featured: [false] // ✅ boolean default
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.hoardingId = +id;
        this.loadHoardingsData(this.hoardingId);
      }
    });
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
          featured: data.featured === 1 // convert 1 to true for checkbox
        });
        console.log(data);
      }
    });
  }

  save() {
    if (this.hoardingForm.invalid) return;
    debugger;
    // Convert featured boolean to 0 or 1 for DB
    const payLoad = {
      ...this.hoardingForm.value,
      featured: this.hoardingForm.value.featured ? 1 : 0
    };
    console.log(payLoad);

    if (this.hoardingId) {
      // PUT request for update
      this.http.put(`http://localhost:8080/hoardings/${this.hoardingId}`, payLoad).subscribe({
        next: () => {
          this.router.navigateByUrl("/dashboard/hoarding");
          this.toastr.success('Hoarding updated successfully ✅');
          this.cancel();
        },
        error: () => this.toastr.error('Update failed ❌')
      });
    } else {
      // POST request for new entry
      this.http.post("http://localhost:8080/hoardings/", payLoad).subscribe({
        next: () => {
          this.router.navigateByUrl("/dashboard/hoarding");
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
