import { CommonModule, NgClass, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-poll-kisok-form',
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgClass, RouterLink],
  templateUrl: './poll-kisok-form.html',
  styleUrl: './poll-kisok-form.css'
})
export class PollKisokForm {
  editingId: number | null = null;
  balloonForm!: FormGroup;
  apiUrl = 'http://localhost:8080/balloons';

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.initForm();

    //to react activated route id
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.editingId = +idParam;
        if (this.editingId !== 0) {
          this.loadPollKisokData(this.editingId);
        }
      }
    });
  }

  initForm() {
    this.balloonForm = this.fb.group({
      b_id: [0],
      b_location_name: ['', Validators.required],
      b_area: ['', Validators.required],
      b_city: ['', Validators.required],
      b_address: [''],
      b_lat: ['', Validators.required],
      b_long: ['', Validators.required],
      b_size: ['', Validators.required],
      b_type: ['', Validators.required],
      b_height: ['', Validators.required],
      b_duration_days: ['', Validators.required],
      b_start_date: ['', Validators.required],
      b_end_date: ['', Validators.required],
      expected_crowd: ['', Validators.required],
      b_contact_person_name: ['', Validators.required],
      b_contact_num: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      b_cost: ['', Validators.required],
      payment_status: ['', Validators.required],
      remarks: [''],
      featured: [false]
    });
  }

  loadPollKisokData(id: number) {
    this.http.get<any>(`${this.apiUrl}/${this.editingId}`).subscribe({
      next: (data) => {
        this.balloonForm.patchValue({
          ...data,
          b_start_date: data.b_start_date?.split('T')[0],
          b_end_date: data.b_end_date?.split('T')[0],
          featured: data.featured === 1
        });
      }
    })
  }
  // ✅ Create or Update
  save() {
    if (this.balloonForm.invalid) return;

    const payLoad = {
      ...this.balloonForm.value,
      featured: this.balloonForm.value.featured ? 1 : 0
    };

    if (this.editingId) {
      this.http.put(`${this.apiUrl}/${this.editingId}`, payLoad).subscribe({
        next: () => {
          this.router.navigateByUrl("/dashboard/poll-kiosk")
          this.toastr.success('Balloon updated successfully ✅');
          this.cancel();
        },
        error: () => this.toastr.error('Update failed ❌')
      });
    } else {
      this.http.post(this.apiUrl, payLoad).subscribe({
        next: () => {
          this.router.navigateByUrl("/dashboard/poll-kiosk")
          this.toastr.success('Balloon added successfully 🎉');
          this.cancel();
        },
        error: () => this.toastr.error('Creation failed ❌')
      });
    }
  }

  // ✅ Edit mode
  edit(balloon: any) {
    this.editingId = balloon.b_id;
    this.balloonForm.patchValue(balloon);
    this.toastr.info('Editing balloon record ✏️');
  }



  // ✅ Cancel & reset
  cancel() {
    this.editingId = null;
    this.balloonForm.reset();
  }
  resetForm() {
    this.editingId = null;
    this.balloonForm.reset();
  }
}
