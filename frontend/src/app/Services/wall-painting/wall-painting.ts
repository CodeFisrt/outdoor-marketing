import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Society } from '../../Model/model';
import { CommonModule, NgClass } from '@angular/common';
import { SocietyService } from '../../ApiServices/CallApis/society-service';

@Component({
  selector: 'app-wall-painting',
  imports: [NgClass, ReactiveFormsModule, RouterLink, FormsModule, CommonModule],
  templateUrl: './wall-painting.html',
  styleUrls: ['./wall-painting.css']
})
export class WallPainting {

  societyList: Society[] = [];
  filteredList: Society[] = [];
  pagedList: Society[] = [];
  societyForm: FormGroup;
  searchTerm: string = '';

  // Pagination
  pageSize = 5;
  currentPage = 1;
  totalPages = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private societyService: SocietyService,
    private toaster: ToastrService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
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

    this.loadSocieties();
  }

  // ========================
  // LOAD SOCIETIES (CACHED)
  // ========================
  loadSocieties() {
    this.societyService.getAllSocieties().subscribe({
      next: (res) => {
        this.societyList = res || [];
        this.filteredList = [...this.societyList];
        this.currentPage = 1;
        this.buildPagination();
      },
      error: () => this.toaster.error('Failed to fetch societies')
    });
  }

  // ========================
  // FILTER / SEARCH
  // ========================
  filterSocities() {
    const term = this.searchTerm.toLowerCase();

    this.filteredList = this.societyList.filter(s =>
      s.s_name?.toLowerCase().includes(term) ||
      s.s_city?.toLowerCase().includes(term) ||
      s.s_no_flats?.toString().includes(term) ||
      s.expected_cost?.toString().includes(term)
    );

    this.currentPage = 1;
    this.buildPagination();
  }

  applySearch() {
    this.filterSocities();
  }

  // ========================
  // PAGINATION
  // ========================
  private buildPagination() {
    const total = this.filteredList.length;
    this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));

    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedList = this.filteredList.slice(start, end);
    this.cdr.detectChanges();
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

  get showingFrom() {
    return this.filteredList.length
      ? (this.currentPage - 1) * this.pageSize + 1
      : 0;
  }

  get showingTo() {
    return Math.min(this.currentPage * this.pageSize, this.filteredList.length);
  }

  // ========================
  // CRUD
  // ========================
  add() {
    if (this.societyForm.invalid) return;

    this.societyService.addSociety(this.societyForm.value).subscribe(() => {
      this.toaster.success('Society Added');
      this.societyService.refreshSocieties();
      this.loadSocieties();
      this.societyForm.reset({ approval_status: 'Pending', event_status: 'Scheduled' });
    });
  }

  update() {
    const id = this.societyForm.value.s_id;
    if (!id) return;

    this.societyService.updateSociety(id, this.societyForm.value).subscribe(() => {
      this.toaster.success('Society Updated');
      this.societyService.refreshSocieties();
      this.loadSocieties();
      this.societyForm.reset({ approval_status: 'Pending', event_status: 'Scheduled' });
    });
  }

  delete(id: number) {
    if (!confirm('Delete this society?')) return;

    this.societyService.deleteSociety(id).subscribe(() => {
      this.toaster.success('Society Deleted');
      this.societyService.refreshSocieties();
      this.loadSocieties();
    });
  }

  edit(id: number) {
    this.router.navigateByUrl('/dashboard/wall-Paints-Form/' + id);
    this.toaster.info('Edit Wall data loaded into form');
  }
}
