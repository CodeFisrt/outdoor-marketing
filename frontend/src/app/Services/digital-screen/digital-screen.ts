import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Screen } from '../../Model/model';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-digital-screen',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormsModule],
  templateUrl: './digital-screen.html',
  styleUrls: ['./digital-screen.css']
})
export class DigitalScreen implements OnInit {
  screenList: Screen[] = [];
  filteredList: Screen[] = [];
  searchTerm: string = "";
  screenForm!: FormGroup;
  selectedScreenId: number = 0;

  // ✅ Pagination
  pageSize: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  paginatedList: Screen[] = [];

  // ✅ For your UI
  showingFrom: number = 0;
  showingTo: number = 0;
  pageNumbers: number[] = [];
  maxPageButtons: number = 5; // ✅ show only 5 page buttons

  constructor(
    private router: Router,
    private http: HttpClient,
    private toaster: ToastrService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.getAllScreen();
  }

  // Initialize form
  initForm() {
    this.screenForm = this.fb.group({
      ScreenName: ['', Validators.required],
      Location: ['', Validators.required],
      City: ['', Validators.required],
      State: ['', Validators.required],
      Latitude: [null, Validators.required],
      Longitude: [null, Validators.required],
      ScreenType: ['', Validators.required],
      Size: ['', Validators.required],
      Resolution: ['', Validators.required],
      OwnerName: ['', Validators.required],
      ContactPerson: ['', Validators.required],
      ContactNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      OnboardingDate: ['', Validators.required],
      Status: ['Active', Validators.required],
      RentalCost: [0, Validators.required],
      ContractStartDate: ['', Validators.required],
      ContractEndDate: ['', Validators.required],
      PowerBackup: [false],
      InternetConnectivity: ['', Validators.required],
      Notes: [''],
      featured: [false]
    });
  }

  // Load all screens
  getAllScreen() {
    this.http.get("http://localhost:8080/screens").subscribe({
      next: (res: any) => {
        this.screenList = res.data || [];
        this.filteredList = res.data || [];

        this.currentPage = 1;
        this.applyPagination();

        // this.cdr.detectChanges();
        // this.toaster.success("Screens Loaded Successfully");
      },
      error: (err) => {
        console.error(err);
        this.toaster.error("Failed to load screens");
      }
    });
  }

  // Search filter
  filterScreens() {
    const term = (this.searchTerm || '').toLowerCase();

    this.filteredList = this.screenList.filter(s =>
      (s.ScreenName || '').toLowerCase().includes(term) ||
      (s.Location || '').toLowerCase().includes(term) ||
      (s.City || '').toLowerCase().includes(term) ||
      (s.Status || '').toLowerCase().includes(term)
    );

    this.currentPage = 1;
    this.applyPagination();
    this.cdr.detectChanges();
  }

  applySearch() {
    this.filterScreens();
  }

  // ✅ MAIN pagination function
  applyPagination() {
    const totalItems = this.filteredList.length;

    this.totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));

    // clamp current page
    if (this.currentPage < 1) this.currentPage = 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    this.paginatedList = this.filteredList.slice(startIndex, endIndex);

    // showing range
    this.showingFrom = totalItems === 0 ? 0 : startIndex + 1;
    this.showingTo = Math.min(endIndex, totalItems);

    // build limited page numbers
    this.buildPageNumbers();

    this.cdr.detectChanges();
  }

  // ✅ show only 5 page buttons (windowed)
  buildPageNumbers() {
    this.pageNumbers = [];
    if (this.totalPages <= 1) return;

    const half = Math.floor(this.maxPageButtons / 2);
    let start = this.currentPage - half;
    let end = this.currentPage + half;

    if (start < 1) {
      start = 1;
      end = Math.min(this.totalPages, start + this.maxPageButtons - 1);
    }

    if (end > this.totalPages) {
      end = this.totalPages;
      start = Math.max(1, end - this.maxPageButtons + 1);
    }

    for (let i = start; i <= end; i++) this.pageNumbers.push(i);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.applyPagination();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyPagination();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyPagination();
    }
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.applyPagination();
  }

  // Delete screen
  deleteScreen(id: number) {
    if (!window.confirm("Are you sure you want to delete this screen?")) return;

    this.http.delete(`http://localhost:8080/screens/${id}`).subscribe({
      next: () => {
        this.toaster.success("Screen Deleted Successfully");
        this.getAllScreen();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.toaster.error("Failed to delete screen");
      }
    });
  }

  // Edit screen
  editScreen(screenId: number) {
    this.router.navigateByUrl("/dashboard/screen-Form/" + screenId);
    // this.toaster.info("Edit screen data loaded into form");
  }

  resetForm() {
    this.screenForm.reset();
    this.selectedScreenId = 0;

    this.currentPage = 1;
    this.applyPagination();

    this.cdr.detectChanges();
  }
}
