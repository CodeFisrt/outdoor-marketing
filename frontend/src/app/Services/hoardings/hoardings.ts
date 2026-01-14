import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Hoarding } from '../../Model/model';
import { ToastrService } from 'ngx-toastr';
import { CommonModule, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxSkeletonLoaderComponent } from "ngx-skeleton-loader";
import { FeaturedCards } from "../../pages/featured-cards/featured-cards";

@Component({
  selector: 'app-hoardings',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './hoardings.html',
  styleUrl: './hoardings.css'
})
export class Hoardings {

  hoardingList: Hoarding[] = [];
  filteredList: Hoarding[] = [];
  searchTerm: string = "";
  ngifCount: number = 0;

  // ✅ Pagination (ADDED)
  pageSize: number = 10;
  currentPage: number = 1;
  pagedList: Hoarding[] = [];
  totalPages: number = 1;

  constructor(
    private http: HttpClient,
    public router: Router,
    private toaster: ToastrService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.getAllHoardings();
  }

  // ✅ FIX: Removed setTimeout (it causes first-click issue)
  // and added ChangeDetectorRef for immediate UI update
  getAllHoardings() {
    this.http.get<Hoarding[]>("http://localhost:8080/hoardings")
      .subscribe({
        next: (res: Hoarding[]) => {
          this.hoardingList = res;
          this.filteredList = res;

          // ✅ Pagination update (ADDED)
          this.currentPage = 1;
          this.buildPagination();

          this.cd.detectChanges();  // 🔥 Forces immediate UI refresh
        },
        error: () => {
          this.toaster.error("Failed to load hoardings ❌");
        }
      });
  }

  // 🔍 Search filter
  filterHoardings() {
    const term = this.searchTerm?.toLowerCase();

    this.filteredList = this.hoardingList.filter(h =>
      h.h_name?.toLowerCase().includes(term) ||
      h.city?.toLowerCase().includes(term) ||
      h.state?.toLowerCase().includes(term) ||
      h.status?.toLowerCase().includes(term)
    );

    // ✅ Pagination update after search (ADDED)
    this.currentPage = 1;
    this.buildPagination();
  }

  // 🔍 Search triggered by icon click (ADDED)
  applySearch() {
    this.filterHoardings(); // reuse existing logic
  }

  // ✅ Build pagination whenever filteredList changes (ADDED)
  private buildPagination() {
    const total = this.filteredList?.length || 0;

    this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));

    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedList = this.filteredList.slice(start, end);

    this.cd.detectChanges();
  }

  // ✅ Page buttons list (frappe-like compact) (ADDED)
  get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;

    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);

    for (let i = start; i <= end; i++) pages.push(i);

    if (pages[0] !== 1) pages.unshift(1);
    if (pages[pages.length - 1] !== total) pages.push(total);

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

  // ✅ helper for "Showing X–Y of Z" (ADDED)
  get showingFrom(): number {
    if (!this.filteredList.length) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    const to = this.currentPage * this.pageSize;
    return Math.min(to, this.filteredList.length);
  }

  // ✏️ Edit record
  edit(id: number) {
    this.router.navigateByUrl("/dashboard/hoarding-form/" + id);
    this.toaster.info('Editing hoarding record ✏️');
  }

  // ❌ Delete record
  deleteHoardings(id: number) {
    const confirmDelete = window.confirm("Are you sure you want to delete this hoarding?");

    if (confirmDelete) {
      this.http.delete("http://localhost:8080/hoardings/" + id, { responseType: 'text' })
        .subscribe({
          next: () => {
            this.toaster.success("Hoarding deleted successfully ✅");
            this.getAllHoardings();  // reload after delete
          },
          error: () => {
            this.toaster.error("❌ Failed to delete hoarding");
          }
        });
    }
  }
}
