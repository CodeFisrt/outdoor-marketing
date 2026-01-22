import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Hoarding } from '../../Model/model';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HoardingService } from '../../ApiServices/CallApis/hoarding-service';

@Component({
  selector: 'app-hoardings',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './hoardings.html',
  styleUrl: './hoardings.css'
})
export class Hoardings implements OnInit {

  hoardingList: Hoarding[] = [];
  filteredList: Hoarding[] = [];
  pagedList: Hoarding[] = [];

  searchTerm: string = '';

  // ✅ Pagination
  pageSize: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;

  constructor(
    private hoardingService: HoardingService,
    private router: Router,
    private toaster: ToastrService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadHoardings(); // ✅ called ONCE
  }

  // ✅ Load hoardings (cached)
  loadHoardings() {
    this.hoardingService.getAllHoardings().subscribe({
      next: (res: Hoarding[]) => {
        this.hoardingList = res || [];
        this.filteredList = [...this.hoardingList];

        this.currentPage = 1;
        this.buildPagination();
      },
      error: () => {
        this.toaster.error('Failed to load hoardings ❌');
      }
    });
  }

  // 🔍 Search
  filterHoardings() {
    const term = this.searchTerm.toLowerCase();

    this.filteredList = this.hoardingList.filter(h =>
      h.h_name?.toLowerCase().includes(term) ||
      h.city?.toLowerCase().includes(term) ||
      h.state?.toLowerCase().includes(term) ||
      h.status?.toLowerCase().includes(term)
    );

    this.currentPage = 1;
    this.buildPagination();
  }

  applySearch() {
    this.filterHoardings();
  }

  // ✅ Pagination logic
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

    if (!pages.includes(1)) pages.unshift(1);
    if (!pages.includes(this.totalPages)) pages.push(this.totalPages);

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

  // ✏️ Edit
  edit(id: number) {
    this.router.navigateByUrl('/dashboard/hoarding-form/' + id);
  }

  // ❌ Delete
  deleteHoardings(id: number) {
    if (!confirm('Are you sure you want to delete this hoarding?')) return;

    this.hoardingService.deleteHoardingById(id).subscribe({
      next: () => {
        this.toaster.success('Hoarding deleted successfully ✅');

        // 🔥 invalidate cache & reload ONCE
        this.hoardingService.refreshHoardings();
        this.loadHoardings();
      },
      error: () => {
        this.toaster.error('❌ Failed to delete hoarding');
      }
    });
  }
}
