import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterLink } from '@angular/router';
import { BalloonService } from '../../ApiServices/CallApis/balloon-service';

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
  pagedList: any[] = [];

  // ✅ Pagination
  pageSize = 5;
  currentPage = 1;
  totalPages = 1;

  balloonForm!: FormGroup;
  searchTerm = '';
  editingId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private balloonService: BalloonService,
    private toastr: ToastrService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadBalloons();
  }

  // ✅ FORM
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

  // ✅ LOAD DATA (ONLY ONCE)
  loadBalloons() {
    this.balloonService.getAllBalloons().subscribe({
      next: (res) => {
        this.balloons = res;
        this.filteredList = res;
        this.currentPage = 1;
        this.buildPagination();
      },
      error: () => this.toastr.error('Failed to load balloons')
    });
  }

  // 🔍 SEARCH (SAME LOGIC)
  filterBallons() {
    const term = this.searchTerm.toLowerCase();

    this.filteredList = this.balloons.filter(b =>
      b.b_location_name?.toLowerCase().includes(term) ||
      b.b_city?.toLowerCase().includes(term) ||
      b.b_type?.toLowerCase().includes(term) ||
      String(b.b_cost ?? '').includes(term) ||
      b.payment_status?.toLowerCase().includes(term)
    );

    this.currentPage = 1;
    this.buildPagination();
  }

  applySearch() {
    this.filterBallons();
  }

  // ✅ PAGINATION CORE (UNCHANGED)
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
    return this.filteredList.length
      ? (this.currentPage - 1) * this.pageSize + 1
      : 0;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredList.length);
  }

  // ✏️ EDIT
  edit(id: number) {
    this.router.navigateByUrl('/dashboard/poll-Kisok-Form/' + id);
    this.toastr.info('Editing balloon data');
  }

  // ❌ DELETE
  delete(id: number) {
    if (!confirm('Delete this balloon?')) return;

    this.balloonService.deleteBalloon(id).subscribe({
      next: () => {
        this.toastr.warning('Balloon deleted');
        this.loadBalloons();
      },
      error: () => this.toastr.error('Delete failed')
    });
  }

  resetForm() {
    this.balloonForm.reset();
    this.editingId = null;
  }
}
