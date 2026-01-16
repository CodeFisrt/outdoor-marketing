// import { Component } from '@angular/core';

// @Component({
//   selector: 'users-list',
//   imports: [],
//   templateUrl: './users-list.html',
//   styleUrl: './users-list.css'
// })
// export class UsersList {

// }

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css'
})
export class UsersList implements OnInit {

  // ✅ change this later with API response
  list: any[] = [
    { userId: 1, userName: 'Admin', userEmail: 'admin@gmail.com', role: 'admin', status: 'active' },
    { userId: 2, userName: 'Agency User', userEmail: 'agency@gmail.com', role: 'agency', status: 'active' },
    { userId: 3, userName: 'Screen Owner', userEmail: 'owner@gmail.com', role: 'screenOwner', status: 'blocked' },
    { userId: 4, userName: 'Admin', userEmail: 'admin@gmail.com', role: 'admin', status: 'active' },
    { userId: 5, userName: 'Agency User', userEmail: 'agency@gmail.com', role: 'agency', status: 'active' },
    { userId: 6, userName: 'Screen Owner', userEmail: 'owner@gmail.com', role: 'screenOwner', status: 'blocked' },

  ];

  searchTerm: string = '';

  filteredList: any[] = [];
  pagedList: any[] = [];

  // pagination
  currentPage: number = 1;
  pageSize: number = 5;
  totalPages: number = 1;
  pageNumbers: number[] = [];

  showingFrom: number = 0;
  showingTo: number = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.filteredList = [...this.list];
    this.updatePagination();
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

  // ✅ Pagination Helpers
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
    // later we can open same add-user form in edit mode
    this.router.navigateByUrl(`/dashboard/users/add?edit=${userId}`);
  }

  deleteUser(userId: number) {
    const ok = confirm('Are you sure you want to delete this user?');
    if (!ok) return;

    // temporary delete in UI
    this.list = this.list.filter(u => u.userId !== userId);
    this.filterUsers();
  }
}
