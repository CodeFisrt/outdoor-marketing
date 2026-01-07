import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Society } from '../../Model/model';
import { CommonModule, NgClass } from '@angular/common';
import { NgxSkeletonLoaderComponent } from "ngx-skeleton-loader";

@Component({
  selector: 'app-wall-painting',
  imports: [NgClass, ReactiveFormsModule, RouterLink, FormsModule, CommonModule, NgxSkeletonLoaderComponent],
  templateUrl: './wall-painting.html',
  styleUrl: './wall-painting.css'
})
export class WallPainting {
  societyList: Society[] = [];
  societyForm: FormGroup;
  filteredList: any[] = [];
  searchTerm: string = "";

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private toaster: ToastrService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef   // ✅ added ChangeDetectorRef
  ) {

    // Form initialized safely here
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

    this.getAll();
  }

  // ✅ Get All (with detectChanges)
  getAll() {
    this.http.get<Society[]>('http://localhost:8080/societies').subscribe((res: any) => {
      if (res) {
        this.societyList = res;
        this.filteredList = res;

        this.cdr.detectChanges();   // ✅ FIXES view update issues
      } else {
        this.toaster.error("Error fetching data");
      }
    });
  }

  // 🔍 Filter logic
  filterSocities() {
    const term = this.searchTerm.toLowerCase();

    this.filteredList = this.societyList.filter(s =>
      s.s_name.toLowerCase().includes(term) ||
      s.s_city.toLowerCase().includes(term) ||
      s.s_no_flats.toString().includes(term) ||
      s.expected_cost.toString().includes(term)
    );

    this.cdr.detectChanges();   // ✅ after filtering refresh UI
  }

  // ✅ Add
  add() {
    if (this.societyForm.invalid) return;

    this.http.post('http://localhost:8080/societies/', this.societyForm.value).subscribe({
      next: () => {
        this.toaster.success('Society Added');

        this.societyForm.reset({ approval_status: 'Pending', event_status: 'Scheduled' });
        this.getAll();

        this.cdr.detectChanges();   // ⬅ refresh UI
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
        this.societyForm.reset({ approval_status: 'Pending', event_status: 'Scheduled' });
        this.getAll();

        this.cdr.detectChanges();
      },
      error: () => this.toaster.error('Update failed')
    });
  }

  // ✅ Delete
  delete(id: number) {
    if (!confirm('Delete this society?')) return;

    this.http.delete(`http://localhost:8080/societies/${id}`).subscribe({
      next: () => {
        this.toaster.success('Society Deleted');
        this.getAll();

        this.cdr.detectChanges();
      },
      error: () => this.toaster.error('Delete failed')
    });
  }

  // ✅ Edit
  edit(s_Id: number) {
    this.router.navigateByUrl("/dashboard/wall-Paints-Form/" + s_Id);
    this.toaster.info("Edit Wall data loaded into form");

    this.cdr.detectChanges();
  }
}
