import { NgClass, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Route, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-wallpaints-from',
  imports: [ReactiveFormsModule,NgClass,NgIf,RouterLink],
  templateUrl: './wallpaints-from.html',
  styleUrl: './wallpaints-from.css'
})
export class WallpaintsFrom {
  societyForm: FormGroup;
  wallId: number = 0;
  // ✅ declare first

  constructor(
    private router: Router,
    private http: HttpClient,
    private route: ActivatedRoute,
    private toaster: ToastrService,
    private fb: FormBuilder
  ) {
    // ✅ now initialize safely here
    this.societyForm = this.fb.group({
      s_id: [0],
      s_name: ['', Validators.required],
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
      s_lat: ['', Validators.required],
      s_long: ['', Validators.required],
      s_crowd: [0, [Validators.required, Validators.min(1)]],
      approval_status: ['Pending', Validators.required],
      event_status: ['Scheduled', Validators.required],
      expected_cost: ['', [Validators.required, Validators.min(1)]],
      actual_cost: ['0'],
      responsible_person: ['', Validators.required],
      follow_up_date: ['', Validators.required],
      remarks: ['']
    });


  }
  ngOnInit() {
    //to react activated route id
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.wallId = +idParam;
        if (this.wallId !== 0) {
          this.loadWallData(this.wallId);
        }
      }
    });
  }

  //load edits
  loadWallData(id: number) {
    this.http.get<any>(`http://localhost:8080/societies/${id}`).subscribe({
      next: (data) => {
        this.societyForm.patchValue(data);
      },
      error: () => {
        this.toaster.error("Failed to load societies details");
      }
    });
  }
  // ✅ Add
  add() {
    if (this.societyForm.invalid) return;
    this.http.post('http://localhost:8080/societies/', this.societyForm.value).subscribe({
      next: () => {
        this.toaster.success('Society Added');
        this.router.navigateByUrl("/dashboard/wall-painting")
        this.societyForm.reset({ approval_status: 'Pending', event_status: 'Scheduled' });

      },
      error: () => this.toaster.error('Add failed')
    });
  }

  // ✅ Update
  update() {
    const id = this.societyForm.value.s_id;
    if (!id) return;
    this.http.put(`http://localhost:8080/societies/${id}`, this.societyForm.value).subscribe({
      next: () => {
        this.toaster.success('Society Updated');
         this.router.navigateByUrl("/dashboard/wall-painting")
        this.societyForm.reset({ approval_status: 'Pending', event_status: 'Scheduled' });

      },
      error: () => this.toaster.error('Update failed')
    });
  }


}
