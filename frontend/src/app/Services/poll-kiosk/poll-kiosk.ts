import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterLink } from '@angular/router';
@Component({
  selector: 'app-poll-kiosk',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './poll-kiosk.html',
  styleUrls: ['./poll-kiosk.css']
})
export class PollKiosk implements OnInit {

  balloons: any[] = [];
  filteredList: any[] = [];

  // ✅ PAGINATION (ADDED – SAME AS HOARDINGS)
  pageSize: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  pagedList: any[] = [];

  balloonForm!: FormGroup;
  searchTerm: string = "";
  editingId: number | null = null;

  apiUrl = 'http://localhost:8080/balloons';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private toastr: ToastrService,
    private router: Router,
    private cd: ChangeDetectorRef
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

  // 🔍 Search filter
  filterBallons() {
    const t = this.searchTerm.toLowerCase();

    this.filteredList = this.balloons.filter(b =>
      b.b_location_name.toLowerCase().includes(t) ||
      b.b_city.toLowerCase().includes(t) ||
      b.b_type.toLowerCase().includes(t) ||
      String(b.b_cost).includes(t)
    );

    this.currentPage = 1;
    this.buildPagination();
  }

  // ✅ Load all records
  loadBalloons() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.balloons = data;
        this.filteredList = data;
        this.currentPage = 1;
        this.buildPagination();
        this.cd.detectChanges();
      },
      error: () => this.toastr.error("Failed to load balloons")
    });
  }

  // ✅ PAGINATION CORE (SAME LOGIC)
  private buildPagination() {
    const total = this.filteredList.length;

    this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));

    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedList = this.filteredList.slice(start, end);

    this.cd.detectChanges();
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) pages.push(i);

    if (pages[0] !== 1) pages.unshift(1);
    if (pages[pages.length - 1] !== this.totalPages) pages.push(this.totalPages);

    return Array.from(new Set(pages));
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.buildPagination();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.buildPagination();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.buildPagination();
    }
  }

  changePageSize(size: number) {
    this.pageSize = +size;
    this.currentPage = 1;
    this.buildPagination();
  }

  get showingFrom(): number {
    if (!this.filteredList.length) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredList.length);
  }

  // ✏️ Edit
  edit(balloonId: number) {
    this.editingId = balloonId;
    this.router.navigateByUrl("/dashboard/poll-Kisok-Form/" + balloonId);
    this.toastr.info("Editing balloon data");
  }

  // ❌ Delete
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

  resetForm() {
    this.balloonForm.reset();
    this.editingId = null;
  }
}
