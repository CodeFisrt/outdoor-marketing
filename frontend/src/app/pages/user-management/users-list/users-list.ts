import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HttpClientModule],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css'
})
export class UsersList implements OnInit {
  // ✅ list will come from API
  list: any[] = [];

  searchTerm: string = '';
  filteredList: any[] = [];
  pagedList: any[] = [];

  currentPage: number = 1;
  pageSize: number = 5;
  totalPages: number = 1;
  pageNumbers: number[] = [];

  showingFrom: number = 0;
  showingTo: number = 0;

  private isBrowser: boolean;

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    const role = (localStorage.getItem('role') || '').toLowerCase();

    // ✅ Only admin can open this page
    if (role !== 'admin') {
      this.router.navigateByUrl('/signin');
      return;
    }

    // ✅ fetch users from DB
    this.loadUsers();
  }

  loadUsers() {
    const token = localStorage.getItem('token'); // your stored admin token

    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    this.http.get<any[]>('http://localhost:8080/Users', { headers }).subscribe({
      next: (res) => {
        // ✅ normalize keys so your UI keeps working
        this.list = (res || []).map((u: any) => ({
          userId: u.userId ?? u.id,
          userName: u.userName,
          userEmail: u.userEmail ?? u.emailId ?? u.userEmail,
          role: u.role || 'user',
          status: u.status || 'active'
        }));

        this.filteredList = [...this.list];
        this.currentPage = 1;
        this.updatePagination();

        // ✅ Fix NG0100 ExpressionChangedAfterItHasBeenCheckedError
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Users fetch error:', err);

        // if token missing/invalid -> force login
        if (err?.status === 401 || err?.status === 403) {
          localStorage.clear();
          this.router.navigateByUrl('/signin');
        }
      }
    });
  }

  // ✅ Search
  filterUsers() {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredList = [...this.list];
    } else {
      this.filteredList = this.list.filter((u: any) =>
        (u.userName || '').toLowerCase().includes(term) ||
        (u.userEmail || '').toLowerCase().includes(term) ||
        (u.role || '').toLowerCase().includes(term) ||
        (u.status || '').toLowerCase().includes(term)
      );
    }

    this.currentPage = 1;
    this.updatePagination();
  }

  applySearch() {
    this.filterUsers();
  }

  // ✅ Pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredList.length / this.pageSize) || 1;
    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    this.pagedList = this.filteredList.slice(startIndex, endIndex);

    this.showingFrom = this.filteredList.length ? startIndex + 1 : 0;
    this.showingTo = Math.min(endIndex, this.filteredList.length);
  }

  changePageSize(size: number) {
    this.pageSize = Number(size);
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  // ✅ Actions
  edit(userId: number) {
    this.router.navigateByUrl(`/dashboard/users/add?edit=${userId}`);
  }

  deleteUser(userId: number) {
    const ok = confirm('Are you sure you want to delete this user?');
    if (!ok) return;

    // (optional later) call backend delete API here
    this.list = this.list.filter(u => u.userId !== userId);
    this.filterUsers();
  }
}
