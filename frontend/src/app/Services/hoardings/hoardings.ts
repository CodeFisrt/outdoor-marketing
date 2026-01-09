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
  imports: [CommonModule, RouterLink, FormsModule, NgxSkeletonLoaderComponent],
  templateUrl: './hoardings.html',
  styleUrl: './hoardings.css'
})
export class Hoardings {

  hoardingList: Hoarding[] = [];
  filteredList: Hoarding[] = [];
  searchTerm: string = "";
  ngifCount: number = 0;

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
  }

  // 🔍 Search triggered by icon click (ADDED)
  applySearch() {
    this.filterHoardings(); // reuse existing logic
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
