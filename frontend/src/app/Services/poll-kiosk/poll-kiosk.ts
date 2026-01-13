import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterLink } from '@angular/router';
import { NgxSkeletonLoaderComponent } from "ngx-skeleton-loader";

@Component({
  selector: 'app-poll-kiosk',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, NgxSkeletonLoaderComponent],
  templateUrl: './poll-kiosk.html',
  styleUrls: ['./poll-kiosk.css']
})
export class PollKiosk implements OnInit {

  balloons: any[] = [];
  filteredList: any[] = [];
  balloonForm!: FormGroup;
  searchTerm: string = "";
  editingId: number | null = null;

  apiUrl = 'http://localhost:8080/balloons';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private toastr: ToastrService,
    private router: Router,
    private cd: ChangeDetectorRef   // 👈 FIX change detection
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadBalloons();
  }

  // ✅ Initialize form
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

  // 🔍 Filter Search
  filterBallons() {
    const t = this.searchTerm.toLowerCase();
    this.filteredList = this.balloons.filter(b =>
      b.b_location_name.toLowerCase().includes(t) ||
      b.b_city.toLowerCase().includes(t) ||
      b.b_type.toLowerCase().includes(t) ||
      String(b.b_cost).toLowerCase().includes(t)
    );
  }

  // ✅ Load all records
  loadBalloons() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.balloons = data;
        this.filteredList = data;
        this.cd.detectChanges();  // 👈 FIX ExpressionChanged error
      },
      error: () => this.toastr.error("Failed to load balloons")
    });
  }

  // ✅ Save / Update data
  saveBalloon() {
    const payload = this.balloonForm.value;

    // ➤ Add New
    if (this.editingId === null) {
      this.http.post(this.apiUrl, payload).subscribe({
        next: () => {
          this.toastr.success("Balloon added successfully");
          this.loadBalloons();
          this.resetForm();
        },
        error: () => this.toastr.error("Failed to add balloon")
      });
    }
    // ➤ Update Existing
    else {
      this.http.put(`${this.apiUrl}/${this.editingId}`, payload).subscribe({
        next: () => {
          this.toastr.success("Balloon updated successfully");
          this.loadBalloons();
          this.resetForm();
          this.editingId = null;
        },
        error: () => this.toastr.error("Failed to update record")
      });
    }
  }

  // ✅ Load data for edit
  edit(balloonId: number) {
    this.editingId = balloonId;
    this.router.navigateByUrl("/dashboard/poll-Kisok-Form/" + balloonId);
    this.toastr.info("Editing balloon data");
  }

  // ✅ Delete record
  delete(id: number) {
    if (!confirm("Are you sure you want to delete?")) return;

    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.toastr.warning("Balloon deleted");
        this.loadBalloons();
      },
      error: () => this.toastr.error("Delete failed")
    });
  }

  // ✅ Reset form
  resetForm() {
    this.balloonForm.reset();
    this.editingId = null;
  }
}
